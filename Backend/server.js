const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const multer = require('multer');
const router = express.Router();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Query params:', req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});


// import routes
// customer routes
const customerRoutes = require('./routes/customer/CustomerRoutes');
const customerauth = require('./routes/customer/CustomerAuthRoutes');
const cartRoutes = require('./routes/customer/CartRoutes');

// admin routes
const adminAuth = require('./routes/admin/AdminAuth');
const categoryRoutes = require('./routes/admin/Categories');
const stylesRoutes = require('./routes/admin/Styles');
const sizeRoutes = require('./routes/admin/Size');
const ColorRoutes = require('./routes/admin/Color');
const FitRoutes = require('./routes/admin/Fit');
const MaterialRoutes = require('./routes/admin/Material');


// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// customer routes
app.use('/customer', customerRoutes);
app.use('/auth', customerauth);
app.use('/cart', cartRoutes);


// admin routes

app.use('api/admin/auth', adminAuth);
app.use('api/admin/categories', categoryRoutes);
app.use('api/admin/styles', stylesRoutes);
app.use('api/admin/sizes', sizeRoutes);
app.use('api/admin/colors', ColorRoutes);
app.use('api/admin/fits', FitRoutes);
app.use('api/admin/materials', MaterialRoutes);

// Serve static files
router.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});