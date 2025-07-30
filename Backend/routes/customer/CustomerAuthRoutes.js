const express = require('express');
const authController = require('../../controllers/customer/customerAuthController');
const { validateRegistration } = require('../../middleware/customer/CustomerValidation');

const router = express.Router();

router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);
// router.get('/profile', authController.protectedProfile);

module.exports = router;