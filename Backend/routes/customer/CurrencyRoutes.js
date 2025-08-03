const express = require('express');
const router = express.Router();
const { getCurrencyRates } = require('../../controllers/customer/currencyController');

// GET /customer/currency/rates
router.get('/rates', getCurrencyRates);

module.exports = router;
