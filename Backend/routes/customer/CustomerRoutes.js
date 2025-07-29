const express = require('express');
const customerController = require('../../controllers/customer/customerController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');

const router = express.Router();

router.get('/main-categories', checkCompanyCode, customerController.getMainCategories);
router.get('/product-types/:parentId', checkCompanyCode, customerController.getProductTypes);
router.get('/styles-by-parent-category/:parentId', checkCompanyCode, customerController.getStylesByParentCategory);
router.get('/all-styles', checkCompanyCode, customerController.getAllStyles);
router.get('/product/:style_id', checkCompanyCode, customerController.getProductDetails);
router.get('/product-listings', checkCompanyCode, customerController.getProductListings);
router.get('/search', checkCompanyCode, customerController.searchProducts);

module.exports = router;