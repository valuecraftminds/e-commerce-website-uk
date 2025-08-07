const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database'); // Adjust the path as needed
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class AdminAuthController {
  // Register admin
  static register(req, res) {
    const { company_code, name, email, phone, role, password } = req.body;
  
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
    
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Password hash error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          
          db.query(
            'INSERT INTO admin_users (company_code, name, email, phone_number, role, password) VALUES (?, ?, ?, ?, ?, ?)',
            [company_code, name, email, phone, role, hashedPassword],
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
          },
        });
      });
    });
  }


  // Register company admin
  static registerCompanyAdmin(req, res) {
    const { name, email, phone, role, password, company_name, company_address, currency } = req.body;
    const logoFile = req.file;

    // Field presence check and validation
    if (!name || !email || !phone || !role || !password || !company_name || !company_address || !currency || !logoFile) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
    }

    // Check for existing email
    db.query('SELECT * FROM admin_users WHERE email = ?', [email], (err, emailResults) => {
      if (err) {
        console.error('Email check error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (emailResults.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      // Check for existing phone
      db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone], (err, phoneResults) => {
        if (err) {
          console.error('Phone check error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (phoneResults.length > 0) {
          return res.status(409).json({ success: false, message: 'Phone number already exists' });
        }

        // Get latest company code
        db.query(
          'SELECT company_code FROM admin_users WHERE company_code IS NOT NULL ORDER BY company_code DESC LIMIT 1',
          (err, latest) => {
            if (err) {
              console.error('Company code error:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            let newCompanyCode = 'C001';
            if (latest.length > 0 && latest[0].company_code) {
              const lastNum = parseInt(latest[0].company_code.slice(1));
              const nextNum = lastNum + 1;
              newCompanyCode = 'C' + nextNum.toString().padStart(3, '0');
            }

            // Hash password
            bcrypt.hash(password, 10, (err, hashedPassword) => {
              if (err) {
                console.error('Password hash error:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
              }

              const company_logo = logoFile.filename;

              // Insert new company admin
              db.query(
                `INSERT INTO admin_users (name, email, phone_number, role, password, company_name, 
                  company_address, company_logo, currency, company_code) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, role, hashedPassword, company_name, 
                  company_address, company_logo, currency, newCompanyCode],
                (err) => {
                  if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                  }
                  res.status(201).json({
                    success: true,
                    message: 'Company admin registered successfully',
                    company_code: newCompanyCode
                  });
                }
              );
            });
          }
        );
      });
    });
  }

  // Edit admin
  static editAdmin(req, res) {
    const { user_id } = req.params;
    const { name, email, phone_number, role, currentPassword, newPassword } = req.body;

    if (!name || !email || !phone_number) {
      return res.status(400).json({ success: false, message: 'All basic fields are required' });
    }

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
              db.query(
                'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ?, password = ? WHERE user_id = ?',
                [name, email, phone_number, role, hashedPassword, user_id],
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
    } else {
      // Update without password change
      db.query(
        'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ? WHERE user_id = ?',
        [name, email, phone_number, role, user_id],
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
      'SELECT user_id, name AS Name, email AS Email, phone_number AS Phone, company_code AS Company_Code FROM admin_users WHERE role = "Company_Admin"',
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

  // Get admin by user ID
  static getAdminById(req, res) {
    const { user_id } = req.params;

    db.query(
      'SELECT * FROM admin_users WHERE user_id = ?',
      [user_id],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: err.message });
        }
        if (result.length === 0) {
          return res.json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin: result[0] });
      }
    );
  }


}





module.exports = AdminAuthController;
