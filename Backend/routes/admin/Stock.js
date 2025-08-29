
const express = require('express');
const router = express.Router();
const StockController = require('../../controllers/admin/StockController');

// GET /api/admin/stock/get-stock-summary
router.get('/get-stock-summary', StockController.getStockSummary);

module.exports = router;
