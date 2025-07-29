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

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
}



// middlewares/optionalAuth.js
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If no token is provided, proceed without user info
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user to request
  } catch (err) {
    // Invalid token - still continue
    console.log('Invalid token in optionalAuth');
  }

  next(); // Always continue
};

module.exports = optionalAuth;



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


// -------CART ENDPOINTS------- //

// Add item to cart
router.post('/cart/add', checkCompanyCode, optionalAuth, (req, res) => {
  const { style_code, variant_id, quantity = 1 } = req.body;
  const { company_code } = req.query;
  const customer_id = req.user?.id || null;

  if (!style_code || !variant_id || quantity < 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'style_code, variant_id, and valid quantity are required' 
    });
  }

  // First, verify the variant exists and belongs to the company
  const checkVariantSql = `
    SELECT sv.*, s.name as style_name, s.image, c.color_name, sz.size_name
    FROM style_variants sv
    JOIN styles s ON sv.style_code = s.style_code
    LEFT JOIN colors c ON sv.color_id = c.color_id
    LEFT JOIN sizes sz ON sv.size_id = sz.size_id
    WHERE sv.variant_id = ? 
    AND sv.style_code = ? 
    AND s.company_code = ?
    AND sv.is_active = 1
  `;

  db.query(checkVariantSql, [variant_id, style_code, company_code], (err, variantResults) => {
    if (err) {
      console.error('Error checking variant:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (variantResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product variant not found or not available' 
      });
    }

    const variant = variantResults[0];

    // Check if item already exists in cart
    const checkCartSql = `
      SELECT * FROM cart 
      WHERE company_code = ? 
      AND variant_id = ? 
      AND (customer_id = ? OR customer_id IS NULL)
    `;

    db.query(checkCartSql, [company_code, variant_id, customer_id], (cartErr, cartResults) => {
      if (cartErr) {
        console.error('Error checking cart:', cartErr);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (cartResults.length > 0) {
        // Update existing cart item
        const newQuantity = cartResults[0].quantity + parseInt(quantity);
        const updateSql = `
          UPDATE cart 
          SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE cart_id = ?
        `;

        db.query(updateSql, [newQuantity, cartResults[0].cart_id], (updateErr) => {
          if (updateErr) {
            console.error('Error updating cart:', updateErr);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({ 
            success: true, 
            message: 'Cart updated successfully',
            cart_id: cartResults[0].cart_id,
            quantity: newQuantity
          });
        });
      } else {
        // Add new cart item
        const insertSql = `
          INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity], (insertErr, result) => {
          if (insertErr) {
            console.error('Error adding to cart:', insertErr);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.json({ 
            success: true, 
            message: 'Item added to cart successfully',
            cart_id: result.insertId,
            quantity: quantity
          });
        });
      }
    });
  });
});

// Get cart items
router.get('/cart', checkCompanyCode, optionalAuth, (req, res) => {
  const { company_code } = req.query;
  const customer_id = req.user?.id || null;

  const sql = `
    SELECT 
      c.cart_id,
      c.style_code,
      c.variant_id,
      c.quantity,
      c.created_at,
      s.style_id,
      s.name as style_name,
      s.description,
      s.image,
      sv.price,
      sv.stock_quantity,
      sv.sku,
      col.color_name,
      sz.size_name,
      m.material_name,
      f.fit_name
    FROM cart c
    JOIN style_variants sv ON c.variant_id = sv.variant_id
    JOIN styles s ON c.style_code = s.style_code
    LEFT JOIN colors col ON sv.color_id = col.color_id
    LEFT JOIN sizes sz ON sv.size_id = sz.size_id
    LEFT JOIN materials m ON sv.material_id = m.material_id
    LEFT JOIN fits f ON sv.fit_id = f.fit_id
    WHERE c.company_code = ?
    AND c.customer_id ${customer_id ? '= ?' : 'IS NULL'}
    AND s.approved = 'yes'
    AND sv.is_active = 1
    ORDER BY c.created_at DESC
  `;

  const params = customer_id ? [company_code, customer_id] : [company_code];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Calculate totals
    const cartItems = results.map(item => ({
      ...item,
      total_price: parseFloat(item.price) * item.quantity
    }));

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);

    res.json({
      success: true,
      cart: cartItems,
      summary: {
        total_items: totalItems,
        total_amount: totalAmount.toFixed(2)
      }
    });
  });
});

// Update cart item quantity
router.put('/cart/:cart_id', checkCompanyCode, optionalAuth, (req, res) => {
  const { cart_id } = req.params;
  const { quantity } = req.body;
  const { company_code } = req.query;
  const customer_id = req.user?.id || null;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid quantity is required' 
    });
  }

  const sql = `
    UPDATE cart 
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE cart_id = ? 
    AND company_code = ? 
    AND (customer_id = ? OR customer_id IS NULL)
  `;

  const params = [quantity, cart_id, company_code, customer_id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart item not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Cart updated successfully' 
    });
  });
});

// Remove item from cart
router.delete('/cart/:cart_id', checkCompanyCode, optionalAuth, (req, res) => {
  const { cart_id } = req.params;
  const { company_code } = req.query;
  const customer_id = req.user?.id || null;

  const sql = `
    DELETE FROM cart 
    WHERE cart_id = ? 
    AND company_code = ? 
    AND (customer_id = ? OR customer_id IS NULL)
  `;

  const params = [cart_id, company_code, customer_id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error removing from cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart item not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Item removed from cart successfully' 
    });
  });
});

// Merge guest cart with user cart on login
router.post('/cart/merge', checkCompanyCode, verifyToken, (req, res) => {
  const { guest_cart } = req.body; // Array of cart items from localStorage
  const { company_code } = req.query;
  const customer_id = req.user.id;

  if (!guest_cart || !Array.isArray(guest_cart) || guest_cart.length === 0) {
    return res.json({ 
      success: true, 
      message: 'No guest cart items to merge' 
    });
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    let processedItems = 0;
    let errors = [];

    const processCartItem = (item, callback) => {
      // Check if user already has this variant in cart
      const checkSql = `
        SELECT cart_id, quantity FROM cart 
        WHERE customer_id = ? 
        AND variant_id = ? 
        AND company_code = ?
      `;

      db.query(checkSql, [customer_id, item.variant_id, company_code], (checkErr, existing) => {
        if (checkErr) {
          errors.push(`Error checking item ${item.variant_id}: ${checkErr.message}`);
          return callback();
        }

        if (existing.length > 0) {
          // Update existing item
          const newQuantity = existing[0].quantity + item.quantity;
          const updateSql = `
            UPDATE cart 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE cart_id = ?
          `;

          db.query(updateSql, [newQuantity, existing[0].cart_id], (updateErr) => {
            if (updateErr) {
              errors.push(`Error updating item ${item.variant_id}: ${updateErr.message}`);
            }
            callback();
          });
        } else {
          // Insert new item
          const insertSql = `
            INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.query(insertSql, [company_code, customer_id, item.style_code, item.variant_id, item.quantity], (insertErr) => {
            if (insertErr) {
              errors.push(`Error inserting item ${item.variant_id}: ${insertErr.message}`);
            }
            callback();
          });
        }
      });
    };

    // Process each cart item
    guest_cart.forEach(item => {
      processCartItem(item, () => {
        processedItems++;
        if (processedItems === guest_cart.length) {
          if (errors.length > 0) {
            db.rollback();
            console.error('Cart merge errors:', errors);
            return res.status(500).json({ 
              success: false, 
              message: 'Error merging cart items',
              errors: errors
            });
          }

          db.commit((commitErr) => {
            if (commitErr) {
              db.rollback();
              console.error('Commit error:', commitErr);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            res.json({ 
              success: true, 
              message: 'Cart merged successfully',
              merged_items: guest_cart.length
            });
          });
        }
      });
    });
  });
});

// Clear entire cart
router.delete('/cart/clear', checkCompanyCode, optionalAuth, (req, res) => {
  const { company_code } = req.query;
  const customer_id = req.user?.id || null;

  const sql = `
    DELETE FROM cart 
    WHERE company_code = ? 
    AND (customer_id = ? OR customer_id IS NULL)
  `;

  const params = [company_code, customer_id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error clearing cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    res.json({ 
      success: true, 
      message: 'Cart cleared successfully',
      cleared_items: result.affectedRows
    });
  });
});


module.exports = router;
