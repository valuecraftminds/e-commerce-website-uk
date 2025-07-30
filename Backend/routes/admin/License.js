const express = require('express');
const router = express.Router();
const LicenseController = require('../../controllers/admin/LicenseController');

// Add or update license
router.post('/add-license', LicenseController.addLicense);

// Get license
router.get('/get-license/:company_code', LicenseController.getLicense);

module.exports = router;
