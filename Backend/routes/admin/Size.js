const express = require('express');
const SizeController = require('../../controllers/admin/SizeController');
const router = express.Router();


// Size Ranges
router.get('/get-size-ranges', SizeController.getSizeRanges);
router.post('/add-size-range', SizeController.addSizeRange);

router.put('/update-size-range/:size_range_id', SizeController.updateSizeRange);
router.delete('/delete-size-range/:size_range_id', SizeController.deleteSizeRange);

// Sizes (single size, legacy)
router.get('/get-sizes', SizeController.getSizes);
router.post('/add-sizes', SizeController.addSize);
router.put('/update-sizes/:size_id', SizeController.updateSize);
router.delete('/delete-sizes/:size_id', SizeController.deleteSize);

module.exports = router;
