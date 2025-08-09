const express = require('express');
const router = express.Router();
const LicenseController = require('../../controllers/admin/LicenseController');

// Add or update license
router.post('/add-license', LicenseController.addLicense);

// Get all licenses with company details
router.get('/all', LicenseController.getAllLicenses);

// Get license by company code
router.get('/get-license/:company_code', LicenseController.getLicense);

// Delete license by company code
router.delete('/:company_code', LicenseController.deleteLicense);

module.exports = router;
