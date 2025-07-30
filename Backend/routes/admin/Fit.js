const express = require('express');
const FitController = require('../../controllers/admin/FitController');
const router = express.Router();

router.get('/get-fits', FitController.getFits);
router.post('/add-fits', FitController.addFit);
router.put('/update-fits/:fit_id', FitController.updateFit);
router.delete('/delete-fits/:fit_id', FitController.deleteFit);

module.exports = router;
