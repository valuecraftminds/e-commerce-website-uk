const express = require('express');
const router = express.Router();
const invoiceController = require('../../controllers/customer/InvoiceController');
const { checkCompanyCode } = require('../../middleware/customer/CustomerValidation');
const { optionalAuth } = require('../../middleware/customer/CustomerAuth');

// Generate invoice PDF for an order
router.get('/generate/:order_id', checkCompanyCode, optionalAuth, invoiceController.generateInvoice);

// Get invoice data by order ID
router.get('/:order_id', checkCompanyCode, optionalAuth, invoiceController.getInvoice);

module.exports = router;
