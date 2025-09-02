
const express = require('express');
const router = express.Router();
const StockController = require('../../controllers/admin/StockController');

// GET /api/admin/stock/get-stock-summary
router.get('/get-stock-summary', StockController.getStockSummary);
// GET /api/admin/stock/main-stock-summary
router.get('/main-stock-summary', StockController.getMainStockSummary);
// GET /api/admin/stock/issued-stock
router.get('/issued-stock', StockController.getIssuedStock);
// GET /api/admin/stock/grn-stock
router.get('/grn-stock', StockController.getGrnStock);

module.exports = router;
