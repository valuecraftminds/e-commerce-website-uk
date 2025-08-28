const express = require('express');
const AuthController = require('../../controllers/admin/AdminAuthController');
const router = express.Router();
const { uploadLogo } = require('../../middleware/upload');
const multer = require('multer');
const upload = multer();

// ======================
// Admin Authentication
// ======================
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// ======================
// Admin Management

router.post('/create-company', uploadLogo.single('company_logo'), AuthController.createCompany);
router.put('/update-company/:id', uploadLogo.single('company_logo'), AuthController.updateCompany);

router.post('/create-company-admin', upload.none(), AuthController.createCompanyAdmin);
// Email verification endpoint
router.get('/verify-company-admin', AuthController.verifyCompanyAdminEmail);
// Update endpoints
router.put('/update-company-admin/:user_id', uploadLogo.single('company_logo'), AuthController.updateCompanyAdmin); // Update company admin
router.get('/get-admin/:user_id', AuthController.getAdminById);              // Get admin by ID
router.put('/update-admin/:user_id', AuthController.editAdmin);                 // Update admin
router.delete('/delete-admin/:user_id', AuthController.deleteAdmin);           // Delete admin
router.put('/update-admin-profile/:user_id', AuthController.updateAdminProfile); // Update admin profile
router.get('/get-company-admins', AuthController.getCompanyAdmins);              // Get admin by ID
router.get('/get-all-admins', AuthController.getAdminsByCompany);              // Get admin by ID



module.exports = router;
