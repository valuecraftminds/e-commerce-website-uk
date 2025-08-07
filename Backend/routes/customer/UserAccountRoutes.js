const express = require('express');
const router = express.Router();

const UserAccountController  = require('../../controllers/customer/UserAccountController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

router.get('/profile', checkCompanyCode, optionalAuth, UserAccountController.getUserAccountDetails);

module.exports = router;
