const express = require('express');
const SupplierController = require('../../controllers/admin/SupplierController');
const router = express.Router();

router.get('/get-suppliers', SupplierController.getSupplier);
router.post('/add-suppliers', SupplierController.addSupplier);
router.put('/update-suppliers/:supplier_id', SupplierController.updateSupplier);
router.delete('/delete-suppliers/:supplier_id', SupplierController.deleteSupplier);

module.exports = router;
