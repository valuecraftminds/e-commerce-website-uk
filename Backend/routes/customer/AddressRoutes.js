const express = require('express');
const router = express.Router();
const AddressController = require('../../controllers/customer/AddressController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

router.get('/get-address', checkCompanyCode, optionalAuth, AddressController.getAddresses);

module.exports = router;