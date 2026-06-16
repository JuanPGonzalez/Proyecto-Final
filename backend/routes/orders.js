const express = require('express');
const router = express.Router();
const { authMiddleware, clientMiddleware, isAdminRole } = require('../middleware/roles');
const sequelize = require('../config/database');
const { Order, OrderItem, Product, User, Notification } = require('../models');
const { ROLES } = require('../middleware/roles');
const { Op } = require('sequelize');
const { sendOrderConfirmation } = require('../services/emailService');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/proofs/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. Crear nueva orden
router.post('/', authMiddleware, clientMiddleware, upload.single('proof'), async (req, res) => {
  try {
    let orderDataRaw = req.body.orderData;
    let orderData = typeof orderDataRaw === 'string' ? JSON.parse(orderDataRaw) : orderDataRaw;

    const { items, shippingAddress, provincia, localidad, localidadId, codigoPostal, shippingMethod, shippingCost, paymentMethod } = orderData;

    let initialStatus = 'Pendiente';
    if (paymentMethod === 'transfer') {
      initialStatus = 'Pendiente de Validación';
      if (!req.file) {
        return res.status(400).json({ error: 'Comprobante requerido para transferencias' });
      }
    }

    // VALIDACIÓN DE STOCK PREVIA A LA COMPRA
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Producto ID ${item.productId} no encontrado` });
      }
      if (Number(product.stock) < Number(item.quantity)) {
        return res.status(400).json({ 
          error: `Stock insuficiente para "${product.name}". Solicitado: ${item.quantity}, Disponible: ${product.stock}` 
        });
      }
    }

    const order = await Order.create({
      total: 0,
      user_id: req.user.id,
      fecha_compra: new Date(),
      status: initialStatus,
      shipping_address: shippingAddress,
      provincia, localidad, codigo_postal: codigoPostal,
      shipping_method: shippingMethod,
      tipo_envio: shippingMethod === 'tienda' ? 'Retiro en tienda' : 'Envío a domicilio',
      shipping_cost: Number(shippingCost) || 0,
      payment_method: paymentMethod,
      payment_receipt: req.file ? req.file.path.replace(/\\/g, '/') : null
    });

    let total = Number(shippingCost) || 0;
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        const subtotal = Number(product.price) * item.quantity;
        total += subtotal;
        await OrderItem.create({
          quantity: item.quantity,
          priceAtPurchase: product.price,
          compra_id: order.id,
          componente_id: item.productId
        });
      }
    }

    await order.update({ total });

    await Notification.create({
      user_id: req.user.id,
      message: `Pedido #${order.id} creado. Estado: ${initialStatus}`,
      type: 'ORDER'
    });

    // Notificación para Admin (Regression Fix)
    await Notification.create({
      type: 'pedido',
      title: 'Nuevo pedido recibido',
      message: `Pedido #${order.id}`,
      reference_id: order.id,
      target_role: ROLES.ADMIN,
      is_read: false
    });

    // Enviar factura por email (fire-and-forget, no bloquea la respuesta)
    try {
      const fullOrder = await Order.findByPk(order.id, {
        include: [User, { model: OrderItem, include: [Product] }]
      });
      if (fullOrder && fullOrder.User?.email) {
        const emailItems = fullOrder.OrderItems.map(oi => ({
          name: oi.Product?.name || 'Producto',
          quantity: oi.quantity,
          priceAtPurchase: oi.priceAtPurchase,
          productId: oi.componente_id
        }));
        sendOrderConfirmation(fullOrder.User.email, fullOrder, emailItems)
          .then(sent => {
            if (sent) console.log(`[Orders] Factura enviada por email para orden #${order.id}`);
            else console.warn(`[Orders] No se pudo enviar email para orden #${order.id}`);
          })
          .catch(err => console.error('[Orders] Error enviando email:', err));
      }
    } catch (emailErr) {
      console.error('[Orders] Error preparando email:', emailErr);
    }

    res.status(201).json({ success: true, orderId: order.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la orden' });
  }
});

