const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper to create upload folder if not exists
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Common file filter (allow only images)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Error: Images only!'));
  }
};

// Multer instance for styles
const stylesDir = 'uploads/styles';
ensureDirExists(stylesDir);

const stylesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, stylesDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadStyles = multer({
  storage: stylesStorage,
  fileFilter
});

// Multer instance for company logos
const logoDir = 'uploads/company_logos';
ensureDirExists(logoDir);

const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logoDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter
});

// update profile image
const profileDir = 'uploads/profile_images';
ensureDirExists(profileDir);

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileDir);
  },
  filename: function (req, file, cb) {
    const customerId = req.user?.id || 'unknown';
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(file.originalname);
    const fileName = `profile_${customerId}_${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

const uploadProfileImg = multer({
  storage: profileStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit to 5MB
    files: 1 // Limit to 1 file
  }
});

module.exports = {
  uploadStyles,  // for style image uploads
  uploadLogo,     // for company logo uploads
  uploadProfileImg // for profile image uploads
};
