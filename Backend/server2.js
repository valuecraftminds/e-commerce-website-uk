// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const db = require('./config/database');

// const router = express.Router();
// const port = process.env.PORT || 3000;

// // Middleware
// router.use(cors());
// router.use(express.json());
// router.use(express.urlencoded({ extended: true }));


// // -------ENDPOINTS FOR CUSTOMER ROUTES------- //

// // GET main categories (parent_id is NULL)
// router.get('/main-categories', (req, res) => {
//   const { company_code } = req.query;

//   if (company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }

//   const sql = `SELECT * FROM categories WHERE parent_id IS NULL AND company_code = ?`;

//   db.query(sql, [company_code], (err, results) => {
//     if (err) {
//       console.error('Error retrieving main categories:', err);
//       return res.status(500).json({ error: 'Server error' });
//     }

//     res.status(200).json(results);
//   });
// });

// // GET product types by main category ID
// router.get('/product-types/:parentId', (req, res) => {
//   const { parentId } = req.params;
//   const { company_code } = req.query;

//   if (!company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }

//   const sql = `SELECT * FROM categories WHERE parent_id = ? AND company_code = ?`;

//   db.query(sql, [parentId, company_code], (err, results) => {
//     if (err) {
//       console.error('Error retrieving subcategories:', err);
//       return res.status(500).json({ error: 'Server error' });
//     }

//     res.status(200).json(results);
//   });
// });

//   // get styles by parent category ID
// router.get('/styles-by-parent-category/:parentId', (req, res) => {
//   const { company_code } = req.query;
//   const { parentId } = req.params;

//   if (!company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }

//   const sql = `
//     SELECT 
//       s.*,
//       c.category_name,
//       c.category_id,
//       parent_cat.category_name as parent_category_name,
//       MIN(sv.price) as min_price,
//       MAX(sv.price) as max_price,
//       COUNT(DISTINCT sv.variant_id) as variant_count
//     FROM styles s
//     LEFT JOIN categories c ON s.category_id = c.category_id
//     LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
//     LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
//     WHERE (c.parent_id = ? OR c.category_id = ?) AND s.approved = 'yes'
//     GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
//     ORDER BY s.created_at DESC
//   `;

//   db.query(sql, [parentId, parentId, company_code], (err, results) => {
//     if (err) {
//       console.error('Error retrieving styles by parent category:', err);
//       return res.status(500).json({ error: 'Server error' });
//     }

//     res.status(200).json(results);
//   });
// });

// // get all styles
// router.get('/all-styles', (req, res) => {
//   const { company_code } = req.query;

//   if (!company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }

//   const sql = `
//     SELECT 
//       s.*,
//       c.category_name,
//       c.category_id,
//       parent_cat.category_name as parent_category_name,
//       MIN(sv.price) as min_price,
//       MAX(sv.price) as max_price,
//       COUNT(DISTINCT sv.variant_id) as variant_count
//     FROM styles s
//     LEFT JOIN categories c ON s.category_id = c.category_id
//     LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
//     LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
//     WHERE s.approved = 'yes'
//     GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
//     ORDER BY s.created_at DESC
//   `;

//   db.query(sql, [company_code], (err, results) => {
//     if (err) {
//       console.error('Error retrieving all styles:', err);
//       return res.status(500).json({ error: 'Server error' });
//     }

//     res.status(200).json(results);
//   });
// });


// // retrieve product details for product page
// router.get('/product/:style_id', (req, res) => {
//   const { company_code } = req.query;
//   const { style_id } = req.params;

//   if (!company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }

//   // Query product info from styles table
//   const sql = `
//     SELECT
//       s.style_id,
//       s.style_code,
//       s.name,
//       s.description,
//       s.image,
//       sv.price,
//       sz.size_name,
//       c.color_name
//   FROM styles s
//   LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
//   LEFT JOIN sizes sz ON sv.size_id = sz.size_id
//   LEFT JOIN colors c ON sv.color_id = c.color_id
//   WHERE s.style_id = ?
//   `;

// db.query(sql, [style_id, company_code], (err, results) => {
//   if (err) {
//     console.error('Error fetching product details:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }

//   // Group sizes and colors uniquely
//   const sizes = [...new Set(results.map(r => r.size_name))];
//   const colors = [...new Set(results.map(r => r.color_name))];

//   const product = results[0];
//   const price = results.length > 0 ? results[0].price : null;

//   res.json({
//     style_id: product.style_id,
//     style_code: product.style_code,
//     name: product.name,
//     description: product.description,
//     price,
//     available_sizes: sizes,
//     available_colors: colors,
//     image: product.image
//   });
// });
// });

// // get product listing images to display on homepage
// router.get('/product-listings', (req, res) => {
//   const { company_code } = req.query;

//   if (!company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }

//   const sql = `
//     SELECT style_id, style_code, name, description, image 
//     FROM styles 
//     WHERE approved = 'yes'
//   `;