// 2. Mover a "En preparación" (Admin)
router.put('/:id/prepare', authMiddleware, async (req, res) => {
  try {
    if (!isAdminRole(req.user.tipoUsuario)) return res.status(403).json({ error: 'Acceso denegado' });

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    if (order.payment_method === 'transfer' && !order.payment_receipt) {
      return res.status(400).json({ error: 'No se puede preparar: falta comprobante de pago' });
    }

    await order.update({ status: 'En preparación' });

    await Notification.create({
      user_id: order.user_id,
      message: `Tu pedido #${order.id} ya está en preparación.`,
      type: 'ORDER'
    });

    res.json({ success: true, status: 'En preparación' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar a preparación' });
  }
});

// 3. Generar PDF de picking para órdenes "En preparación" (MEJORADO)
router.get('/preparing/pdf', authMiddleware, async (req, res) => {
  try {
    if (!isAdminRole(req.user.tipoUsuario)) return res.status(403).json({ error: 'Prohibido' });

    const { Category } = require('../models');
    const orders = await Order.findAll({
      where: { status: 'En preparación' },
      include: [
        { model: User, attributes: ['name', 'dni'] },
        {
          model: OrderItem,
          include: [{
            model: Product,
            include: [Category]
          }]
        }
      ]
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: 'No hay órdenes en preparación' });
    }

    const { applyHardwareHavenBranding, applyCommonFooter } = require('../services/pdfShared');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=productos_para_preparar.pdf');
    doc.pipe(res);

    const groupedTotals = {}; // { category: { productName: quantity } }
    orders.forEach(order => {
      order.OrderItems.forEach(item => {
        if (item.Product) {
          const prodName = item.Product.name;
          const qty = item.quantity;
          const categoryName = item.Product.Category?.descripcion || 'Sin categoría';

          if (!groupedTotals[categoryName]) groupedTotals[categoryName] = {};
          if (!groupedTotals[categoryName][prodName]) groupedTotals[categoryName][prodName] = 0;
          groupedTotals[categoryName][prodName] += qty;
        }
      });
    });

    // --- 1. RESUMEN TOTAL DE PRODUCTOS ---
    applyHardwareHavenBranding(doc, 'RESUMEN TOTAL DE PRODUCTOS');
    doc.fillColor('#64748b').fontSize(10).font('Helvetica-Oblique').text('Consolidado de todas las órdenes en preparación', 40, 155);
    
    let summaryY = 190;
    const categories = Object.keys(groupedTotals).sort();
    
    if (categories.length === 0) {
       doc.text('No hay productos acumulados.', 40, summaryY);
    } else {
       categories.forEach(category => {
         if (summaryY > 700) {
           doc.addPage();
           applyHardwareHavenBranding(doc, 'RESUMEN TOTAL DE PRODUCTOS');
           summaryY = 180;
         }

         doc.fillColor('#64748b').fontSize(11).font('Helvetica-Bold').text(category.toUpperCase(), 40, summaryY);
         summaryY += 18;
         doc.moveTo(40, summaryY).lineTo(200, summaryY).stroke('#cbd5e1');
         summaryY += 10;

         const products = Object.entries(groupedTotals[category]).sort((a, b) => a[0].localeCompare(b[0]));
         
         products.forEach(([name, qty]) => {
           doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold').text(`${qty}x`, 50, summaryY, { continued: true });
           doc.font('Helvetica').text(` ${name}`, 90, summaryY);
           summaryY += 20;

           if (summaryY > 750) {
             doc.addPage();
             applyHardwareHavenBranding(doc, 'RESUMEN TOTAL DE PRODUCTOS');
             summaryY = 180;
           }
         });
         
         summaryY += 15;
       });
    }

    // --- 2. PEDIDOS INDIVIDUALES ---
    orders.forEach((order) => {
      doc.addPage();
      applyHardwareHavenBranding(doc, 'PRODUCTOS PARA PREPARAR');
      doc.fillColor('#64748b').fontSize(11).font('Helvetica-Oblique').text('Órdenes en estado: En preparación', 40, 155);
      let y = 190;

      const clientName = order.User?.name || 'Desconocido';
      const clientDNI = order.User?.dni || 'N/A';
      const shippingAddr = order.shipping_address || 'Retiro en local';

      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(`ORDEN #${order.id}`, 40, y);
      y += 16;
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text('Cliente: ', 40, y, { continued: true });
      doc.font('Helvetica').text(`${clientName} | DNI: ${clientDNI}`);
      y += 12;
      doc.font('Helvetica-Bold').text('Envío a: ', 40, y, { continued: true });
      doc.font('Helvetica').text(shippingAddr);
      
      y += 12;
      doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0');
      y += 8;

      order.OrderItems.forEach(item => {
        if (item.Product) {
          const prodName = item.Product.name;
          const qty = item.quantity;

          doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(`${qty}x`, 40, y, { continued: true });
          doc.font('Helvetica').text(` ${prodName}`, 70, y);
          y += 16;

          if (y > 760) {
            doc.addPage();
            applyHardwareHavenBranding(doc, 'PRODUCTOS PARA PREPARAR (CONTINUACIÓN)');
            y = 180;
          }
        }
      });
    });

    applyCommonFooter(doc);
    doc.end();
  } catch (error) {
    console.error('[Preparing PDF Error]:', error);
    res.status(500).json({ error: 'Error al generar el picking de preparación' });
  }
});

// 4. Obtener órdenes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, clientId, search, tipo_envio } = req.query;
    const where = {};
    const userInclude = { model: User };
    if (status && status !== 'all') where.status = status;
    if (clientId && clientId !== 'all') where.user_id = Number(clientId);
    if (!isAdminRole(req.user.tipoUsuario)) where.user_id = req.user.id;
    if (tipo_envio && tipo_envio !== 'all') where.tipo_envio = tipo_envio;

    if (search && search.trim() !== '') {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        where[Op.or] = [
          { id: searchNum },
          { user_id: searchNum }
        ];
      } else {
        userInclude.where = {
          name: { [Op.like]: `%${search}%` }
        };
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [userInclude, { model: OrderItem, include: [Product] }],
      order: [['id', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      distinct: true
    });

    res.json({ orders: rows, totalPages: Math.ceil(count / limit), totalOrders: count });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// 5. Obtener detalles
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [User, { model: OrderItem, include: [Product] }]
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (!isAdminRole(req.user.tipoUsuario) && order.user_id !== req.user.id) return res.status(403).json({ error: 'Prohibido' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalles' });
  }
});

// 6. Cancelar compra
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Permite cancelar si es Admin o si es el dueño de la orden
    if (!isAdminRole(req.user.tipoUsuario) && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Prohibido. No puedes cancelar esta orden.' });
    }

    if (order.status === 'Cerrada') {
      return res.status(400).json({ error: 'No se puede cancelar una compra ya cerrada.' });
    }
    if (order.status === 'Cancelada') {
      return res.status(400).json({ error: 'La compra ya se encuentra cancelada.' });
    }

    for (const item of order.OrderItems) {
      if (item.Product) {
        await item.Product.increment('stock', { by: item.quantity });
      }
    }

    await order.update({ status: 'Cancelada' });

    const message = isAdminRole(req.user.tipoUsuario) 
      ? `Tu pedido #${order.id} ha sido cancelado por el administrador.`
      : `Has cancelado exitosamente tu pedido #${order.id}.`;

    await Notification.create({
      user_id: order.user_id,
      message: message,
      type: 'ORDER'
    });

    res.json({ success: true, status: 'Cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar la orden' });
  }
});

