const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./config/database');

const router = express.Router();
const port = process.env.PORT || 3000;
const multer = require('multer');
const path = require('path');

// Middleware
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/styles/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = 'uploads/styles';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files
router.use('/uploads', express.static('uploads'));

// Basic route
router.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});


//----------Starting endpoints------------

// Company Admin Registration Endpoint
router.post('/api/company-admin-register', async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  if (!name || !email || !phone || !role || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Name validation - no numbers or special chars
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
  }

// Generate company code automatically
const generateCompanyCode = (callback) => {
  db.query('SELECT company_code FROM admin_users WHERE company_code IS NOT NULL ORDER BY company_code DESC LIMIT 1', (err, results) => {
    if (err) {
      return callback(err, null);
    }
    
    let newCompanyCode;
    if (results.length === 0 || !results[0].company_code) {
      // First user or no valid company codes, start with C001
      newCompanyCode = 'C001';
    } else {
      // Extract number from last company code and increment
      const lastCode = results[0].company_code;
      const lastNumber = parseInt(lastCode.substring(1));
      const newNumber = lastNumber + 1;
      newCompanyCode = 'C' + newNumber.toString().padStart(3, '0');
    }
    
    callback(null, newCompanyCode);
  });
};

  // Generate company code first
  generateCompanyCode((codeErr, companyCode) => {
    if (codeErr) {
      return res.status(500).json({ success: false, message: 'Error generating company code' });
    }

    // Check for duplicate email
    db.query('SELECT * FROM admin_users WHERE email = ?', [email], (emailErr, emailRows) => {
      if (emailErr) {
        return res.status(500).json({ success: false, message: 'Error checking email (DB error)' });
      }

      if (emailRows.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      // Check for duplicate phone number and validate phone number
      db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone], (phoneErr, phoneRows) => {
        if (phoneErr) {
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (!/^07\d{8}$/.test(phone)) {
          return res.status(400).json({ success: false, message: 'Phone number must start with 07 and be exactly 10 digits' });
        } else if (phoneRows.length > 0) {
          return res.status(409).json({ success: false, message: 'Phone number already exists' });
        }

        // Local password validation function
        function isValidPassword(password) {
          const lengthValid = password.length >= 8 && password.length <= 12;
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumber = /\d/.test(password);
          const hasSpecialChar = /[\W_]/.test(password);
        
          return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
        }

        if (!isValidPassword(password)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid password'
          });
        }

        // Hash the password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            return res.status(500).json({ success: false, message: 'Error hashing password' });
          }

          // Insert new user with auto-generated company code
          db.query(
            'INSERT INTO admin_users (name, email, phone_number, role, password, company_code) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, role, hashedPassword, companyCode],
            (insertErr, results) => {
              if (insertErr) {
                console.log("Insert error: ", insertErr);
                return res.status(500).json({ success: false, message: 'Database error inserting user' });
              }

              res.json({ 
                success: true, 
                message: 'Admin registered successfully',
                companyCode: companyCode
              });
            }
          );
        });
      });
    });
  });
});

// Admin Registration Endpoint
router.post('/api/register', async (req, res) => {
  const { company_code, name, email, phone, role, password } = req.body;

  if (!company_code || !name || !email || !phone || !role || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Name validation - no numbers or special chars
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
  }

  // Check for duplicate email
  db.query('SELECT * FROM admin_users WHERE email = ?', [email], (emailErr, emailRows) => {
    if (emailErr) {
      return res.status(500).json({ success: false, message: 'Error checking email (DB error)' });
    }

    if (emailRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

  // Check for duplicate phone number and validate phone number
  db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone], (phoneErr, phoneRows) => {
    if (phoneErr) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!/^07\d{8}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must start with 07 and be exactly 10 digits' });
    } else if (phoneRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Phone number already exists' });
    }

     // Local password validation function
    function isValidPassword(password) {
      const lengthValid = password.length >= 8 && password.length <= 12;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[\W_]/.test(password);
    
      return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
   }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

  // Hash the password
  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      return res.status(500).json({ success: false, message: 'Error hashing password' });
    }

    // Insert new user
    db.query(
      'INSERT INTO admin_users (company_code,name, email, phone_number, role, password) VALUES (?, ?, ?, ?, ?,?)',
      [company_code,name, email, phone, role, hashedPassword],
      (insertErr, results) => {
        if (insertErr) {
          console.log("Insert error: ", insertErr);
          return res.status(500).json({ success: false, message: 'Database error inserting user' });
        }

        res.json({ success: true, message: 'User registered successfully' });
      }
    );
  });
});
});
});

