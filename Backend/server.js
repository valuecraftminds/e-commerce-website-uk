// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const path = require('path');


// const app = express();
// const port = process.env.PORT || 3000;

// // Global middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Debug middleware for logging requests
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
//   console.log('Query params:', req.query);
//   if (req.body && Object.keys(req.body).length > 0) {
//     console.log('Body:', req.body);
//   }
//   next();
// });

// // Serve uploaded files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Import Routes
// // Customer
// const customerRoutes = require('./routes/customer/CustomerRoutes');
// const customerAuthRoutes = require('./routes/customer/CustomerAuthRoutes');
// const cartRoutes = require('./routes/customer/CartRoutes');

// // Admin
// const adminAuthRoutes = require('./routes/admin/AdminAuth');
// const categoryRoutes = require('./routes/admin/Categories');
// const stylesRoutes = require('./routes/admin/Styles');
// const sizeRoutes = require('./routes/admin/Size');
// const colorRoutes = require('./routes/admin/Color');
// const fitRoutes = require('./routes/admin/Fit');
// const materialRoutes = require('./routes/admin/Material');
// const licenseRoutes = require('./routes/admin/License');


// // Route bindings
// // Customer routes
// app.use('/api/customer', customerRoutes);
// app.use('/api/customer/auth', customerAuthRoutes);
// app.use('/api/customer/cart', cartRoutes);

// // Admin routes
// app.use('/api/admin/auth', adminAuthRoutes);
// app.use('/api/admin/categories', categoryRoutes);
// app.use('/api/admin/styles', stylesRoutes);
// app.use('/api/admin/sizes', sizeRoutes);
// app.use('/api/admin/colors', colorRoutes);
// app.use('/api/admin/fits', fitRoutes);
// app.use('/api/admin/materials', materialRoutes);
// app.use('/api/admin/license', licenseRoutes);


// // Default route
// app.get('/', (req, res) => {
//   res.json({ message: 'E-Commerce UK Backend API running successfully.' });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });






// // Basic route
// app.get('/', (req, res) => {
//   res.json({ message: 'E-Commerce UK Backend API running successfully.' });
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
app.use('/admin', adminAuth);
app.use('/category', categoryRoutes);
app.use('/styles', stylesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});



// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/styles/') 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = 'uploads/styles';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files
router.use('/uploads', express.static('uploads'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});