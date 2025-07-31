const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');


const app = express();
const port = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for logging requests
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
//   console.log('Query params:', req.query);
//   if (req.body && Object.keys(req.body).length > 0) {
//     console.log('Body:', req.body);
//   }
//   next();
// });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
// Customer
const customerRoutes = require('./routes/customer/CustomerRoutes');
const customerAuthRoutes = require('./routes/customer/CustomerAuthRoutes');
const cartRoutes = require('./routes/customer/CartRoutes');

// Admin
const adminAuthRoutes = require('./routes/admin/AdminAuth');
const categoryRoutes = require('./routes/admin/Categories');
const stylesRoutes = require('./routes/admin/Styles');
const sizeRoutes = require('./routes/admin/Size');
const colorRoutes = require('./routes/admin/Color');
const fitRoutes = require('./routes/admin/Fit');
const materialRoutes = require('./routes/admin/Material');
const licenseRoutes = require('./routes/admin/License');


// Route bindings
// Customer routes
app.use('/customer', customerRoutes);
app.use('/customer/auth', customerAuthRoutes);
app.use('/customer/cart', cartRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/styles', stylesRoutes);
app.use('/api/admin/sizes', sizeRoutes);
app.use('/api/admin/colors', colorRoutes);
app.use('/api/admin/fits', fitRoutes);
app.use('/api/admin/materials', materialRoutes);
app.use('/api/admin/license', licenseRoutes);


// Default route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});