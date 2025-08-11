const express = require('express');
const router = express.Router();
const PaymentMethodsController = require('../../controllers/customer/PaymentMethodsController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

router.get('/get-payment-methods', checkCompanyCode, optionalAuth, PaymentMethodsController.getPaymentMethods);

module.exports = router;