// User Login Endpoint
const dbPromise = db.promise();

router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM admin_users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Check if user exists
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email' });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate token 
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,  
        company_code: user.company_code,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        role: user.role,
      },
    });
  });
});

// Display Company admins only
router.get('/api/company-admins', (req, res) => {
  const sql = 'SELECT user_id, name AS Name, email AS Email, phone_number AS Phone, company_code AS Company_Code FROM admin_users WHERE role = "Company_Admin"';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, admins: results });
  });
});

// display all admin users
router.get('/api/view-admins', (req, res) => {
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({ success: false, message: 'Company code is required' });
  }

  const sql = 'SELECT user_id, name AS Name, email AS Email, phone_number AS Phone, role AS Role FROM admin_users WHERE company_code = ? AND role != "VCM_Admin" AND role != "Company_Admin"';  
  db.query(sql, [company_code], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, admins: results });
  });
});

// Get admin by ID
router.get('/api/get-admin/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const [result] = await dbPromise.query('SELECT * FROM admin_users WHERE user_id = ?', [user_id]);
    if (result.length === 0) {
      return res.json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, admin: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Edit admin details with optional password change
router.put('/api/edit-admin/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { name, email, phone_number, role, currentPassword, newPassword } = req.body;

  if (!name || !email || !phone_number || !role) {
    return res.status(400).json({ success: false, message: 'All basic fields are required' });
  }

  try {
    // If password change is requested
    if (currentPassword && newPassword) {
      // First verify the current password
      const [userRows] = await dbPromise.query(
        'SELECT password FROM admin_users WHERE user_id = ?',
        [user_id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRows[0].password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update admin with new password
      const [result] = await dbPromise.query(
        'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ?, password = ? WHERE user_id = ?',
        [name, email, phone_number, role, hashedNewPassword, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      res.json({ success: true, message: 'Admin updated successfully with new password' });
    } else {
      // Update admin without password change
      const [result] = await dbPromise.query(
        'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ? WHERE user_id = ?',
        [name, email, phone_number, role, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      res.json({ success: true, message: 'Admin updated successfully' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Delete admin
router.delete('/api/delete-admin/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const [result] = await dbPromise.query('DELETE FROM admin_users WHERE user_id = ?', [user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found or already deleted' });
    }

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update admin profile (setting)
router.put('/api/update-admin-profile/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { name, email, phone_number, currentPassword, newPassword } = req.body;

  if (!name || !email || !phone_number) {
    return res.status(400).json({ success: false, message: 'All basic fields are required' });
  }

  try {
    // If password change is requested
    if (currentPassword && newPassword) {
      // First verify the current password
      const [userRows] = await dbPromise.query(
        'SELECT password FROM admin_users WHERE user_id = ?',
        [user_id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRows[0].password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update admin with new password
      const [result] = await dbPromise.query(
        'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, password = ? WHERE user_id = ?',
        [name, email, phone_number, hashedNewPassword, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      res.json({ success: true, message: 'Admin updated successfully with new password' });
    } else {
      // Update admin without password change
      const [result] = await dbPromise.query(
        'UPDATE admin_users SET name = ?, email = ?, phone_number = ? WHERE user_id = ?',
        [name, email, phone_number, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      res.json({ success: true, message: 'Admin updated successfully' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});





// Category Management Endpoints

// Get all categories with their subcategories
router.get('/api/get-categories', (req, res) => {
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({ success: false, message: 'Company code is required' });
  }
  const sql = `
  SELECT 
    c1.category_id,
    c1.category_name,
    c1.parent_id,
    c2.category_name as parent_name
  FROM categories c1
  LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
  WHERE c1.company_code = ?
  ORDER BY COALESCE(c1.parent_id, c1.category_id), c1.category_id
`;

  db.query(sql,  [company_code], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Organize categories hierarchically
    const categories = [];
    const categoryMap = {};

    results.forEach(row => {
      if (!row.parent_id) {
        // Main category
        categoryMap[row.category_id] = {
          category_id: row.category_id,
          category_name: row.category_name,
          subcategories: []
        };
        categories.push(categoryMap[row.category_id]);
      } else {
        // Subcategory
        if (categoryMap[row.parent_id]) {
          categoryMap[row.parent_id].subcategories.push({
            category_id: row.category_id,
            category_name: row.category_name,
            parent_id: row.parent_id
          });
        }
      }
    });

    res.json({ success: true, categories });
  });
});

// Get subcategories by parent ID
router.get('/api/subcategories/:parent_id', (req, res) => {
  const { parent_id } = req.params;
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({ success: false, message: 'Company code is required' });
  }

  const sql = `
    SELECT category_id, category_name, parent_id 
    FROM categories 
    WHERE parent_id = ? AND company_code = ?
  `;

  db.query(sql, [parent_id, company_code], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching subcategories' });
    }
    res.json({ success: true, subcategories: results });
  });
});

// Add new category
router.post('/api/add-categories', (req, res) => {
  const { category_name, parent_id,company_code } = req.body;

  if (!category_name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  if (!company_code) {
    return res.status(400).json({ success: false, message: 'Company code is required' });
  }

  // Check if category already exists
  const checkSql = 'SELECT * FROM categories WHERE category_name = ? AND company_code = ?';
  db.query(checkSql, [category_name,company_code || null], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    // Insert new category
    const insertSql = 'INSERT INTO categories (company_code,category_name, parent_id) VALUES (?, ?,?)';
    db.query(insertSql, [company_code,category_name, parent_id || null], (insertErr, results) => {
      if (insertErr) {
        console.error('Insert error:', insertErr);
        return res.status(500).json({ success: false, message: 'Error adding category' });
      }

      res.json({ 
        success: true, 
        message: 'Category added successfully',
        category_id: results.insertId
      });
    });
  });
});

// Update category
router.put('/api/update-categories/:id', (req, res) => {
  const { id } = req.params;
  const { category_name, parent_id } = req.body;

  if (!category_name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  // Prevent setting a category as its own parent or creating circular references
  if (parent_id && parseInt(parent_id) === parseInt(id)) {
    return res.status(400).json({ success: false, message: 'A category cannot be its own parent' });
  }

  // Check if the new parent exists (if parent_id is provided)
  if (parent_id) {
    const checkParentSql = 'SELECT category_id FROM categories WHERE category_id = ?';
    db.query(checkParentSql, [parent_id], (checkErr, checkResults) => {
      if (checkErr) {
        return res.status(500).json({ success: false, message: 'Database error checking parent category' });
      }
      
      if (checkResults.length === 0) {
        return res.status(400).json({ success: false, message: 'Parent category does not exist' });
      }

      // Check for duplicate category name within the same parent
      const duplicateCheckSql = 'SELECT category_id FROM categories WHERE category_name = ? AND parent_id = ? AND category_id != ?';
      db.query(duplicateCheckSql, [category_name, parent_id, id], (dupErr, dupResults) => {
        if (dupErr) {
          return res.status(500).json({ success: false, message: 'Database error checking duplicates' });
        }

        if (dupResults.length > 0) {
          return res.status(409).json({ success: false, message: 'Category name already exists under this parent category' });
        }

        // Update the category
        updateCategory();
      });
    });
  } else {
    // Check for duplicate main category name
    const duplicateCheckSql = 'SELECT category_id FROM categories WHERE category_name = ? AND parent_id IS NULL AND category_id != ?';
    db.query(duplicateCheckSql, [category_name, id], (dupErr, dupResults) => {
      if (dupErr) {
        return res.status(500).json({ success: false, message: 'Database error checking duplicates' });
      }

      if (dupResults.length > 0) {
        return res.status(409).json({ success: false, message: 'Main category name already exists' });
      }

      updateCategory();
    });
  }

  function updateCategory() {
    const sql = 'UPDATE categories SET category_name = ?, parent_id = ? WHERE category_id = ?';
    db.query(sql, [category_name, parent_id || null, id], (err, results) => {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ success: false, message: 'Database error updating category' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, message: 'Category updated successfully' });
    });
  }
});

// Delete category
router.delete('/api/delete-categories/:id', (req, res) => {
  const { id } = req.params;

  // Check if category has subcategories
  const checkSubcategoriesSql = 'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?';
  db.query(checkSubcategoriesSql, [id], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ success: false, message: 'Database error checking subcategories' });
    }

    const subcategoryCount = checkResults[0].count;
    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. It has ${subcategoryCount} subcategories. Please delete subcategories first.` 
      });
    }

    // Delete the category
    const sql = 'DELETE FROM categories WHERE category_id = ?';
    db.query(sql, [id], (err, results) => {
      if (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ success: false, message: 'Database error deleting category' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, message: 'Category deleted successfully' });
    });
  });
});

// Get all styles for a company
router.get('/api/get-styles', (req, res) => {
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({ success: false, message: 'Company code is required' });
  }

  const sql = `
    SELECT 
      s.*,
      c.category_name as subcategory_name,
      p.category_name as main_category_name,
      p.category_id as main_category_id
    FROM styles s
    LEFT JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN categories p ON c.parent_id = p.category_id
    WHERE s.company_code = ?
    ORDER BY s.created_at DESC
  `;

  db.query(sql, [company_code], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching styles' });
    }
    res.json({ success: true, styles: results });
  });
});

// Get single style by ID
router.get('/api/styles/:style_id', (req, res) => {
  const { style_id } = req.params;


  const sql = `
    SELECT s.*, c.category_name 
    FROM styles s
    LEFT JOIN categories c ON s.category_id = c.category_id
    WHERE s.style_id = ?
  `;

  db.query(sql, [style_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching style' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Style not found' });
    }

    res.json({ success: true, style: results[0] });
  });
});

// Add new style - updated for multiple images
router.post('/api/add-styles', upload.array('images', 5), (req, res) => {
  const { 
    company_code, 
    name, 
    description, 
    category_id,
    approved
  } = req.body;

  // Validate required fields
  if (!company_code || !name || !category_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company code, name, and category are required' 
    });
  }

  // Get image paths if files were uploaded
  const imagePaths = req.files ? req.files.map(file => file.filename).join(',') : null;

  // Generate style code from name and check for uniqueness
  const generateStyleCode = (baseName, attempt = 0) => {
    // Convert name to uppercase, remove special characters and spaces
    let styleCode = baseName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6); // Take first 6 characters

    // Add numeric suffix if this is a retry attempt
    if (attempt > 0) {
      styleCode = `${styleCode}${attempt}`;
    }

    return new Promise((resolve, reject) => {
      // Check if generated code exists
      const checkSql = 'SELECT style_id FROM styles WHERE company_code = ? AND style_code = ?';
      db.query(checkSql, [company_code, styleCode], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length > 0) {
          // Code exists, try next attempt
          resolve(generateStyleCode(baseName, attempt + 1));
        } else {
          // Code is unique
          resolve(styleCode);
        }
      });
    });
  };

  // Generate and insert style code
  generateStyleCode(name)
    .then(styleCode => {
      // Insert new style with generated code
      const insertSql = `
        INSERT INTO styles (
          company_code, 
          style_code, 
          name, 
          description, 
          category_id, 
          image,
          approved,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      db.query(
        insertSql, 
        [company_code, styleCode, name, description, category_id, imagePaths, approved || 'no'],
        (err, results) => {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ success: false, message: 'Error adding style' });
          }

          res.json({ 
            success: true, 
            message: 'Style added successfully',
            style_id: results.insertId,
            style_code: styleCode,
            image: imagePaths
          });
        }
      );
    })
    .catch(err => {
      console.error('Style code generation error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error generating style code' 
      });
    });
});

// Update style - also update for multiple images
router.put('/api/update-styles/:style_id', upload.array('images', 5), (req, res) => {
  const { style_id } = req.params;
  const { 
    name, 
    description, 
    category_id, 
    approved 
  } = req.body;

  // Validate required fields
  if (!name || !category_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name and category are required' 
    });
  }

  // Get image paths if files were uploaded
  const imagePaths = req.files && req.files.length > 0 ? req.files.map(file => file.filename).join(',') : null;

  // Check if style exists and get current details
  const checkSql = 'SELECT * FROM styles WHERE style_id = ?';
  db.query(checkSql, [style_id], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Style not found' });
    }

    const existingStyle = checkResults[0];

    // Update style
    const updateSql = `
      UPDATE styles 
      SET name = ?, 
          description = ?, 
          category_id = ?, 
          ${imagePaths ? 'image = ?,' : ''} 
          approved = ?,
          updated_at = NOW()
      WHERE style_id = ?
    `;

    const updateParams = imagePaths 
      ? [name, description, category_id, imagePaths, approved || false, style_id]
      : [name, description, category_id, approved || false, style_id];

    db.query(updateSql, updateParams, (err, results) => {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ success: false, message: 'Error updating style' });
      }

      // If old images exist and new images are uploaded, delete old images
      if (imagePaths && existingStyle.image) {
        const oldImages = existingStyle.image.split(',');
        oldImages.forEach(oldImage => {
          const oldImagePath = path.join(__dirname, 'uploads/styles', oldImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        });
      }

      res.json({ 
        success: true, 
        message: 'Style updated successfully',
        style: {
          style_id,
          style_code: existingStyle.style_code,
          name,
          description,
          category_id,
          image: imagePaths || existingStyle.image,
          approved: approved || false
        }
      });
    });
  });
});

// Delete style and its variants
router.delete('/api/delete-styles/:style_id', (req, res) => {
  const { style_id } = req.params;

  // First get the style_code
  const getStyleSql = 'SELECT style_code FROM styles WHERE style_id = ?';
  
  db.query(getStyleSql, [style_id], (err, styleResults) => {
    if (err) {
      console.error('Error fetching style:', err);
      return res.status(500).json({ success: false, message: 'Error fetching style' });
    }

    if (styleResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Style not found' });
    }

    const style_code = styleResults[0].style_code;

    // Delete variants first
    const deleteVariantsSql = 'DELETE FROM style_variants WHERE style_code = ?';
    
    db.query(deleteVariantsSql, [style_code], (variantErr) => {
      if (variantErr) {
        console.error('Error deleting variants:', variantErr);
        return res.status(500).json({ success: false, message: 'Error deleting style variants' });
      }

      // Then delete the style
      const deleteStyleSql = 'DELETE FROM styles WHERE style_id = ?';
      
      db.query(deleteStyleSql, [style_id], (styleErr, styleResult) => {
        if (styleErr) {
          console.error('Error deleting style:', styleErr);
          return res.status(500).json({ success: false, message: 'Error deleting style' });
        }

        if (styleResult.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Style not found' });
        }

        res.json({ 
          success: true, 
          message: 'Style and its variants deleted successfully' 
        });
      });
    });
  });
});

// Get variants by style code with related data
router.get('/api/get-style-variants/:style_code', (req, res) => {
  const sql = `
    SELECT sv.*, 
           c.color_name, 
           s.size_name, 
           f.fit_name, 
           m.material_name
    FROM style_variants sv
    LEFT JOIN colors c ON sv.color_id = c.color_id
    LEFT JOIN sizes s ON sv.size_id = s.size_id
    LEFT JOIN fits f ON sv.fit_id = f.fit_id
    LEFT JOIN materials m ON sv.material_id = m.material_id
    WHERE sv.style_code = ?
    ORDER BY sv.created_at DESC`;
  
  db.query(sql, [req.params.style_code], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error fetching variants' });
    }
    res.json({ success: true, variants: results });
  });
});

