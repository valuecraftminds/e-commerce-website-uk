const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/customer/CheckoutController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

router.post('/submit-checkout', checkCompanyCode, optionalAuth, checkoutController.submitCheckout);
router.get('/get-tax/:country', checkCompanyCode, optionalAuth, checkoutController.getTaxRate);

module.exports = router;