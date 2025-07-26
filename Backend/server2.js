const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/database');

const router = express.Router();
const port = process.env.PORT || 3000;

// Middleware
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


// -------ENDPOINTS FOR CUSTOMER ROUTES------- //

// GET main categories (parent_id is NULL)
router.get('/main-categories', (req, res) => {
  const sql = `SELECT * FROM categories WHERE parent_id IS NULL`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving main categories:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

// GET product types by main category ID
router.get('/product-types/:parentId', (req, res) => {
  const { parentId } = req.params;

  const sql = `SELECT * FROM categories WHERE parent_id = ?`;

  db.query(sql, [parentId], (err, results) => {
    if (err) {
      console.error('Error retrieving subcategories:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

  // get styles by parent category ID
router.get('/styles-by-parent-category/:parentId', (req, res) => {
  const { parentId } = req.params;

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
    WHERE (c.parent_id = ? OR c.category_id = ?) AND s.approved = 'yes'
    GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
    ORDER BY s.created_at DESC
  `;

  db.query(sql, [parentId, parentId], (err, results) => {
    if (err) {
      console.error('Error retrieving styles by parent category:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});

// get all styles
router.get('/all-styles', (req, res) => {
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
    GROUP BY s.style_id, s.style_code, s.name, s.description, s.category_id, s.image
    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving all styles:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});


// retrieve product details for product page
router.get('/product/:style_id', (req, res) => {
  const { style_id } = req.params;

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
  `;

db.query(sql, [style_id], (err, results) => {
  if (err) {
    console.error('Error fetching product details:', err);
    return res.status(500).json({ error: 'Server error' });
  }

  // Group sizes and colors uniquely
  const sizes = [...new Set(results.map(r => r.size_name))];
  const colors = [...new Set(results.map(r => r.color_name))];

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

// get product listing images to display on homepage
router.get('/product-listings', (req, res) => {
  const sql = `
    SELECT style_id, style_code, name, description, image 
    FROM styles 
    WHERE approved = 'yes'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving product listings:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.status(200).json(results);
  });
});


module.exports = router;
