const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const e = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');

});


// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce UK Backend API running successfully.' });
});


//----------Starting endpoints------------

// User Registration Endpoint
app.post('/api/admin-register', async (req, res) => {
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


// User Registration Endpoint
app.post('/api/register', async (req, res) => {
  const { company_code,name, email, phone, role, password } = req.body;

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

app.post('/api/login', async (req, res) => {
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


// display all admin users
app.get('/api/viewAdmins', (req, res) => {
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
app.get('/api/admin/:user_id', async (req, res) => {
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

// Edit admin details
app.put('/api/editAdmin/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { name, email, phone_number, role } = req.body;

  if (!name || !email || !phone_number || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const [result] = await dbPromise.query(
      'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ? WHERE user_id = ?',
      [name, email, phone_number, role, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, message: 'Admin updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});


// Delete admin
app.delete('/api/deleteAdmin/:user_id', async (req, res) => {
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




// Category Management Endpoints

// Get all categories with their subcategories
app.get('/api/get-categories', (req, res) => {
  const sql = `
    SELECT 
      c1.category_id,
      c1.category_name,
      c1.parent_id,
      c2.category_name as parent_name
    FROM categories c1
    LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
    ORDER BY COALESCE(c1.parent_id, c1.category_id), c1.category_id
  `;

  db.query(sql, (err, results) => {
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

// Add new category
app.post('/api/add-categories', (req, res) => {
  const { category_name, parent_id } = req.body;

  if (!category_name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  // Check if category already exists
  const checkSql = 'SELECT * FROM categories WHERE category_name = ? AND parent_id = ?';
  db.query(checkSql, [category_name, parent_id || null], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    // Insert new category
    const insertSql = 'INSERT INTO categories (category_name, parent_id) VALUES (?, ?)';
    db.query(insertSql, [category_name, parent_id || null], (insertErr, results) => {
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
app.put('/api/update-categories/:id', (req, res) => {
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
app.delete('/api/delete-categories/:id', (req, res) => {
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








// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});