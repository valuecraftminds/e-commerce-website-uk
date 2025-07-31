const express = require('express');
const CurrencyController = require('../../controllers/admin/CurrencyController');
const router = express.Router();

router.get('/get-currencies', CurrencyController.getCurrency);
router.post('/add-currencies', CurrencyController.addCurrency);
router.put('/update-currencies/:currency_id', CurrencyController.updateCurrency);
router.delete('/delete-currencies/:currency_id', CurrencyController.deleteCurrency);

module.exports = router;