//   db.query(sql, [company_code], (err, results) => {
//     if (err) {
//       console.error('Error retrieving product listings:', err);
//       return res.status(500).json({ error: 'Server error' });
//     }

//     res.status(200).json(results);
//   });
// });


// // Search endpoint
// router.get('/search', (req, res) => {
//   const { company_code } = req.query;
//   const query = req.query.q?.toLowerCase() || '';

//   if (!company_code) {
//     return res.status(400).json({ success: false, error: 'company_code is required' });
//   }
  
//   const sql = `
//     SELECT
//       s.style_id,
//       s.style_code,
//       s.name,
//       s.description,
//       s.image
//     FROM styles s
//     WHERE (s.name LIKE ? OR s.description LIKE ? OR s.style_code LIKE ?)
//     AND s.approved = 'yes'
//     ORDER BY 
//       CASE 
//         WHEN s.name LIKE ? THEN 1
//         WHEN s.style_code LIKE ? THEN 2
//         WHEN s.description LIKE ? THEN 3
//         ELSE 4
//       END,
//       s.name ASC
//     LIMIT 10
//   `;

//   const searchPattern = `%${query}%`;
//   const exactPattern = `${query}%`;

//   db.query(sql, [
//     searchPattern,
//     searchPattern,      
//     searchPattern,    
//     exactPattern,     
//     exactPattern,     
//     exactPattern
//   ], (err, results) => {
//     if (err) {
//       console.error('Error searching styles:', err);
//       return res.status(500).json({ error: 'Server error' });
//     }

//     // Transform results to ensure consistent data structure
//     const transformedResults = results.map(item => ({
//       style_id: item.style_id,
//       style_code: item.style_code,
//       name: item.name,
//       description: item.description || '',
//       image: item.image || null
//     }));

//     res.status(200).json(transformedResults);
//   });
// });

// module.exports = router;

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const router = express.Router();
const port = process.env.PORT || 3000;

// Middleware
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function checkCompanyCode(req, res, next) {
  const { company_code } = req.query;
  if (!company_code) {
    return res.status(400).json({ success: false, error: 'company_code is required' });
  }
  next();
}


// -------ENDPOINTS FOR CUSTOMER ROUTES------- //

