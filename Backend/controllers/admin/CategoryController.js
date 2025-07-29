const db = require('../../config/database');

class CategoryController {
  static async getMainCategories(req, res) {
    try {
      const [results] = await db.execute(
        'SELECT * FROM categories WHERE parent_id IS NULL'
      );
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error retrieving main categories:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getProductTypesByParent(req, res) {
    try {
      const { parentId } = req.params;
      
      if (!parentId || isNaN(parentId)) {
        return res.status(400).json({ success: false, message: 'Valid parent ID required' });
      }

      const [results] = await db.execute(
        'SELECT * FROM categories WHERE parent_id = ?',
        [parentId]
      );
      
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error retrieving subcategories:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = CategoryController;