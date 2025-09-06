const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');


const app = express();
const port = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Query params:', req.query);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
// Import Routes
// Customer
const productRoutes = require('./routes/customer/ProductRoutes');
const customerAuthRoutes = require('./routes/customer/CustomerAuthRoutes');
const cartRoutes = require('./routes/customer/CartRoutes');
const CurrencyRoutes = require('./routes/customer/CurrencyRoutes');
const checkoutRoutes = require('./routes/customer/CheckoutRoutes');
const ProfileRoutes = require('./routes/customer/ProfileRoutes');
const CompanyDetailsRoutes = require('./routes/customer/CompanyDetailsRoutes');
const AddressRoutes = require('./routes/customer/AddressRoutes');
const PaymentMethodsRoutes = require('./routes/customer/PaymentMethodsRoutes');
const wishlistRoutes = require('./routes/customer/WishlistRoutes');
const OrdersHistoryRoutes = require('./routes/customer/OrdersHistoryRoutes');
const FeedbackRoutes = require('./routes/customer/FeedbackRoutes');
const InvoiceRoutes = require('./routes/customer/InvoiceRoutes');
const customerBannerRoutes = require('./routes/customer/Banner');
const customerFooterRoutes = require('./routes/customer/Footer');

// Admin
const adminAuthRoutes = require('./routes/admin/AdminAuth');
const categoryRoutes = require('./routes/admin/Categories');
const stylesRoutes = require('./routes/admin/Styles');
const sizeRoutes = require('./routes/admin/Size');
const colorRoutes = require('./routes/admin/Color');
const fitRoutes = require('./routes/admin/Fit');
const materialRoutes = require('./routes/admin/Material');
const licenseRoutes = require('./routes/admin/License');
const currencyRoutes = require('./routes/admin/Currency');
const supplierRoutes = require('./routes/admin/Supplier');
const purchaseOrderRoutes = require('./routes/admin/PurchaseOrder');
const companyRoutes = require('./routes/admin/Company');
const GRNRoutes = require('./routes/admin/GRN');
const LocationRoutes = require('./routes/admin/Location');
const StockRoutes = require('./routes/admin/Stock');
const IssuingRoutes = require('./routes/admin/Issuing');
const ProductOffersRoutes = require('./routes/admin/ProductOffers');
const bannerRoutes = require('./routes/admin/Banner');
const footerRoutes = require('./routes/admin/Footer');


// Route bindings
// Customer routes
app.use('/api/customer', productRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/customer/cart', cartRoutes);
app.use('/api/customer/currency', CurrencyRoutes);
app.use('/api/customer/checkout', checkoutRoutes);
app.use('/api/customer/user', ProfileRoutes);
app.use('/api/customer/company', CompanyDetailsRoutes);
app.use('/api/customer/address', AddressRoutes);
app.use('/api/customer/payment-methods', PaymentMethodsRoutes);
app.use('/api/customer/wishlist', wishlistRoutes);
app.use('/api/customer/orders', OrdersHistoryRoutes);
app.use('/api/customer/feedback', FeedbackRoutes);
app.use('/api/customer/invoices', InvoiceRoutes);
app.use('/api/customer/banners', customerBannerRoutes);
app.use('/api/customer', customerFooterRoutes);


// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/styles', stylesRoutes);
app.use('/api/admin/sizes', sizeRoutes);
app.use('/api/admin/colors', colorRoutes);
app.use('/api/admin/fits', fitRoutes);
app.use('/api/admin/materials', materialRoutes);
app.use('/api/admin/license', licenseRoutes);
app.use('/api/admin/currencies', currencyRoutes);
app.use('/api/admin/suppliers', supplierRoutes);
app.use('/api/admin/po', purchaseOrderRoutes);
app.use('/api/admin', companyRoutes);
app.use('/api/admin/grn', GRNRoutes);
app.use('/api/admin/locations', LocationRoutes);
app.use('/api/admin/stock', StockRoutes);
app.use('/api/admin/issuing', IssuingRoutes);
app.use('/api/admin/offers', ProductOffersRoutes);
app.use('/api/admin/banners', bannerRoutes);
app.use('/api/admin/footer', footerRoutes);


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

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

