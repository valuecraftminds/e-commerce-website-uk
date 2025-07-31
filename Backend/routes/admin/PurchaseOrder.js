const express = require('express');
const PurchaseOrderController = require('../../controllers/admin/PurchaseOrderController');
const router = express.Router();

// Get all purchase orders with filters
router.get('/get-purchase-orders', PurchaseOrderController.getPurchaseOrders);

// Get purchase order details
router.get('/get-purchase-order/:po_number', PurchaseOrderController.getPurchaseOrderDetails);

// Create new purchase order
router.post('/add-purchase-orders', PurchaseOrderController.createPurchaseOrder);

// Update purchase order
router.put('/update-purchase-orders/:po_number', PurchaseOrderController.updatePurchaseOrder);

// Delete purchase order
router.delete('/delete-purchase-orders/:po_number', PurchaseOrderController.deletePurchaseOrder);

module.exports = router;

