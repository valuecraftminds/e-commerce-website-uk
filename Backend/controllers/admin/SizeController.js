  const db = require('../../config/database');

  

// --- SIZE RANGES ---
const SizeController = {
  // Get all size ranges for a company
  getSizeRanges(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT * FROM size_ranges WHERE company_code = ?',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching size ranges' });
          return;
        }
        res.json({ success: true, size_ranges: results });
      }
    );
  },

  // Add a new size range and its sizes
  addSizeRange(req, res) {
    const { company_code, sizes } = req.body;
    if (!company_code || !sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing or invalid data' });
    }
    // Range name: first - last size
    const range_name = `${sizes[0]} - ${sizes[sizes.length - 1]}`;
    db.query(
      'INSERT INTO size_ranges (company_code, range_name) VALUES (?, ?)',
      [company_code, range_name],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding size range' });
          return;
        }
        const size_range_id = result.insertId;
        // Insert sizes
        const sizeValues = sizes.map(size => [company_code, size, size_range_id]);
        db.query(
          'INSERT INTO sizes (company_code, size_name, size_range_id) VALUES ?',[sizeValues],
          (err2, result2) => {
            if (err2) {
              res.status(500).json({ success: false, message: 'Error adding sizes' });
              return;
            }
            res.json({ success: true, size_range_id, range_name, sizes });
          }
        );
      }
    );
  },

  // Get all sizes for a company, optionally by size_range_id
  getSizes(req, res) {
    const { company_code, size_range_id } = req.query;
    let query = 'SELECT * FROM sizes WHERE company_code = ?';
    let params = [company_code];
    if (size_range_id) {
      query += ' AND size_range_id = ?';
      params.push(size_range_id);
    }
    db.query(query, params, (err, results) => {
      if (err) {
        res.status(500).json({ success: false, message: 'Error fetching sizes' });
        return;
      }
      res.json({ success: true, sizes: results });
    });
  },

  // Delete a size range and its sizes
  deleteSizeRange(req, res) {
    const { size_range_id } = req.params;
    // Check if any sizes in this range are used in style_variants
    db.query('SELECT size_id FROM sizes WHERE size_range_id = ?', [size_range_id], (err, sizes) => {
      if (err) {
        res.status(500).json({ success: false, message: 'Error checking size range' });
        return;
      }
      if (!sizes.length) {
        // No sizes, just delete the range
        db.query('DELETE FROM size_ranges WHERE size_range_id = ?', [size_range_id], (err2) => {
          if (err2) {
            res.status(500).json({ success: false, message: 'Error deleting size range' });
            return;
          }
          res.json({ success: true, message: 'Size range deleted' });
        });
        return;
      }
      const sizeIds = sizes.map(s => s.size_id);
      db.query('SELECT COUNT(*) as count FROM style_variants WHERE size_id IN (?)', [sizeIds], (err3, results) => {
        if (err3) {
          res.status(500).json({ success: false, message: 'Error checking size usage' });
          return;
        }
        if (results[0].count > 0) {
          return res.status(400).json({ success: false, message: 'Cannot delete size range as some sizes are used in style variants' });
        }
        // Delete sizes, then range
        db.query('DELETE FROM sizes WHERE size_range_id = ?', [size_range_id], (err4) => {
          if (err4) {
            res.status(500).json({ success: false, message: 'Error deleting sizes' });
            return;
          }
          db.query('DELETE FROM size_ranges WHERE size_range_id = ?', [size_range_id], (err5) => {
            if (err5) {
              res.status(500).json({ success: false, message: 'Error deleting size range' });
              return;
            }
            res.json({ success: true, message: 'Size range and sizes deleted' });
          });
        });
      });
    });
  },

  // Add a single size to a range
  updateSizeRange(req, res) {
    const { size_range_id } = req.params;
    const { company_code, sizes } = req.body;
    if (!company_code || !sizes || !Array.isArray(sizes) || sizes.length < 2) {
      return res.status(400).json({ success: false, message: 'Missing or invalid data' });
    }
    // Range name: first - last size
    const range_name = `${sizes[0]} - ${sizes[sizes.length - 1]}`;
    // Check if any sizes in this range are used in style_variants
    db.query('SELECT size_id, size_name FROM sizes WHERE size_range_id = ?', [size_range_id], (err, oldSizes) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error checking size range' });
      }
      const oldSizeNames = oldSizes.map(s => s.size_name);
      const oldSizeIds = oldSizes.map(s => s.size_id);
      // Find removed sizes
      const removedSizes = oldSizes.filter(s => !sizes.includes(s.size_name));
      if (removedSizes.length > 0) {
        const removedIds = removedSizes.map(s => s.size_id);
        db.query('SELECT COUNT(*) as count FROM style_variants WHERE size_id IN (?)', [removedIds], (err2, results) => {
          if (err2) {
            return res.status(500).json({ success: false, message: 'Error checking size usage' });
          }
          if (results[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Cannot remove sizes that are used in style variants' });
          }
          // Safe to delete removed sizes
          db.query('DELETE FROM sizes WHERE size_id IN (?)', [removedIds], (err3) => {
            if (err3) {
              return res.status(500).json({ success: false, message: 'Error deleting removed sizes' });
            }
            updateOrInsertSizes();
          });
        });
      } else {
        updateOrInsertSizes();
      }

      function updateOrInsertSizes() {
        // Add new sizes
        const newSizes = sizes.filter(sz => !oldSizeNames.includes(sz));
        if (newSizes.length > 0) {
          const sizeValues = newSizes.map(size => [company_code, size, size_range_id]);
          db.query('INSERT INTO sizes (company_code, size_name, size_range_id) VALUES ?', [sizeValues], (err4) => {
            if (err4) {
              return res.status(500).json({ success: false, message: 'Error adding new sizes' });
            }
            updateRangeName();
          });
        } else {
          updateRangeName();
        }
      }

      function updateRangeName() {
        db.query('UPDATE size_ranges SET range_name = ? WHERE size_range_id = ?', [range_name, size_range_id], (err5) => {
          if (err5) {
            return res.status(500).json({ success: false, message: 'Error updating range name' });
          }
          res.json({ success: true, message: 'Size range updated', range_name, sizes });
        });
      }
    });
  },
  
  addSize(req, res) {
    const { company_code, size_name, size_range_id } = req.body;
    if (!company_code || !size_name || !size_range_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    db.query(
      'INSERT INTO sizes (company_code, size_name, size_range_id) VALUES (?, ?, ?)',
      [company_code, size_name, size_range_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding size' });
          return;
        }
        res.json({ success: true, size_id: result.insertId });
      }
    );
  },

  updateSize(req, res) {
    const { size_id } = req.params;
    const { size_name } = req.body;
    db.query(
      'UPDATE sizes SET size_name = ?, updated_at = NOW() WHERE size_id = ?',
      [size_name, size_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error updating size' });
          return;
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Size not found' });
        }
        res.json({ success: true, message: 'Size updated successfully' });
      }
    );
  },

  deleteSize(req, res) {
    const { size_id } = req.params;
    db.query(
      'SELECT COUNT(*) as count FROM style_variants WHERE size_id = ?',
      [size_id],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error checking size usage' });
          return;
        }

        if (results[0].count > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete size as it is being used in style variants'
          });
        }

        db.query(
          'DELETE FROM sizes WHERE size_id = ?',
          [size_id],
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, message: 'Error deleting size' });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Size not found' });
            }
            res.json({ success: true, message: 'Size deleted successfully' });
          }
        );
      }
    );
  }
};

module.exports = SizeController;
