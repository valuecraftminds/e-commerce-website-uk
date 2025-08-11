const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/customer/CheckoutController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

router.post('/checkout-details', checkCompanyCode, optionalAuth, checkoutController.submitCheckout);

module.exports = router;