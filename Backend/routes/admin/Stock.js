
const express = require('express');
const router = express.Router();
const StockController = require('../../controllers/admin/StockController');

// GET /api/admin/stock/search
router.get('/search', StockController.searchStock);

module.exports = router;
