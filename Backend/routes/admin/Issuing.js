const express = require('express');
const IssuingController = require('../../controllers/admin/IssuingController');
const router = express.Router();

// Original booking routes
router.get('/bookings', IssuingController.getBookings);

// Order-based routes
router.get('/orders', IssuingController.getOrders);
router.get('/orders/:order_id', IssuingController.getOrderDetails);
router.get('/main-stock', IssuingController.getMainStock);

// Bulk issuing route
router.post('/orders/:order_id/issue-all', IssuingController.issueAllOrderItems);

// PDF generation routes
router.get('/orders/:order_id/picking-list', IssuingController.generatePickingList);
router.get('/orders/:order_id/packing-label', IssuingController.generatePackingLabel);

module.exports = router;