// GET main categories (parent_id is NULL) filtered by company_code
router.get('/main-categories', checkCompanyCode, (req, res) => {
  const { company_code } = req.query;

    const sql = `SELECT * FROM categories WHERE parent_id IS NULL AND company_code = ?`;

  db.query(sql, [company_code], (err, results) => {
    if (err) {
      console.error('Error retrieving main categories:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

// GET product types by main category ID filtered by company_code
router.get('/product-types/:parentId', checkCompanyCode, (req, res) => {
  const { parentId } = req.params;
  const { company_code } = req.query;

  const sql = `SELECT * FROM categories WHERE parent_id = ? AND company_code = ?`;

  db.query(sql, [parentId, company_code], (err, results) => {
    if (err) {
      console.error('Error retrieving subcategories:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    res.status(200).json({ success: true, categories: results });
  });
});

// get styles by parent category ID filtered by company_code
router.get('/styles-by-parent-category/:parentId', checkCompanyCode, (req, res) => {
  const { parentId } = req.params;
  const { company_code } = req.query;

  // if (!company_code) {
  //   return res.status(400).json({ success: false, error: 'company_code is required' });
  // }

  const sql = `
    SELECT 
      s.*,
      c.category_name,
      c.category_id,
      parent_cat.category_name as parent_category_name,
      MIN(sv.price) as min_price,
      MAX(sv.price) as max_price,
      COUNT(DISTINCT sv.variant_id) as variant_count
    FROM styles s
    LEFT JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
    LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
    WHERE (c.parent_id = ? OR c.category_id = ?) 
    AND s.approved = 'yes' 
    AND s.company_code = ?
    GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
    ORDER BY s.created_at DESC
  `;

  db.query(sql, [parentId, parentId, company_code], (err, results) => {
    if (err) {
      console.error('Error retrieving styles by parent category:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

// get all styles filtered by company_code
router.get('/all-styles', checkCompanyCode, (req, res) => {
  const { company_code } = req.query;

  // if (!company_code) {
  //   return res.status(400).json({ success: false, error: 'company_code is required' });
  // }

  const sql = `
    SELECT 
      s.*,
      c.category_name,
      c.category_id,
      parent_cat.category_name as parent_category_name,
      MIN(sv.price) as min_price,
      MAX(sv.price) as max_price,
      COUNT(DISTINCT sv.variant_id) as variant_count
    FROM styles s
    LEFT JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.category_id
    LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
    WHERE s.approved = 'yes' 
    AND s.company_code = ?
    GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
    ORDER BY s.created_at DESC
  `;

  db.query(sql, [company_code], (err, results) => {
    if (err) {
      console.error('Error retrieving all styles:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

// retrieve product details for product page filtered by company_code
router.get('/product/:style_id', checkCompanyCode, (req, res) => {
  const { style_id } = req.params;
  const { company_code } = req.query;

  // if (!company_code) {
  //   return res.status(400).json({ success: false, error: 'company_code is required' });
  // }

  // Query product info from styles table
  const sql = `
    SELECT
      s.style_id,
      s.style_code,
      s.name,
      s.description,
      s.image,
      sv.price,
      sz.size_name,
      c.color_name
    FROM styles s
    LEFT JOIN style_variants sv ON s.style_code = sv.style_code AND sv.is_active = 1
    LEFT JOIN sizes sz ON sv.size_id = sz.size_id
    LEFT JOIN colors c ON sv.color_id = c.color_id
    WHERE s.style_id = ? 
    AND s.company_code = ?
    AND s.approved = 'yes'
  `;

  db.query(sql, [style_id, company_code], (err, results) => {
    if (err) {
      console.error('Error fetching product details:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Group sizes and colors uniquely
    const sizes = [...new Set(results.map(r => r.size_name).filter(Boolean))];
    const colors = [...new Set(results.map(r => r.color_name).filter(Boolean))];

    const product = results[0];
    const price = results.length > 0 ? results[0].price : null;

    res.json({
      style_id: product.style_id,
      style_code: product.style_code,
      name: product.name,
      description: product.description,
      price,
      available_sizes: sizes,
      available_colors: colors,
      image: product.image
    });
  });
});

// get product listing images to display on homepage filtered by company_code
router.get('/product-listings', checkCompanyCode, (req, res) => {
  const { company_code } = req.query;

  // if (!company_code) {
  //   return res.status(400).json({ success: false, error: 'company_code is required' });
  // }

  const sql = `
    SELECT style_id, style_code, name, description, image 
    FROM styles 
    WHERE approved = 'yes' 
    AND company_code = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [company_code], (err, results) => {
    if (err) {
      console.error('Error retrieving product listings:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

// Search endpoint filtered by company_code
router.get('/search', checkCompanyCode, (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const { company_code } = req.query;
  
  // if (!company_code) {
  //   return res.status(400).json({ success: false, error: 'company_code is required' });
  // }

  if (!query.trim()) {
    return res.status(400).json({ success: false, error: 'Search query is required' });
  }

  const sql = `
    SELECT
      s.style_id,
      s.style_code,
      s.name,
      s.description,
      s.image
    FROM styles s
    WHERE (s.name LIKE ? OR s.description LIKE ? OR s.style_code LIKE ?)
    AND s.approved = 'yes'
    AND s.company_code = ?
    ORDER BY 
      CASE 
        WHEN s.name LIKE ? THEN 1
        WHEN s.style_code LIKE ? THEN 2
        WHEN s.description LIKE ? THEN 3
        ELSE 4
      END,
      s.name ASC
    LIMIT 10
  `;

  const searchPattern = `%${query}%`;
  const exactPattern = `${query}%`;

  db.query(sql, [
    searchPattern,
    searchPattern,      
    searchPattern,
    company_code,    
    exactPattern,     
    exactPattern,     
    exactPattern
  ], (err, results) => {
    if (err) {
      console.error('Error searching styles:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // Transform results to ensure consistent data structure
    const transformedResults = results.map(item => ({
      style_id: item.style_id,
      style_code: item.style_code,
      name: item.name,
      description: item.description || '',
      image: item.image || null
    }));

    res.status(200).json(transformedResults);
  });
});

// Admin Registration Endpoint
router.post('/api/register', async (req, res) => {
  const { company_code, name, email, phone, password,country } = req.body;

  if (!company_code || !name || !email || !phone || !password || !country ) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Name validation - no numbers or special chars
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
  }

  // Check for duplicate email
  db.query('SELECT * FROM customers WHERE email = ?', [email], (emailErr, emailRows) => {
    if (emailErr) {
      return res.status(500).json({ success: false, message: 'Error checking email (DB error)' });
    }

    if (emailRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

  // Check for duplicate phone number and validate phone number
  db.query('SELECT * FROM customers WHERE phone = ?', [phone], (phoneErr, phoneRows) => {
    if (phoneErr) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format. Please enter a valid international phone number' });
    }
    else if (phoneRows.length > 0) {
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
      'INSERT INTO customers (company_code,name, email, phone, password,country) VALUES (?, ?, ?, ?, ?,?)',
      [company_code,name, email, phone, hashedPassword, country],
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



router.post('/api/login', async (req, res) => {
  const { company_code,email, password } = req.body;

  const sql = 'SELECT * FROM customers WHERE email = ? AND company_code = ?';

  db.query(sql, [email,company_code], async (err, results) => {
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
        id: user.customer_id,  
        company_code: user.company_code,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        role: user.country
      },
    });
  });
});

module.exports = router;
