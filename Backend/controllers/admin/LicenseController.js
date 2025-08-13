const db = require('../../config/database'); 

class LicenseController {
  // Add or update license
  static addLicense(req, res) {
    const { company_code, category_count } = req.body;

    if (!company_code || category_count === undefined || category_count === null) {
      return res.status(400).json({ success: false, message: 'Company code and category count are required' });
    }

    // Validate category_count is a positive integer
    const categoryCountNum = parseInt(category_count);
    if (isNaN(categoryCountNum) || categoryCountNum < 0) {
      return res.status(400).json({ success: false, message: 'Category count must be a positive number' });
    }

    // First, verify the company exists
    db.query(
      'SELECT company_code FROM companies WHERE company_code = ?',
      [company_code],
      (err, companyResult) => {
        if (err) {
          console.error('Company verification error:', err);
          return res.status(500).json({ success: false, message: 'Error verifying company' });
        }

        if (companyResult.length === 0) {
          return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // Now handle license creation/update
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
                [categoryCountNum, company_code],
                (err) => {
                  if (err) {
                    console.error('License update error:', err);
                    return res.status(500).json({ success: false, message: 'Error updating license' });
                  }
                  res.json({ success: true, message: 'License updated successfully', category_count: categoryCountNum });
                }
              );
            } else {
              // Insert new license
              db.query(
                'INSERT INTO admin_license (company_code, category_count) VALUES (?, ?)',
                [company_code, categoryCountNum],
                (err) => {
                  if (err) {
                    console.error('License insert error:', err);
                    return res.status(500).json({ success: false, message: 'Error creating license' });
                  }
                  res.json({ success: true, message: 'License created successfully', category_count: categoryCountNum });
                }
              );
            }
          }
        );
      }
    );
  }

  // Get license by company_code
  static getLicense(req, res) {
    const { company_code } = req.params;

    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }

    db.query(
      'SELECT l.*, c.company_name FROM admin_license l LEFT JOIN companies c ON l.company_code = c.company_code WHERE l.company_code = ?',
      [company_code],
      (err, license) => {
        if (err) {
          console.error('Get license error:', err);
          return res.status(500).json({ success: false, message: 'Error fetching license' });
        }

        if (license.length > 0) {
          res.json({
            success: true,
            license: license[0]
          });
        } else {
          // Check if company exists
          db.query(
            'SELECT company_code, company_name FROM companies WHERE company_code = ?',
            [company_code],
            (err, company) => {
              if (err) {
                console.error('Company check error:', err);
                return res.status(500).json({ success: false, message: 'Error checking company' });
              }

              if (company.length === 0) {
                return res.status(404).json({ success: false, message: 'Company not found' });
              }

              // Return default license for existing company
              res.json({
                success: true,
                license: { 
                  company_code, 
                  company_name: company[0].company_name,
                  category_count: 0,
                }
              });
            }
          );
        }
      }
    );
  }

  // Get all licenses with company details
  static getAllLicenses(req, res) {
    db.query(
      `SELECT 
        c.id as company_id,
        c.company_code, 
        c.company_name,
        c.company_address,
        c.currency,
        c.company_logo,
        c.company_phone,
        c.company_email,
        COALESCE(l.category_count, 0) as category_count
        FROM companies c 
      LEFT JOIN admin_license l ON c.company_code = l.company_code 
      ORDER BY c.company_name`,
      (err, results) => {
        if (err) {
          console.error('Get all licenses error:', err);
          return res.status(500).json({ success: false, message: 'Error fetching licenses' });
        }

        res.json({
          success: true,
          companies: results
        });
      }
    );
  }

  // Delete license
  static deleteLicense(req, res) {
    const { company_code } = req.params;

    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }

    db.query(
      'DELETE FROM admin_license WHERE company_code = ?',
      [company_code],
      (err, result) => {
        if (err) {
          console.error('Delete license error:', err);
          return res.status(500).json({ success: false, message: 'Error deleting license' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'License not found' });
        }

        res.json({ success: true, message: 'License deleted successfully' });
      }
    );
  }
}

module.exports = LicenseController;
