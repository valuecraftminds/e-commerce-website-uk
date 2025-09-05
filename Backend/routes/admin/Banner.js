const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BannerController = require('../../controllers/admin/BannerController');

// Create uploads/banners directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/banners');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for banner uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes
router.get('/get-banners', BannerController.getBanners);
router.get('/get-banners/:category_id', BannerController.getBannersByCategory);
router.post('/add-banner', upload.single('banner_image'), BannerController.addBanner);
router.put('/update-banner/:banner_id', upload.single('banner_image'), BannerController.updateBanner);
router.delete('/delete-banner/:banner_id', BannerController.deleteBanner);

module.exports = router;