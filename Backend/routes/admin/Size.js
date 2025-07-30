const express = require('express');
const SizeController = require('../../controllers/admin/SizeController');
const router = express.Router();

router.get('/get-sizes', SizeController.getSizes);
router.post('/add-sizes', SizeController.addSize);
router.put('/update-sizes/:size_id', SizeController.updateSize);
router.delete('/delete-sizes/:size_id', SizeController.deleteSize);

module.exports = router;
