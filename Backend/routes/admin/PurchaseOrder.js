const express = require('express');
const router = express.Router();
const PurchaseOrderController = require('../../controllers/admin/PurchaseOrderController');

// GET /api/admin/po/get-purchase-orders
router.get('/get-purchase-orders', PurchaseOrderController.getPurchaseOrders);

// POST /api/admin/po/create-purchase-order
router.post('/create-purchase-order', PurchaseOrderController.createPurchaseOrder);

// GET /api/admin/po/get-purchase-order-details/:po_number
router.get('/get-purchase-order-details/:po_number', PurchaseOrderController.getPurchaseOrderDetails);

// GET /api/admin/po/download-purchase-order/:po_number
router.get('/download-purchase-order/:po_number', PurchaseOrderController.downloadPurchaseOrder);

// PUT /api/admin/po/update-purchase-orders/:po_number
router.put('/update-purchase-orders/:po_number', PurchaseOrderController.updatePurchaseOrder);

// DELETE /api/admin/po/delete-purchase-orders/:po_number
router.delete('/delete-purchase-orders/:po_number', PurchaseOrderController.deletePurchaseOrder);

module.exports = router;