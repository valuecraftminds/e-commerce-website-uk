const db = require('../../config/database');

const SizeGuideController = {
// Get size guide for a style
  getSizeGuide(req, res) {
    const { style_number } = req.params;
    const { company_code } = req.query;

    if (!style_number || !company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    db.query(
      'SELECT size_guide_content FROM size_guides WHERE style_number = ? AND company_code = ?',
      [style_number, company_code],
      (err, results) => {
        if (err) {
          console.error('Error fetching size guide:', err);
          res.status(500).json({ 
            success: false, 
            message: 'Error fetching size guide' 
          });
          return;
        }
        
        if (results.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Size guide not found' 
          });
        }
        
        res.json({ 
          success: true, 
          size_guide_content: results[0].size_guide_content 
        });
      }
    );
  },

  // Save or update size guide for a style
  saveSizeGuide(req, res) {
    const { style_number, company_code, size_guide_content } = req.body;

    if (!style_number || !company_code || size_guide_content === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const query = `
      INSERT INTO size_guides (style_number, company_code, size_guide_content, created_at, updated_at) 
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
      size_guide_content = VALUES(size_guide_content), 
      updated_at = NOW()
    `;

    db.query(query, [style_number, company_code, size_guide_content], (err, result) => {
      if (err) {
        console.error('Error saving size guide:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Error saving size guide' 
        });
        return;
      }
      
      res.json({ 
        success: true, 
        message: 'Size guide saved successfully' 
      });
    });
  },

  // Delete size guide for a style
  deleteSizeGuide: (req, res) => {
    const { style_number } = req.params;
    const { company_code } = req.body;

    if (!style_number || !company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Style number and company code are required' 
      });
    }

    const query = 'DELETE FROM size_guides WHERE style_number = ? AND company_code = ?';
    
    db.query(query, [style_number, company_code], (err, result) => {
      if (err) {
        console.error('Error deleting size guide:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Error deleting size guide' 
        });
        return;
      }
      
      if (result.affectedRows === 0) {
        res.status(404).json({ 
          success: false, 
          message: 'Size guide not found' 
        });
        return;
      }
      
      res.json({ 
        success: true, 
        message: 'Size guide deleted successfully' 
      });
    });
  }
};

module.exports = SizeGuideController;

