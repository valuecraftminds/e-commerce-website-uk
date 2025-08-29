const express = require('express');
const StyleController = require('../../controllers/admin/StyleController');
const StyleAttributesController = require('../../controllers/admin/StyleAttributesController');
const router = express.Router();
const { uploadStyles } = require('../../middleware/upload');

// Styles
router.get('/get-styles', StyleController.getAllStyles);
router.get('/styles/:style_id', StyleController.getStyleById);
router.post('/add-styles', uploadStyles.array('images', 5), StyleController.addStyle);
router.put('/update-styles/:style_id', uploadStyles.array('images', 5), StyleController.updateStyle);
router.put('/update-is-view/:style_id', StyleController.updateIsView);
router.delete('/delete-styles/:style_id', StyleController.deleteStyle);

// Style Variants
router.get('/get-style-variants/:style_number', StyleController.getStyleVariants);
router.post('/add-style-variants', StyleController.addVariant);
router.put('/update-style-variants/:variant_id', StyleController.updateVariant);
router.delete('/delete-style-variants/:variant_id', StyleController.deleteVariant);
router.get('/get-style-variants-by-sku/:sku', StyleController.getStyleVariantsBySKU);
router.get('/search-variants', StyleController.searchVariants);

router.get('/get-style/:style_number', StyleAttributesController.getStyle);
router.get('/get-style-attributes/:style_number', StyleAttributesController.getStyleAttributes);
router.post('/add-style-attributes', StyleAttributesController.addStyleAttributes);
router.delete('/remove-style-attribute', StyleAttributesController.removeStyleAttribute);


module.exports = router;
