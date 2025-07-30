const express = require('express');
const StyleController = require('../../controllers/admin/StyleController');
const router = express.Router();
const upload = require('../../middleware/upload'); // This path should now be correct

// Styles
router.get('/get-styles', StyleController.getAllStyles);
router.get('/styles/:style_id', StyleController.getStyleById);
router.post('/add-styles', upload.array('images', 5), StyleController.addStyle);
router.put('/update-styles/:style_id', upload.array('images', 5), StyleController.updateStyle);
router.delete('/delete-styles/:style_id', StyleController.deleteStyle);

// Style Variants
router.get('/get-style-variants/:style_code', StyleController.getStyleVariants);
router.post('/add-style-variants', StyleController.addVariant);
router.put('/update-style-variants/:variant_id', StyleController.updateVariant);
router.delete('/delete-style-variants/:variant_id', StyleController.deleteVariant);

module.exports = router;
