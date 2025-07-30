const express = require('express');
const AuthController = require('../../controllers/admin/AdminAuthController');
const router = express.Router();
const { uploadLogo } = require('../../middleware/upload');


// ======================
// Admin Authentication
// ======================
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// ======================
// Admin Management
// ======================
router.post('/register-company-admin', uploadLogo.single('company_logo'), AuthController.registerCompanyAdmin);
router.get('/get-admin/:user_id', AuthController.getAdminById);              // Get admin by ID
router.put('/update-admin/:user_id', AuthController.editAdmin);                 // Update admin
router.delete('/delete-admin/:user_id', AuthController.deleteAdmin);           // Delete admin
router.put('/update-admin-profile/:user_id', AuthController.updateAdminProfile); // Update admin profile
router.get('/get-company-admins', AuthController.getCompanyAdmins);              // Get admin by ID
router.get('/get-all-admins', AuthController.getAdminsByCompany);              // Get admin by ID



module.exports = router;
