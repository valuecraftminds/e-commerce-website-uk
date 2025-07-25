const express = require('express');
const cors = require('cors');
const adminRoutes = require('./server1');
const customerRoutes = require('./server2');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routers
app.use('/admin', adminRoutes);  // All admin routes will be prefixed with /admin
app.use('/customer', customerRoutes);  // All customer routes will be prefixed with /customer


// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});