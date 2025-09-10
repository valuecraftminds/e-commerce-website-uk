const express = require('express');
const router = express.Router();
const TaxController = require('../../controllers/admin/TaxController');

// Tax Routes
// api/admin/tax
router.get('/get', TaxController.getAllTaxRates);
router.post('/add', TaxController.addTaxRate);
router.put('/update/:tax_id', TaxController.updateTaxRate);

module.exports = router;