// Add new variant - updated version with checks
router.post('/api/add-style-variants', (req, res) => {
  const { 
    company_code, 
    style_code, 
    color_id, 
    size_id, 
    fit_id, 
    material_id, 
    price 
  } = req.body;

  // Validate required fields
  if (!company_code || !style_code || !color_id || !size_id || !fit_id || !material_id || !price) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Check for duplicate variant
  const checkDuplicateSql = `
    SELECT variant_id FROM style_variants 
    WHERE style_code = ? AND color_id = ? AND size_id = ? AND fit_id = ?`;

  db.query(checkDuplicateSql, [style_code, color_id, size_id, fit_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error checking duplicate variant' });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'This variant combination already exists' });
    }

    // Get the details for SKU generation
    const getDetailsSql = `
      SELECT c.color_name, s.size_name, f.fit_name 
      FROM colors c, sizes s, fits f 
      WHERE c.color_id = ? AND s.size_id = ? AND f.fit_id = ?`;

    db.query(getDetailsSql, [color_id, size_id, fit_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching details' });
      
      const details = results[0];
      const sku = `${style_code}-${details.color_name.substring(0,3).toUpperCase()}-${details.size_name}-${details.fit_name.substring(0,3).toUpperCase()}`;

      const insertSql = `
        INSERT INTO style_variants (
          company_code, style_code, color_id, size_id, fit_id, 
          material_id, price, sku, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
      `;

      db.query(insertSql, [
        company_code, style_code, color_id, size_id, fit_id,
        material_id, price, sku
      ], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error adding variant' });
        res.json({ 
          success: true, 
          message: 'Variant added successfully',
          variant_id: result.insertId,
          sku: sku
        });
      });
    });
  });
});

