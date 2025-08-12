const express = require('express');
const companyDetailsController = require('../../controllers/customer/CompanyDetailsController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');

const router = express.Router();

router.get('/get-company-details', checkCompanyCode, companyDetailsController.getCompanyDetails);

module.exports = router;