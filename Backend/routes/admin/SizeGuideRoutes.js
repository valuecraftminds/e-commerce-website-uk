const express = require('express');
const router = express.Router();
const SizeGuideController = require('../../controllers/admin/SizeGuideController');

// Size Guide routes
router.get('/:style_number', SizeGuideController.getSizeGuide);
router.post('/save', SizeGuideController.saveSizeGuide);
router.delete('/:style_number', SizeGuideController.deleteSizeGuide);

module.exports = router;