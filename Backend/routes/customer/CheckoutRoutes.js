const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/customer/CheckoutController');


router.post('/checkout-details', checkoutController.submitCheckout);

module.exports = router;