const express = require('express');
const StyleController = require('../../controllers/admin/StyleController');
const router = express.Router();

router.get('/styles-by-parent-category/:parentId', StyleController.getStylesByParentCategory);
router.get('/all-styles', StyleController.getAllStyles);
router.get('/product/:style_id', StyleController.getProductDetails);
router.get('/product-listings', StyleController.getProductListings);

module.exports = router;