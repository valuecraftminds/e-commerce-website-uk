const express = require('express');
const router = express.Router();

const ProfileController  = require('../../controllers/customer/ProfileController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');
const { uploadProfileImg } = require('../../middleware/upload');

router.get('/profile', checkCompanyCode, optionalAuth, ProfileController.getProfileDetails);
router.put('/update-profile', checkCompanyCode, optionalAuth, ProfileController.updateProfileDetails);
router.post('/upload-profile-image', checkCompanyCode, optionalAuth, uploadProfileImg.single('profile_image'), ProfileController.uploadProfileImage);
router.delete('/delete-profile-image', checkCompanyCode, optionalAuth, ProfileController.deleteProfileImage);
router.delete('/delete-account', checkCompanyCode, optionalAuth, ProfileController.deleteAccount);

module.exports = router;
