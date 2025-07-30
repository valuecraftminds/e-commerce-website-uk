const db = require('../../config/database');

class CategoryController {
  // Get license for a company

  // Get all categories with subcategories
  static getCategories(req, res) {
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

    db.query(sql, [company_code], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });

      const categories = [];
      const categoryMap = {};

      results.forEach(row => {
        if (!row.parent_id) {
          categoryMap[row.category_id] = {
            category_id: row.category_id,
            category_name: row.category_name,
            subcategories: []
          };
          categories.push(categoryMap[row.category_id]);
        } else {
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
  }

  // Get subcategories by parent ID
  static getSubcategories(req, res) {
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
      if (err) return res.status(500).json({ success: false, message: 'Error fetching subcategories' });
      res.json({ success: true, subcategories: results });
    });
  }

  // Add category
  static async addCategory(req, res) {
    const { category_name, parent_id, company_code } = req.body;

    if (!category_name || !company_code) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    try {
      const [[{ total_categories }]] = await dbPromise.query(
        'SELECT COUNT(*) as total_categories FROM categories WHERE company_code = ? AND parent_id IS NULL',
        [company_code]
      );

      const [license] = await dbPromise.query(
        'SELECT category_count FROM admin_license WHERE company_code = ?',
        [company_code]
      );

      const categoryLimit = license[0]?.category_count || 0;

      if (total_categories >= categoryLimit) {
        return res.status(403).json({ success: false, message: 'Category limit reached. Please upgrade your license.' });
      }

      const checkSql = 'SELECT * FROM categories WHERE category_name = ? AND company_code = ?';
      const [checkResults] = await dbPromise.query(checkSql, [category_name, company_code]);

      if (checkResults.length > 0) {
        return res.status(409).json({ success: false, message: 'Category already exists' });
      }

      const insertSql = 'INSERT INTO categories (company_code, category_name, parent_id) VALUES (?, ?, ?)';
      const [insertResult] = await dbPromise.query(insertSql, [company_code, category_name, parent_id || null]);

      res.json({ 
        success: true, 
        message: 'Category added successfully',
        category_id: insertResult.insertId
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Update category
  static updateCategory(req, res) {
    const { id } = req.params;
    const { category_name, parent_id } = req.body;

    if (!category_name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    if (parent_id && parseInt(parent_id) === parseInt(id)) {
      return res.status(400).json({ success: false, message: 'A category cannot be its own parent' });
    }

    function doUpdate() {
      const sql = 'UPDATE categories SET category_name = ?, parent_id = ? WHERE category_id = ?';
      db.query(sql, [category_name, parent_id || null, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error updating category' });
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category updated successfully' });
      });
    }

    if (parent_id) {
      db.query('SELECT category_id FROM categories WHERE category_id = ?', [parent_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error checking parent category' });
        if (result.length === 0) {
          return res.status(400).json({ success: false, message: 'Parent category does not exist' });
        }

        db.query(
          'SELECT category_id FROM categories WHERE category_name = ? AND parent_id = ? AND category_id != ?',
          [category_name, parent_id, id],
          (dupErr, dupResult) => {
            if (dupErr) return res.status(500).json({ success: false, message: 'Error checking duplicates' });
            if (dupResult.length > 0) {
              return res.status(409).json({ success: false, message: 'Category name already exists under this parent' });
            }
            doUpdate();
          }
        );
      });
    } else {
      db.query(
        'SELECT category_id FROM categories WHERE category_name = ? AND parent_id IS NULL AND category_id != ?',
        [category_name, id],
        (dupErr, dupResult) => {
          if (dupErr) return res.status(500).json({ success: false, message: 'Error checking duplicates' });
          if (dupResult.length > 0) {
            return res.status(409).json({ success: false, message: 'Main category name already exists' });
          }
          doUpdate();
        }
      );
    }
  }

  // Delete category
  static deleteCategory(req, res) {
    const { id } = req.params;

    const checkSql = 'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?';
    db.query(checkSql, [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error checking subcategories' });

      if (result[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot delete category. It has ${result[0].count} subcategories. Delete them first.` 
        });
      }

      db.query('DELETE FROM categories WHERE category_id = ?', [id], (delErr, delResult) => {
        if (delErr) return res.status(500).json({ success: false, message: 'Error deleting category' });
        if (delResult.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, message: 'Category deleted successfully' });
      });
    });
  }
}

module.exports = CategoryController;
