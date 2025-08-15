const express = require('express');
const wishlistController = require('../../controllers/customer/WishlistController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

const router = express.Router();

router.post('/set-wishlist', optionalAuth, checkCompanyCode, wishlistController.setWishlist);
router.delete('/remove', optionalAuth, checkCompanyCode, wishlistController.removeFromWishlist);
router.get('/get-wishlist', optionalAuth, checkCompanyCode, wishlistController.getWishlist);
router.get('/check-wishlist', optionalAuth, checkCompanyCode, wishlistController.checkWishlist);

module.exports = router;
