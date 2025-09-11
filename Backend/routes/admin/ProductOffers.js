const express = require('express');
const ProductOffersController = require('../../controllers/admin/ProductOffersController');

const router = express.Router();

router.get('/product-details', ProductOffersController.getProductDetailsWithDate);
router.post('/create-offer', ProductOffersController.createOffer);
router.put('/remove/:sku', ProductOffersController.removeOffer);
router.get('/search', ProductOffersController.searchProducts);

module.exports = router;