// 7. Cerrar pedido (Admin) - Antes "Completar entrega"
router.put('/:id/close', authMiddleware, async (req, res) => {
  try {
    if (!isAdminRole(req.user.tipoUsuario)) return res.status(403).json({ error: 'Prohibido' });
    
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, include: [Product] }]
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    if (order.status !== 'En preparación') {
      return res.status(400).json({ error: 'Solo se pueden cerrar pedidos en estado "En preparación".' });
    }

    // Verificar disponibilidad total antes de restar absolutamente nada (Evita estado parcial corrupto)
    for (const item of order.OrderItems) {
      if (item.Product && Number(item.Product.stock) < Number(item.quantity)) {
        return res.status(400).json({ 
          error: `No se puede cerrar el pedido. El stock actual de "${item.Product.name}" (${item.Product.stock}) es inferior a lo solicitado (${item.quantity}). Por favor, repone el inventario primero.`
        });
      }
    }

    // Decremento de stock al cerrar (entrega completada)
    for (const item of order.OrderItems) {
      if (item.Product) {
        await item.Product.decrement('stock', { by: item.quantity });
      }
    }

    await order.update({ status: 'Cerrada' });

    await Notification.create({
      user_id: order.user_id,
      message: `Tu pedido #${order.id} ha sido entregado y cerrado con éxito.`,
      type: 'ORDER'
    });

    res.json({ success: true, status: 'Cerrada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cerrar el pedido' });
  }
});

// 7. Factura PDF
router.get('/:id/invoice', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [User, { model: OrderItem, include: [Product] }]
    });
    if (!order || (!isAdminRole(req.user.tipoUsuario) && order.user_id !== req.user.id)) return res.status(403).json({ error: 'Prohibido' });
    const { generateInvoicePDF } = require('../services/invoiceService');
    const items = order.OrderItems.map(oi => ({
      name: oi.Product?.name || 'Producto',
      quantity: oi.quantity,
      priceAtPurchase: oi.priceAtPurchase,
      productId: oi.componente_id
    }));
    const pdfPath = await generateInvoicePDF(order, items);
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error) {
    console.error('[Invoice PDF Error]:', error);
    res.status(500).json({ error: 'Error en PDF' });
  }
});

module.exports = router;
