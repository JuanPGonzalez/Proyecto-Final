const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const startPricingCron = require('./services/pricingCron');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ticketsRoutes = require('./routes/tickets');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const componenteRoutes = require('./routes/Componente');
const pricingRoutes = require('./routes/pricing');
const mlRoutes = require('./routes/ml');
const cartRoutes = require('./routes/cart');

const app = express();
app.use(cors());
app.use(express.json());
const session = require('express-session');

// Simple in-memory session for cart handling (suitable for dev).
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'TEST OK' });
});


// Init routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/componentes', componenteRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/cart', cartRoutes);

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