// Update variant
router.put('/api/update-style-variants/:variant_id', (req, res) => {
  const { variant_id } = req.params;
  const { color_id, size_id, fit_id, material_id, price } = req.body;

  // Check for duplicate variant
  const checkDuplicateSql = `
    SELECT variant_id FROM style_variants 
    WHERE color_id = ? AND size_id = ? AND fit_id = ? AND variant_id != ?`;

  db.query(checkDuplicateSql, [color_id, size_id, fit_id, variant_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error checking duplicate variant' });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'This variant combination already exists' });
    }

    // Get the details for SKU generation
    const getDetailsSql = `
      SELECT s.style_code, c.color_name, s2.size_name, f.fit_name 
      FROM style_variants sv
      JOIN styles s ON sv.style_code = s.style_code
      JOIN colors c ON c.color_id = ?
      JOIN sizes s2 ON s2.size_id = ?
      JOIN fits f ON f.fit_id = ?
      WHERE sv.variant_id = ?`;

    db.query(getDetailsSql, [color_id, size_id, fit_id, variant_id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error fetching details' });
      
      const details = results[0];
      const sku = `${details.style_code}-${details.color_name.substring(0,3).toUpperCase()}-${details.size_name}-${details.fit_name.substring(0,3).toUpperCase()}`;

      const updateSql = `
        UPDATE style_variants 
        SET color_id = ?, size_id = ?, fit_id = ?, material_id = ?, 
            price = ?, sku = ?, updated_at = NOW()
        WHERE variant_id = ?`;

      db.query(updateSql, [
        color_id, size_id, fit_id, material_id, price, sku, variant_id
      ], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error updating variant' });
        res.json({ success: true, message: 'Variant updated successfully' });
      });
    });
  });
});

