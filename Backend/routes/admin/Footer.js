const express = require('express');
const router = express.Router();
const {
  getFooterSections,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
  createFooterItem,
  updateFooterItem,
  deleteFooterItem
} = require('../../controllers/admin/FooterController');

// Footer section routes
router.get('/sections', getFooterSections);
router.post('/sections', createFooterSection);
router.put('/sections/:footer_id', updateFooterSection);
router.delete('/sections/:footer_id', deleteFooterSection);

// Footer item routes
router.post('/items', createFooterItem);
router.put('/items/:item_id', updateFooterItem);
router.delete('/items/:item_id', deleteFooterItem);

module.exports = router;