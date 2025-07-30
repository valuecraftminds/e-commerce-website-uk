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

module.exports = {
  uploadStyles,  // for style image uploads
  uploadLogo     // for company logo uploads
};
