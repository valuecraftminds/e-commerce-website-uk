const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const CompanyController = require('./CompanyController'); // Adjust the path as needed
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class AdminAuthController {
  // Register admin
  static register(req, res) {
  const { company_code, name, email, phone, role, password, side_bar_options } = req.body;

  if (!company_code || !name || !email || !phone || !role || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
  }

  db.query('SELECT * FROM admin_users WHERE email = ?', [email], (err, emailExists) => {
    if (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    if (emailExists.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    
    db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone], (err, phoneExists) => {
      if (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (phoneExists.length > 0) {
        return res.status(409).json({ success: false, message: 'Phone number already exists' });
      }

      const isValidPassword = (pwd) => {
        const lengthValid = pwd.length >= 8 && pwd.length <= 12;
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasLowercase = /[a-z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecialChar = /[\W_]/.test(pwd);
        return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
      };

      if (!isValidPassword(password)) {
        return res.status(400).json({ success: false, message: 'Invalid password. Must be 8–12 characters and include uppercase, lowercase, number, and special character.' });
      }

      // Process side_bar_options - ensure we save both parent and child options
      let sidebarOptionsToSave = null;
      if (side_bar_options) {
        try {
          let optionsArray = Array.isArray(side_bar_options) ? side_bar_options : JSON.parse(side_bar_options);
          
          // Validate and ensure dropdown parents are included
          const validatedOptions = validateAndNormalizeSidebarOptions(optionsArray);
          sidebarOptionsToSave = JSON.stringify(validatedOptions);
        } catch {
          sidebarOptionsToSave = null;
        }
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Password hash error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        db.query(
          'INSERT INTO admin_users (company_code, name, email, phone_number, role, password, side_bar_options) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [company_code, name, email, phone, role, hashedPassword, sidebarOptionsToSave],
          (err) => {
            if (err) {
              console.error('Register error:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }
            return res.status(201).json({ success: true, message: 'User registered successfully' });
          }
        );
      });
    });
  });
}
  
  
 // Admin login
static login(req, res) {
  const { email, password } = req.body;

  db.query('SELECT * FROM admin_users WHERE email = ?', [email], (err, rows) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email' });
    }

    const user = rows[0];

    bcrypt.compare(password, user.password, (err, validPassword) => {
      if (err) {
        console.error('Password comparison error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Parse and validate sidebar options
      let sideBarOptions = null;
      if (user.side_bar_options) {
        try {
          sideBarOptions = JSON.parse(user.side_bar_options);
          // Ensure backward compatibility and proper parent-child relationships
          sideBarOptions = validateAndNormalizeSidebarOptions(sideBarOptions);
        } catch {
          sideBarOptions = null;
        }
      }

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.user_id,
          company_code: user.company_code,
          name: user.name,
          phone_number: user.phone_number,
          email: user.email,
          role: user.role,
          side_bar_options: sideBarOptions
        },
      });
    });
  });
}


  // Register company admin
  static async registerCompanyAdmin(req, res) {
    const { name, email, phone, role, password } = req.body;
    const logoFile = req.file;

    // Field presence check and validation
    if (!name || !email || !phone || !role || !password || !logoFile) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
    }

    try {
      // Check for existing email
      const emailCheckResult = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_users WHERE email = ?', [email], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (emailCheckResult.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      // Check for existing phone
      const phoneCheckResult = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (phoneCheckResult.length > 0) {
        return res.status(409).json({ success: false, message: 'Phone number already exists' });
      }

      // Generate next company code
      const newCompanyCode = await CompanyController.generateNextCompanyCode();

      

      // Then create admin user with company_code reference only
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO admin_users (name, email, phone_number, role, password, company_code) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, phone, role, hashedPassword, newCompanyCode],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Company admin registered successfully',
        company_code: newCompanyCode 
      });

    } catch (error) {
      console.error('Register company admin error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Create company only (Step 1)
  static async createCompany(req, res) {
    const { company_name, company_address, currency } = req.body;
    const logoFile = req.file;

    if (!company_name || !company_address || !currency || !logoFile) {
      return res.status(400).json({ success: false, message: 'All company fields are required' });
    }

    try {
      // Generate next company code
      const newCompanyCode = await CompanyController.generateNextCompanyCode();
      const company_logo = logoFile.filename;

      // Create company
      const companyId = await CompanyController.createCompany({
        company_code: newCompanyCode,
        company_name,
        company_address,
        company_logo,
        currency
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Company created successfully',
        company_code: newCompanyCode,
        company_id: companyId
      });

    } catch (error) {
      console.error('Create company error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Update existing company
  static async updateCompany(req, res) {
    const { id } = req.params;
    const { company_name, company_address, currency } = req.body;
    const logoFile = req.file;

    if (!company_name || !company_address || !currency) {
      return res.status(400).json({ success: false, message: 'Company name, address, and currency are required' });
    }

    try {
      // Get existing company to check if it exists
      const existingCompany = await CompanyController.getCompanyById(id);
      if (!existingCompany) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      // Prepare update data
      const updateData = {
        company_name,
        company_address,
        currency
      };

      // Add logo filename if a new file was uploaded
      if (logoFile) {
        updateData.company_logo = logoFile.filename;
      }

      // Update company
      const updated = await CompanyController.updateCompany(id, updateData);

      if (!updated) {
        return res.status(500).json({ success: false, message: 'Failed to update company' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Company updated successfully'
      });

    } catch (error) {
      console.error('Update company error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Create company admin user only (Step 2)
  static async createCompanyAdmin(req, res) {
    const { name, email, phone, role, password, company_code } = req.body;

    if (!name || !email || !phone || !role || !password || !company_code) {
      return res.status(400).json({ success: false, message: 'All admin fields are required' });
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
    }

    try {
      // Check if company exists
      const company = await CompanyController.getCompanyByCode(company_code);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      // Check for existing email
      const emailCheckResult = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_users WHERE email = ?', [email], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (emailCheckResult.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      // Check for existing phone
      const phoneCheckResult = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (phoneCheckResult.length > 0) {
        return res.status(409).json({ success: false, message: 'Phone number already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user with company_code reference
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO admin_users (name, email, phone_number, role, password, company_code) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, phone, role, hashedPassword, company_code],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Company admin created successfully',
        company_code: company_code
      });

    } catch (error) {
      console.error('Create company admin error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Edit admin
static editAdmin(req, res) {
  const { user_id } = req.params;

  console.log('Edit Admin - Request params:', req.params);
  console.log('Edit Admin - Request body:', req.body);

  const { name, email, phone_number, role, currentPassword, newPassword, password, side_bar_options } = req.body || {};

  if (!name || !email || !phone_number) {
    return res.status(400).json({ success: false, message: 'All basic fields are required' });
  }

  // Prepare update fields and values
  let updateFields = ['name = ?', 'email = ?', 'phone_number = ?'];
  let updateValues = [name, email, phone_number];

  // Only update role if provided
  if (role) {
    updateFields.push('role = ?');
    updateValues.push(role);
  }

  // Handle side_bar_options with proper validation
  if (typeof side_bar_options !== 'undefined') {
    updateFields.push('side_bar_options = ?');
    let sidebarOptionsToSave = null;
    try {
      let optionsArray = Array.isArray(side_bar_options) ? side_bar_options : JSON.parse(side_bar_options);
      const validatedOptions = validateAndNormalizeSidebarOptions(optionsArray);
      sidebarOptionsToSave = JSON.stringify(validatedOptions);
    } catch {
      sidebarOptionsToSave = null;
    }
    updateValues.push(sidebarOptionsToSave);
  }

  // Handle password update logic (same as before)
  const shouldUpdatePassword = (currentPassword && newPassword) || password;

  if (currentPassword && newPassword) {
    // Get current password for comparison
    db.query(
      'SELECT password FROM admin_users WHERE user_id = ?',
      [user_id],
      (err, userRows) => {
        if (err) {
          console.error('Password fetch error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (userRows.length === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Compare passwords
        bcrypt.compare(currentPassword, userRows[0].password, (err, isMatch) => {
          if (err) {
            console.error('Password compare error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
          }

          // Hash new password
          bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
              console.error('Password hash error:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            // Update with new password
            const fields = [...updateFields, 'password = ?'];
            const values = [...updateValues, hashedPassword, user_id];
            db.query(
              `UPDATE admin_users SET ${fields.join(', ')} WHERE user_id = ?`,
              values,
              (err, result) => {
                if (err) {
                  console.error('Update error:', err);
                  return res.status(500).json({ success: false, message: 'Server error' });
                }
                if (result.affectedRows === 0) {
                  return res.status(404).json({ success: false, message: 'Admin not found' });
                }
                res.json({ success: true, message: 'Admin updated successfully with new password' });
              }
            );
          });
        });
      }
    );
  } else if (password) {
    // Direct password update
    const isValidPassword = (pwd) => {
      const lengthValid = pwd.length >= 8 && pwd.length <= 12;
      const hasUppercase = /[A-Z]/.test(pwd);
      const hasLowercase = /[a-z]/.test(pwd);
      const hasNumber = /\d/.test(pwd);
      const hasSpecialChar = /[\W_]/.test(pwd);
      return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
    };

    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid password. Must be 8–12 characters and include uppercase, lowercase, number, and special character.' 
      });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Password hash error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const fields = [...updateFields, 'password = ?'];
      const values = [...updateValues, hashedPassword, user_id];
      db.query(
        `UPDATE admin_users SET ${fields.join(', ')} WHERE user_id = ?`,
        values,
        (err, result) => {
          if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
          }
          res.json({ success: true, message: 'Admin updated successfully with new password' });
        }
      );
    });
  } else {
    // Update without password change
    updateValues.push(user_id);
    db.query(
      `UPDATE admin_users SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues,
      (err, result) => {
        if (err) {
          console.error('Update error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, message: 'Admin updated successfully' });
      }
    );
  }
}

  // Delete admin
  static deleteAdmin(req, res) {
    const { user_id } = req.params;
    db.query(
      'DELETE FROM admin_users WHERE user_id = ?', 
      [user_id], 
      (err) => {
        if (err) {
          console.error('Delete admin error:', err);
          return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'Admin deleted successfully' });
      }
    );
  }

  // Update admin profile
  static updateAdminProfile(req, res) {
    const { user_id } = req.params;
    const { name, email, phone_number, currentPassword, newPassword } = req.body;

    if (!name || !email || !phone_number) {
      return res.status(400).json({ success: false, message: 'All basic fields are required' });
    }

    if (currentPassword && newPassword) {
      // Get current password and verify
      db.query(
        'SELECT password FROM admin_users WHERE user_id = ?',
        [user_id],
        (err, userRows) => {
          if (err) {
            console.error('Password fetch error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
          }

          bcrypt.compare(currentPassword, userRows[0].password, (err, isMatch) => {
            if (err) {
              console.error('Password compare error:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            if (!isMatch) {
              return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }

            // Hash new password
            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
              if (err) {
                console.error('Password hash error:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
              }

              // Update profile with new password
              db.query(
                'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, password = ? WHERE user_id = ?',
                [name, email, phone_number, hashedPassword, user_id],
                (err, result) => {
                  if (err) {
                    console.error('Update error:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                  }

                  if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Admin not found' });
                  }

                  return res.json({ success: true, message: 'Admin updated successfully with new password' });
                }
              );
            });
          });
        }
      );
    } else {
      // Update without password change
      db.query(
        'UPDATE admin_users SET name = ?, email = ?, phone_number = ? WHERE user_id = ?',
        [name, email, phone_number, user_id],
        (err, result) => {
          if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
          }

          return res.json({ success: true, message: 'Admin updated successfully' });
        }
      );
    }
  }

  // Display Company admins only
  static getCompanyAdmins(req, res) {
    db.query(
      `SELECT 
        au.user_id, 
        au.name AS Name, 
        au.email AS Email, 
        au.phone_number AS Phone, 
        au.company_code AS Company_Code,
        c.company_name,
        c.company_address,
        c.company_logo,
        c.currency
      FROM admin_users au 
      LEFT JOIN companies c ON au.company_code = c.company_code 
      WHERE au.role = "Company_Admin"`,
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, admins: results });
      }
    );
  }

  // Display all admin users for a given company
  static getAdminsByCompany(req, res) {
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }

    db.query(
      'SELECT user_id, name AS Name, email AS Email, phone_number AS Phone, role AS Role FROM admin_users WHERE company_code = ? AND role != "VCM_Admin" AND role != "Company_Admin"',
      [company_code],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, admins: results });
      }
    );
  }

  // Update Company Admin
  static async updateCompanyAdmin(req, res) {
    const { user_id } = req.params;
    const { name, email, phone, role, password } = req.body;

    console.log('Update Company Admin - Request params:', req.params);
    console.log('Update Company Admin - Request body:', req.body);
    console.log('Update Company Admin - Content-Type:', req.headers['content-type']);

    if (!name || !email || !phone || !role) {
      return res.status(400).json({ success: false, message: 'All basic fields are required' });
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
    }

    try {
      // Build admin update query
      let adminUpdateFields = ['name = ?', 'email = ?', 'phone_number = ?', 'role = ?'];
      let adminUpdateValues = [name, email, phone, role];

      // Handle password if provided
      if (password) {
        const isValidPassword = (pwd) => {
          const lengthValid = pwd.length >= 8 && pwd.length <= 12;
          const hasUppercase = /[A-Z]/.test(pwd);
          const hasLowercase = /[a-z]/.test(pwd);
          const hasNumber = /\d/.test(pwd);
          const hasSpecialChar = /[\W_]/.test(pwd);
          return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
        };

        if (!isValidPassword(password)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid password. Must be 8–12 characters and include uppercase, lowercase, number, and special character.' 
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        adminUpdateFields.push('password = ?');
        adminUpdateValues.push(hashedPassword);
      }

      adminUpdateValues.push(user_id); // Add user_id for WHERE clause

      // Update admin details only
      const adminUpdateQuery = `UPDATE admin_users SET ${adminUpdateFields.join(', ')} WHERE user_id = ?`;
      const result = await new Promise((resolve, reject) => {
        db.query(adminUpdateQuery, adminUpdateValues, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      res.json({ success: true, message: 'Company admin updated successfully' });

    } catch (error) {
      console.error('Update error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Get admin by user ID
  static getAdminById(req, res) {
    const { user_id } = req.params;

    db.query(
      `SELECT 
        au.*, 
        c.company_name,
        c.company_address,
        c.company_logo,
        c.currency
      FROM admin_users au 
      LEFT JOIN companies c ON au.company_code = c.company_code 
      WHERE au.user_id = ?`,
      [user_id],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: err.message });
        }
        if (result.length === 0) {
          return res.json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin: { ...result[0], side_bar_options: result[0].side_bar_options ? JSON.parse(result[0].side_bar_options) : null } });
      }
    );
  }



  

}


// Helper function to validate and normalize sidebar options
function validateAndNormalizeSidebarOptions(options) {
  if (!Array.isArray(options)) return [];

  // Define dropdown relationships
  const dropdownMap = {
    warehouse: ['warehouse_grn', 'warehouse_issuing'],
    merchandising: ['merchandising_po'],
    finance: ['finance_currency', 'finance_supplier'],
    settings: ['settings_profile', 'settings_company', 'settings_website']
  };

  const normalizedOptions = [...options];

  // Ensure parent dropdowns are included when their children are selected
  Object.keys(dropdownMap).forEach(parent => {
    const children = dropdownMap[parent];
    const hasAnyChild = children.some(child => normalizedOptions.includes(child));
    
    if (hasAnyChild && !normalizedOptions.includes(parent)) {
      normalizedOptions.push(parent);
    }
  });

  // Remove duplicates and return
  return [...new Set(normalizedOptions)];
}


module.exports = AdminAuthController;
