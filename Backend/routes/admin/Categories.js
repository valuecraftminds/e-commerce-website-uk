const express = require('express');
const CategoryController = require('../../controllers/admin/CategoryController');
const router = express.Router();

router.get('/get-categories', CategoryController.getCategories);
router.get('/subcategories/:parent_id', CategoryController.getSubcategories);
router.post('/add-categories', CategoryController.addCategory);
router.put('/update-categories/:id', CategoryController.updateCategory);
router.delete('/delete-categories/:id', CategoryController.deleteCategory);

module.exports = router;
