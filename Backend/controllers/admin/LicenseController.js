const db = require('../../config/database'); 

class LicenseController {
  // Add or update license
  static addLicense(req, res) {
    const { company_code, category_count } = req.body;

    if (!company_code || !category_count) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    db.query(
      'SELECT * FROM admin_license WHERE company_code = ?',
      [company_code],
      (err, existingLicense) => {
        if (err) {
          console.error('License error:', err);
          return res.status(500).json({ success: false, message: 'Error updating license' });
        }

        if (existingLicense.length > 0) {
          // Update license
          db.query(
            'UPDATE admin_license SET category_count = ? WHERE company_code = ?',
            [category_count, company_code],
            (err) => {
              if (err) {
                console.error('License update error:', err);
                return res.status(500).json({ success: false, message: 'Error updating license' });
              }
              res.json({ success: true, message: 'License updated successfully' });
            }
          );
        } else {
          // Insert new license
          db.query(
            'INSERT INTO admin_license (company_code, category_count) VALUES (?, ?)',
            [company_code, category_count],
            (err) => {
              if (err) {
                console.error('License insert error:', err);
                return res.status(500).json({ success: false, message: 'Error updating license' });
              }
              res.json({ success: true, message: 'License updated successfully' });
            }
          );
        }
      }
    );
  }

  // Get license by company_code
  static getLicense(req, res) {
    const { company_code } = req.params;

    db.query(
      'SELECT * FROM admin_license WHERE company_code = ?',
      [company_code],
      (err, license) => {
        if (err) {
          console.error('Get license error:', err);
          return res.status(500).json({ success: false, message: 'Error fetching license' });
        }

        res.json({
          success: true,
          license: license[0] || { company_code, category_count: 0 }
        });
      }
    );
  }
}

module.exports = LicenseController;
