const express = require('express');
const AddOffersController = require('../../controllers/admin/ProductOffersController');

const router = express.Router();

router.get('/product-details', AddOffersController.getProductDetailsWithDate);

module.exports = router;