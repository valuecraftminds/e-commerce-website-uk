const express = require('express');
const IssuingController = require('../../controllers/admin/IssuingController');
const router = express.Router();

router.get('/bookings', IssuingController.getBookings);
router.get('/main-stock', IssuingController.getMainStock);
router.post('/issue', IssuingController.issueStock);

module.exports = router;
