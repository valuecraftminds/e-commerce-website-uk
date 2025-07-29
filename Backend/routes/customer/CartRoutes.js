const express = require('express');
const cartController = require('../../controllers/customer/cartController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

const router = express.Router();

router.post('/add', checkCompanyCode, optionalAuth, cartController.addToCart);
router.get('/get-cart', checkCompanyCode, optionalAuth, cartController.getCart);
router.put('/:cart_id', checkCompanyCode, optionalAuth, cartController.updateCartItem);
router.delete('/:cart_id', checkCompanyCode, optionalAuth, cartController.removeFromCart);
router.delete('/clear/all', checkCompanyCode, optionalAuth, cartController.clearCart);
router.post('/merge', checkCompanyCode, optionalAuth, cartController.mergeGuestCart);

module.exports = router;