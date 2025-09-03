const express = require('express');
const authController = require('../../controllers/customer/customerAuthController');
const socialAuthController = require('../../controllers/customer/socialAuthController');
const { validateRegistration } = require('../../middleware/customer/CustomerValidation');

const router = express.Router();

router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);
// router.get('/profile', authController.protectedProfile);
router.get('/verify-email', authController.verifyCustomerEmail);

// Social authentication routes
router.post('/google-login', socialAuthController.googleAuth);

module.exports = router;