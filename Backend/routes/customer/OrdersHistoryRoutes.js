const express = require('express');
const router = express.Router();
const OrdersHistoryController = require('../../controllers/customer/OrdersHistoyController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

router.get('/all-orders', optionalAuth, checkCompanyCode, OrdersHistoryController.getAllOrders);
router.get('/orders-by-status', optionalAuth, checkCompanyCode, OrdersHistoryController.getOrdersByStatus);
router.get('/order-details/:id', optionalAuth, checkCompanyCode, OrdersHistoryController.getOrderDetails);
router.post('/cancel-order/:orderId', optionalAuth, checkCompanyCode, OrdersHistoryController.cancelOrder);
router.post('/confirm-delivery/:orderId', optionalAuth, checkCompanyCode, OrdersHistoryController.confirmDelivery);

module.exports = router;