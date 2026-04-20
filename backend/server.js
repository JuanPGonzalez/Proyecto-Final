const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const startPricingCron = require('./services/pricingCron');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');

const app = express();
app.use(cors());
app.use(express.json());

// Init routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(() => {
  console.log('Database synced');
  startPricingCron();
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error syncing database:', err);
});
