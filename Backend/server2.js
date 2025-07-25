const express = require('express');
const router = express.Router();

// Customer routes will go here
router.get('/api/customer/test', (req, res) => {
  res.json({ message: 'Customer API is working' });
});

module.exports = router;
