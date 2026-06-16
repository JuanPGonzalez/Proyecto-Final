const { Product, Category } = require('../models');
const { Op } = require('sequelize');

/**
 * Service to calculate compatible products based on items already in the cart.
 * Reuses the logic from the PC Builder (Presupuestador).
 */
const getCompatibleProducts = async (cartItems) => {
  if (!cartItems || cartItems.length === 0) return [];

  // Identify key components in cart
  const cpu = cartItems.find(i => Number(i.categoria_id) === 1);
  const mobo = cartItems.find(i => Number(i.categoria_id) === 2);
  const gpu = cartItems.find(i => Number(i.categoria_id) === 4);

  let compatibleProducts = [];

  // CASE 1: Have CPU -> Suggest compatible Motherboards
  if (cpu && !mobo) {
    compatibleProducts = await Product.findAll({
      where: {
        categoria_id: 2, // Motherboards
        socket: cpu.socket,
        isActive: true,
        stock: { [Op.gt]: 0 }
      },
      limit: 4
    });
  }

  // CASE 2: Have Motherboard -> Suggest compatible CPUs and RAMs
  if (mobo && compatibleProducts.length === 0) {
    // Try suggesting RAM first if not present
    const ram = cartItems.find(i => Number(i.categoria_id) === 3);
    if (!ram) {
      compatibleProducts = await Product.findAll({
        where: {
          categoria_id: 3, // RAM
          memoryType: mobo.memoryType,
          isActive: true,
          stock: { [Op.gt]: 0 }
        },
        limit: 4
      });
    }
    
    // If no RAM found or already have it, suggest CPU
    if (compatibleProducts.length === 0 && !cpu) {
      compatibleProducts = await Product.findAll({
        where: {
          categoria_id: 1, // CPU
          socket: mobo.socket,
          isActive: true,
          stock: { [Op.gt]: 0 }
        },
        limit: 4
      });
    }
  }

  // CASE 3: Have GPU -> Suggest Sources/PSU
  if (gpu && compatibleProducts.length === 0) {
    const psu = cartItems.find(i => Number(i.categoria_id) === 7);
    if (!psu) {
      compatibleProducts = await Product.findAll({
        where: {
          categoria_id: 7, // PSU
          isActive: true,
          stock: { [Op.gt]: 0 }
        },
        limit: 4
      });
    }
  }

  // FALLBACK: Category-based suggestions if no compatibility rules matched
  if (compatibleProducts.length === 0) {
    const lastItem = cartItems[cartItems.length - 1];
    const category = Number(lastItem.categoria_id);

    const fallbackMap = {
      4: [1, 2, 6], // GPU -> CPU, Mother, Cooler
      1: [2, 3],    // CPU -> Mother, RAM
      2: [1, 3],    // Mother -> CPU, RAM
      3: [1, 2],    // RAM -> CPU, Mother
      27: [28, 25], // Teclado -> Mouse, Monitor
    };

    const relatedCatIds = fallbackMap[category] || [];
    if (relatedCatIds.length > 0) {
      compatibleProducts = await Product.findAll({
        where: {
          categoria_id: { [Op.in]: relatedCatIds },
          isActive: true,
          stock: { [Op.gt]: 0 },
          id: { [Op.notIn]: cartItems.map(i => i.id) }
        },
        limit: 4
      });
    }
  }

  return compatibleProducts;
};

module.exports = { getCompatibleProducts };
