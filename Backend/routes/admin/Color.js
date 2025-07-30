const express = require('express');
const ColorController = require('../../controllers/admin/ColorController');
const router = express.Router();

router.get('/get-colors', ColorController.getColors);
router.post('/add-colors', ColorController.addColor);
router.put('/update-colors/:color_id', ColorController.updateColor);
router.delete('/delete-colors/:color_id', ColorController.deleteColor);

module.exports = router;
