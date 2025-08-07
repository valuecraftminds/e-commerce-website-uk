const db = require('../../config/database');

class CategoryController {
  // Get all categories with subcategories
  static getCategories(req, res) {
    const { company_code } = req.query;
    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
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
      if (err) {
        console.error('Error in getCategories:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }

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

      return res.json({ success: true, categories });
    });
  }

  // Get subcategories by parent ID
  static getSubcategories(req, res) {
    const { parent_id } = req.params;
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    const sql = `
      SELECT category_id, category_name, parent_id 
      FROM categories 
      WHERE parent_id = ? AND company_code = ?
    `;

    db.query(sql, [parent_id, company_code], (err, results) => {
      if (err) {
        console.error('Error in getSubcategories:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching subcategories' 
        });
      }
      return res.json({ success: true, subcategories: results });
    });
  }

  // Add new category (main or subcategory)
  static addCategory(req, res) {
    const { category_name, parent_id, company_code } = req.body;

    if (!category_name || !company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name and company code are required' 
      });
    }

    // Only check category limit for main categories
    if (!parent_id) {
      db.query(
        'SELECT COUNT(*) as total_categories FROM categories WHERE company_code = ? AND parent_id IS NULL',
        [company_code],
        (err, countResults) => {
          if (err) {
            console.error('Error counting categories:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          db.query(
            'SELECT category_count FROM admin_license WHERE company_code = ?',
            [company_code],
            (err, licenseResults) => {
              if (err) {
                console.error('Error checking license:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
              }

              const total_categories = countResults[0].total_categories;
              const categoryLimit = licenseResults[0]?.category_count || 0;

              if (total_categories >= categoryLimit) {
                return res.status(403).json({
                  success: false,
                  message: 'Main category limit reached. Please upgrade your license.'
                });
              }

              proceedWithCategoryAdd();
            }
          );
        }
      );
    } else {
      proceedWithCategoryAdd();
    }

    function proceedWithCategoryAdd() {
      // Check for duplicates
      db.query(
        'SELECT category_id FROM categories WHERE company_code = ? AND category_name = ? AND (parent_id = ? OR (? IS NULL AND parent_id IS NULL))',
        [company_code, category_name, parent_id, parent_id],
        (err, existingCategories) => {
          if (err) {
            console.error('Error checking duplicates:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          if (existingCategories.length > 0) {
            return res.status(409).json({ 
              success: false, 
              message: parent_id 
                ? 'Subcategory with this name already exists under the selected parent'
                : 'Main category with this name already exists'
            });
          }

          // Insert new category
          db.query(
            'INSERT INTO categories (company_code, category_name, parent_id) VALUES (?, ?, ?)',
            [company_code, category_name, parent_id || null],
            (err, result) => {
              if (err) {
                console.error('Error adding category:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
              }

              return res.json({
                success: true,
                message: parent_id ? 'Subcategory added successfully' : 'Main category added successfully',
                category_id: result.insertId
              });
            }
          );
        }
      );
    }
  }

  // Update existing category
  static updateCategory(req, res) {
    const { id } = req.params;
    const { category_name, parent_id } = req.body;

    if (!category_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }

    if (parent_id && parseInt(parent_id) === parseInt(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'A category cannot be its own parent' 
      });
    }

    // Check if parent exists
    if (parent_id) {
      db.query(
        'SELECT category_id FROM categories WHERE category_id = ?',
        [parent_id],
        (err, parentResults) => {
          if (err) {
            console.error('Error checking parent category:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          if (!parentResults.length) {
            return res.status(400).json({ 
              success: false, 
              message: 'Parent category does not exist' 
            });
          }

          proceedWithUpdate();
        }
      );
    } else {
      proceedWithUpdate();
    }

    function proceedWithUpdate() {
      // Check for duplicate name
      db.query(
        `SELECT category_id FROM categories 
         WHERE category_name = ? 
         AND parent_id ${parent_id ? '= ?' : 'IS NULL'} 
         AND category_id != ?`,
        [category_name, ...(parent_id ? [parent_id] : []), id],
        (err, duplicates) => {
          if (err) {
            console.error('Error checking duplicates:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          if (duplicates.length > 0) {
            return res.status(409).json({ 
              success: false, 
              message: parent_id 
                ? 'Category name already exists under this parent' 
                : 'Main category name already exists'
            });
          }

          // Perform update
          db.query(
            'UPDATE categories SET category_name = ?, parent_id = ? WHERE category_id = ?',
            [category_name, parent_id || null, id],
            (err, result) => {
              if (err) {
                console.error('Error updating category:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
              }

              if (result.affectedRows === 0) {
                return res.status(404).json({ 
                  success: false, 
                  message: 'Category not found' 
                });
              }

              return res.json({ 
                success: true, 
                message: 'Category updated successfully' 
              });
            }
          );
        }
      );
    }
  }

  // Delete category
  static deleteCategory(req, res) {
    const { id } = req.params;

    // Check for subcategories
    db.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [id],
      (err, countResults) => {
        if (err) {
          console.error('Error checking subcategories:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        const count = countResults[0].count;

        if (count > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot delete category. It has ${count} subcategories. Delete them first.`
          });
        }

        // Delete category
        db.query(
          'DELETE FROM categories WHERE category_id = ?',
          [id],
          (err, result) => {
            if (err) {
              console.error('Error deleting category:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
              });
            }

            return res.json({ 
              success: true, 
              message: 'Category deleted successfully' 
            });
          }
        );
      }
    );
  }
}

module.exports = CategoryController;