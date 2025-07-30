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
router.get('/get-admins/:user_id', AuthController.getAdminById);              // Get admin by ID
router.put('/update-admins/:user_id', AuthController.editAdmin);                 // Update admin
router.delete('/delete-admins/:user_id', AuthController.deleteAdmin);           // Delete admin
router.put('/update-admins-profile/:user_id', AuthController.updateAdminProfile); // Update admin profile

module.exports = router;
