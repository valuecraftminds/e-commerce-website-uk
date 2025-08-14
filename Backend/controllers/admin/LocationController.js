const db = require('../../config/database');

const LocationController = {
  getLocations(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT * FROM locations WHERE company_code = ? ORDER BY location_name',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error fetching locations' });
          return;
        }
        res.json({ success: true, locations: results });
      }
    );
  },

  addLocation(req, res) {
    const { company_code, location_name, description } = req.body;
    db.query(
      'INSERT INTO locations (company_code, location_name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [company_code, location_name, description],
      (err, result) => {
        if (err) {
          res.status(500).json({ success: false, message: 'Error adding location' });
          return;
        }
        res.json({ success: true, location_id: result.insertId });
      }
    );
  },

  updateLocation(req, res) {
    const { location_id } = req.params;
    const { location_name, description, company_code } = req.body;
    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }
    db.query(
      'UPDATE locations SET location_name = ?, description = ?, updated_at = NOW() WHERE location_id = ? AND company_code = ?',
      [location_name, description, location_id, company_code],
      (err, result) => {
        console.log('Update result:', { err, result });
        if (err) {
          res.status(500).json({ success: false, message: 'Error updating location' });
          return;
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Location not found or not authorized' });
        }
        res.json({ success: true, message: 'Location updated successfully' });
      }
    );
  },

  deleteLocation(req, res) {
    const { location_id } = req.params;
    db.query(
          'DELETE FROM locations WHERE location_id = ?',
          [location_id],
          (err, result) => {
            if (err) {
              res.status(500).json({ success: false, message: 'Error deleting location' });
              return;
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ success: false, message: 'Location not found' });
            }
            res.json({ success: true, message: 'Location deleted successfully' });
          }
        );
  }
};

module.exports = LocationController;
