const express = require('express');
const FeedbackController = require('../../controllers/customer/FeedbackController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { authenticateCustomer } = require('../../middleware/customer/CustomerAuth');

const router = express.Router();

// Product review routes
router.get('/reviews/:style_id', checkCompanyCode, FeedbackController.getReview);
router.post('/reviews', authenticateCustomer, checkCompanyCode, FeedbackController.addReview);

// General feedback routes
// router.get('/history', authenticateCustomer, checkCompanyCode, FeedbackController.getFeedbackHistory);

module.exports = router;