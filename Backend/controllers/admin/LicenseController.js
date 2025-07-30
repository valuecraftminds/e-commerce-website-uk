const db = require('../../config/database'); 

class LicenseController {
  // Add or update license
  static async addLicense(req, res) {
    const { company_code, category_count } = req.body;

    if (!company_code || !category_count) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
      const [existingLicense] = await db.query(
        'SELECT * FROM admin_license WHERE company_code = ?',
        [company_code]
      );

      if (existingLicense.length > 0) {
        // Update license
        await db.query(
          'UPDATE admin_license SET category_count = ? WHERE company_code = ?',
          [category_count, company_code]
        );
      } else {
        // Insert new license
        await db.query(
          'INSERT INTO admin_license (company_code, category_count) VALUES (?, ?)',
          [company_code, category_count]
        );
      }

      res.json({ success: true, message: 'License updated successfully' });
    } catch (error) {
      console.error('License error:', error);
      res.status(500).json({ success: false, message: 'Error updating license' });
    }
  }

  // Get license by company_code
  static async getLicense(req, res) {
    const { company_code } = req.params;

    try {
      const [license] = await db.query(
        'SELECT * FROM admin_license WHERE company_code = ?',
        [company_code]
      );

      res.json({
        success: true,
        license: license[0] || { company_code, category_count: 0 }
      });
    } catch (error) {
      console.error('Get license error:', error);
      res.status(500).json({ success: false, message: 'Error fetching license' });
    }
  }
}

module.exports = LicenseController;