// Delete variant
router.delete('/api/delete-style-variants/:variant_id', (req, res) => {
  const { variant_id } = req.params;
  
  const sql = 'DELETE FROM style_variants WHERE variant_id = ?';
  db.query(sql, [variant_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting variant' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }
    res.json({ success: true, message: 'Variant deleted successfully' });
  });
});

// Color Management
router.get('/api/get-colors', (req, res) => {
  const { company_code } = req.query;
  const sql = 'SELECT * FROM colors WHERE company_code = ? ORDER BY color_name';
  db.query(sql, [company_code], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching colors' });
    res.json({ success: true, colors: results });
  });
});

router.post('/api/add-colors', (req, res) => {
  const { company_code, color_name, color_code } = req.body;
  const sql = 'INSERT INTO colors (company_code, color_name, color_code) VALUES (?, ?, ?)';
  db.query(sql, [company_code, color_name, color_code], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding color' });
    res.json({ success: true, color_id: result.insertId });
  });
});

router.put('/api/update-colors/:color_id', (req, res) => {
  const { color_id } = req.params;
  const { color_name, color_code } = req.body;
  
  const sql = 'UPDATE colors SET color_name = ?, color_code = ?, updated_at = NOW() WHERE color_id = ?';
  db.query(sql, [color_name, color_code, color_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating color' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Color not found' });
    }
    res.json({ success: true, message: 'Color updated successfully' });
  });
});

