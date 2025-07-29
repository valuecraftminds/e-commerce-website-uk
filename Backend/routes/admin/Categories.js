const express = require('express');
const CategoryController = require('../../controllers/admin/CategoryController');
const router = express.Router();

router.get('/main-categories', CategoryController.getMainCategories);
router.get('/product-types/:parentId', CategoryController.getProductTypesByParent);

module.exports = router;