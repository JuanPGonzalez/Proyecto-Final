const express = require('express');
const router = express.Router();
const { authMiddleware, clientMiddleware, isAdminRole } = require('../middleware/roles');
const sequelize = require('../config/database');
const { Order, OrderItem, Product, User, Notification } = require('../models');
const { ROLES } = require('../middleware/roles');

const { sendOrderConfirmation } = require('../services/emailService');

// Obtener órdenes (con paginación)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    
    const statusFilter = req.query.status;
    const sortBy = req.query.sortBy || 'date_desc';

    const where = isAdminRole(req.user.tipoUsuario) ? {} : { user_id: req.user.id };
    if (statusFilter) where.status = statusFilter;

    let orderArray = [['id', 'DESC']];
    if (sortBy === 'date_asc') orderArray = [['id', 'ASC']];
    if (sortBy === 'total_desc') orderArray = [['total', 'DESC']];
    if (sortBy === 'total_asc') orderArray = [['total', 'ASC']];

    const include = [
      {
        model: OrderItem,
        include: [Product]
      }
    ];
    if (isAdminRole(req.user.tipoUsuario)) {
      include.push({ model: User, attributes: ['id', 'name', 'email', 'tipoUsuario'] });
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include,
      order: orderArray,
      limit,
      offset,
      distinct: true
    });

    res.json({
      orders: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalOrders: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Crear nueva orden
router.post('/', authMiddleware, clientMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress, localidad, codigoPostal, shippingMethod } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No hay productos' });

    // Calcular total real en el backend para seguridad
    let calculatedTotal = 0;
    const itemsWithNames = [];
    
    for(const item of items) {
      const product = await Product.findByPk(item.productId);
      if(!product) continue;
      calculatedTotal += Number(product.price) * item.quantity;
      itemsWithNames.push({
        ...item,
        name: product.name,
        priceAtPurchase: product.price
      });
    }

    const shippingCost = shippingMethod === 'tienda' ? 0 : (shippingMethod === 'express' ? 5000 : 3000);
    const finalTotal = calculatedTotal + shippingCost;

    const order = await Order.create({
      total: finalTotal,
      user_id: req.user.id,
      fecha_compra: new Date(),
      status: 'Pendiente',
      shipping_address: shippingAddress,
      localidad: localidad,
      codigo_postal: codigoPostal,
      shipping_method: shippingMethod,
      shipping_cost: shippingCost
    });

    for (const item of itemsWithNames) {
      await OrderItem.create({
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        compra_id: order.id,
        componente_id: item.productId
      });
    }

    // ENVIAR EMAIL DE CONFIRMACIÓN AL COMPLETAR COMPRA
    try {
      const user = await User.findByPk(req.user.id);
      if (user && user.email) {
        // Enviar asíncronamente para no bloquear la respuesta
        sendOrderConfirmation(user.email, order, itemsWithNames).catch(console.error);
      }
    } catch (e) {
      console.error('Error triggering email on checkout:', e);
    }

    // Notificaciones de nueva orden
    try {
      // Para el cliente
      await Notification.create({
        user_id: req.user.id,
        message: `Tu orden #${order.id} ha sido recibida con éxito y está en estado Pendiente.`,
        type: 'ORDER'
      });

      // Para todos los admins
      const admins = await User.findAll({ where: { tipoUsuario: ROLES.ADMIN } });
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        message: `Nueva orden #${order.id} creada por el usuario ID: ${req.user.id}. Total: $${finalTotal}.`,
        type: 'ORDER'
      }));
      if (adminNotifications.length > 0) {
        await Notification.bulkCreate(adminNotifications);
      }
    } catch (e) {
      console.error('Error creating order notifications:', e);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Fallo al procesar la compra' });
  }
});

// Actualizar estado de orden (Admin)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (!isAdminRole(req.user.tipoUsuario)) return res.status(403).json({ error: 'Prohibido' });
    
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [User, { model: OrderItem, include: [Product] }]
    });

    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    await order.update({ status });

    // Si se cierra, descontar stock y enviar email
    if (status === 'Cerrada' && order.status !== 'Cerrada') {
      const items = order.OrderItems.map(oi => ({
        name: oi.Product.name,
        priceAtPurchase: oi.priceAtPurchase
      }));
      
      // Descontar stock al cerrar el pedido
      for (const oi of order.OrderItems) {
        if (oi.Product) {
          await oi.Product.decrement('stock', { by: oi.quantity });
        }
      }

      await sendOrderConfirmation(order.User.email, order, items);
    }

    // Notificación para el cliente por cambio de estado
    try {
      await Notification.create({
        user_id: order.user_id,
        message: `El estado de tu orden #${order.id} ha sido actualizado a: ${status}.`,
        type: 'ORDER'
      });
    } catch (e) {
      console.error('Error creating status notification:', e);
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Descargar Comprobante (PDF)
router.get('/:id/invoice', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'email', 'name'] },
        { model: OrderItem, include: [Product] }
      ]
    });

    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Verificar propiedad o ser admin
    if (!isAdminRole(req.user.tipoUsuario) && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este comprobante' });
    }

    const { generateInvoicePDF } = require('../services/invoiceService');
    
    const items = order.OrderItems.map(oi => ({
      name: oi.Product.name,
      quantity: oi.quantity,
      priceAtPurchase: oi.priceAtPurchase
    }));

    const pdfPath = await generateInvoicePDF(order, items);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante_${order.id}.pdf`);
    
    const fileStream = require('fs').createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[Invoice Download Error]:', error);
    res.status(500).json({ error: 'Error al generar el comprobante' });
  }
});

module.exports = router;
