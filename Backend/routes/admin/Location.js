const express = require('express');
const LocationController = require('../../controllers/admin/LocationController');
const router = express.Router();

router.get('/get-locations', LocationController.getLocations);
router.post('/add-locations', LocationController.addLocation);
router.put('/update-locations/:location_id', LocationController.updateLocation);
router.delete('/delete-locations/:location_id', LocationController.deleteLocation);

module.exports = router;
