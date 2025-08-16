// Add these routes to your existing GRN routes file
// (usually something like routes/admin/grn.js or routes/grn.js)

const express = require('express');
const router = express.Router();
const GRNController = require('../../controllers/admin/GRNController'); // Adjust path as needed

// Existing routes...
router.get('/search-po', GRNController.searchPO);
router.get('/po-details/:po_number', GRNController.getPODetails);

router.get('/get-remaining-qty', GRNController.getRemainingQty);
router.post('/create-grn', GRNController.createGRN);

// New routes to add:
router.post('/validate-item', GRNController.validateGRNItem);

// Get all GRN history for a company
router.get('/history', GRNController.getGRNHistory);

// (Optional) Get GRN history for a specific PO
router.get('/grn-history/:po_number', GRNController.getGRNHistory);
router.get('/grn-details/:grn_id', GRNController.getGRNDetails);


module.exports = router;

