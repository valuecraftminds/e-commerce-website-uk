const express = require('express');
const router = express.Router();
const { getCustomerFooter } = require('../../controllers/customer/FooterController');
const { getPageContent } = require('../../controllers/admin/FooterController');

// Get footer data for customer
router.get('/footer-data', getCustomerFooter);

// Get page content by slug for customer
router.get('/page/:slug', getPageContent);

module.exports = router;
