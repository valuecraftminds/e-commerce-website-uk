const express = require('express');
const router = express.Router();
const { getCustomerFooter } = require('../../controllers/customer/FooterController');

// Get footer data for customer
router.get('/footer-data', getCustomerFooter);

module.exports = router;
