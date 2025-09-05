const express = require('express');
const router = express.Router();
const BannerController = require('../../controllers/customer/BannerController');

// Routes for customer banner access
router.get('/all-banners', BannerController.getAllBanners);
router.get('/category/:category_id', BannerController.getBannersByCategory);
router.get('/category-name/:category_name', BannerController.getBannersByCategoryName);

module.exports = router;