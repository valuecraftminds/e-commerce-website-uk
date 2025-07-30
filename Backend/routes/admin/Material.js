const express = require('express');
const MaterialController = require('../../controllers/admin/MaterialController');
const router = express.Router();

router.get('/get-materials', MaterialController.getMaterials);
router.post('/add-materials', MaterialController.addMaterial);
router.put('/update-materials/:material_id', MaterialController.updateMaterial);
router.delete('/delete-materials/:material_id', MaterialController.deleteMaterial);

module.exports = router;
