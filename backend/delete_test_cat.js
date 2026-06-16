const { Category, Product } = require('./models');
const { Op } = require('sequelize');

async function run() {
  try {
    const cats = await Category.findAll({
      where: {
        descripcion: {
          [Op.like]: '%test%'
        }
      }
    });
    console.log("Categories found:", cats.map(c => c.toJSON()));
    
    if (cats.length > 0) {
      const catId = cats[0].id;
      // Reassign products to a default category, for example 1 or null if allowed
      const defaultCat = await Category.findOne({ where: { id: { [Op.ne]: catId } } });
      const newCatId = defaultCat ? defaultCat.id : 1;
      
      const updated = await Product.update({ categoria_id: newCatId }, { where: { categoria_id: catId } });
      console.log("Products moved to new category:", newCatId, "Count:", updated[0]);
      
      const deleted = await Category.destroy({ where: { id: catId } });
      console.log("Deleted count:", deleted);
    }
  } catch(e) {
    console.error(e);
  }
}
run();