router.delete('/api/delete-colors/:color_id', (req, res) => {
  const { color_id } = req.params;
  
  // Check if color is being used in any variants
  const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE color_id = ?';
  db.query(checkSql, [color_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error checking color usage' });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete color as it is being used in style variants' 
      });
    }
    
    const deleteSql = 'DELETE FROM colors WHERE color_id = ?';
    db.query(deleteSql, [color_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error deleting color' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Color not found' });
      }
      res.json({ success: true, message: 'Color deleted successfully' });
    });
  });
});

// Size Management
router.get('/api/get-sizes', (req, res) => {
  const { company_code } = req.query;
  const sql = 'SELECT * FROM sizes WHERE company_code = ? ORDER BY size_order';
  db.query(sql, [company_code], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching sizes' });
    res.json({ success: true, sizes: results });
  });
});

router.post('/api/add-sizes', (req, res) => {
  const { company_code, size_name, size_order } = req.body;
  const sql = 'INSERT INTO sizes (company_code, size_name, size_order) VALUES (?, ?, ?)';
  db.query(sql, [company_code, size_name, size_order], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding size' });
    res.json({ success: true, size_id: result.insertId });
  });
});

router.put('/api/update-sizes/:size_id', (req, res) => {
  const { size_id } = req.params;
  const { size_name, size_order } = req.body;
  
  const sql = 'UPDATE sizes SET size_name = ?, size_order = ?, updated_at = NOW() WHERE size_id = ?';
  db.query(sql, [size_name, size_order, size_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating size' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Size not found' });
    }
    res.json({ success: true, message: 'Size updated successfully' });
  });
});

