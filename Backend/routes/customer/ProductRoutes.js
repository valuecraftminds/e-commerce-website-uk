const express = require('express');
const productController = require('../../controllers/customer/productController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');

const router = express.Router();

router.get('/main-categories', checkCompanyCode, productController.getMainCategories);
router.get('/product-types/:parentId', checkCompanyCode, productController.getProductTypes);
router.get('/styles-by-parent-category/:parentId', checkCompanyCode, productController.getStylesByParentCategory);
router.get('/all-styles', checkCompanyCode, productController.getAllStyles);
router.get('/product/:style_id', checkCompanyCode, productController.getProductDetails);
router.get('/product-listings', checkCompanyCode, productController.getProductListings);
router.get('/search', checkCompanyCode, productController.searchProducts);

module.exports = router;