router.delete('/api/delete-sizes/:size_id', (req, res) => {
  const { size_id } = req.params;
  
  // Check if size is being used in any variants
  const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE size_id = ?';
  db.query(checkSql, [size_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error checking size usage' });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete size as it is being used in style variants' 
      });
    }
    
    const deleteSql = 'DELETE FROM sizes WHERE size_id = ?';
    db.query(deleteSql, [size_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error deleting size' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Size not found' });
      }
      res.json({ success: true, message: 'Size deleted successfully' });
    });
  });
});

// Material Management
router.get('/api/get-materials', (req, res) => {
  const { company_code } = req.query;
  const sql = 'SELECT * FROM materials WHERE company_code = ? ORDER BY material_name';
  db.query(sql, [company_code], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching materials' });
    res.json({ success: true, materials: results });
  });
});

router.post('/api/add-materials', (req, res) => {
  const { company_code, material_name, description } = req.body;
  const sql = 'INSERT INTO materials (company_code, material_name, description) VALUES (?, ?, ?)';
  db.query(sql, [company_code, material_name, description], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding material' });
    res.json({ success: true, material_id: result.insertId });
  });
});

router.put('/api/update-materials/:material_id', (req, res) => {
  const { material_id } = req.params;
  const { material_name, description } = req.body;
  
  const sql = 'UPDATE materials SET material_name = ?, description = ?, updated_at = NOW() WHERE material_id = ?';
  db.query(sql, [material_name, description, material_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating material' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.json({ success: true, message: 'Material updated successfully' });
  });
});

router.delete('/api/delete-materials/:material_id', (req, res) => {
  const { material_id } = req.params;
  
  // Check if material is being used in any variants
  const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE material_id = ?';
  db.query(checkSql, [material_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error checking material usage' });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete material as it is being used in style variants' 
      });
    }
    
    const deleteSql = 'DELETE FROM materials WHERE material_id = ?';
    db.query(deleteSql, [material_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error deleting material' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
      res.json({ success: true, message: 'Material deleted successfully' });
    });
  });
});



// Fit Management
router.get('/api/get-fits', (req, res) => {
  const { company_code } = req.query;
  const sql = 'SELECT * FROM fits WHERE company_code = ? ORDER BY fit_name';
  db.query(sql, [company_code], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching fits' });
    res.json({ success: true, fits: results });
  });
});

router.post('/api/add-fits', (req, res) => {
  const { company_code, fit_name, description } = req.body;
  const sql = 'INSERT INTO fits (company_code, fit_name, description) VALUES (?, ?, ?)';
  db.query(sql, [company_code, fit_name, description], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding fit' });
    res.json({ success: true, fit_id: result.insertId });
  });
});


router.put('/api/update-fits/:fit_id', (req, res) => {
  const { fit_id } = req.params;
  const { fit_name, description } = req.body;
  
  const sql = 'UPDATE fits SET fit_name = ?, description = ?, updated_at = NOW() WHERE fit_id = ?';
  db.query(sql, [fit_name, description, fit_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating fit' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Fit not found' });
    }
    res.json({ success: true, message: 'Fit updated successfully' });
  });
});

router.delete('/api/delete-fits/:fit_id', (req, res) => {
  const { fit_id } = req.params;
  
  // Check if fit is being used in any variants
  const checkSql = 'SELECT COUNT(*) as count FROM style_variants WHERE fit_id = ?';
  db.query(checkSql, [fit_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error checking fit usage' });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete fit as it is being used in style variants' 
      });
    }
    
    const deleteSql = 'DELETE FROM fits WHERE fit_id = ?';
    db.query(deleteSql, [fit_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error deleting fit' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fit not found' });
      }
      res.json({ success: true, message: 'Fit deleted successfully' });
    });
  });
});

module.exports = router;

