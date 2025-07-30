const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database'); // Adjust the path as needed
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class AdminAuthController {
  // Register admin
  static async register(req, res) {
    try {
      const { company_code, name, email, phone, role, password } = req.body;
  
      // Check required fields
      if (!company_code || !name || !email || !phone || !role || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
  
      // Name validation
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
      }
  
      // Check duplicate email
      const [emailExists] = await db.query('SELECT * FROM admin_users WHERE email = ?', [email]);
      if (emailExists.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
  
  
      // Check duplicate phone number
      const [phoneExists] = await db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone]);
      if (phoneExists.length > 0) {
        return res.status(409).json({ success: false, message: 'Phone number already exists' });
      }
  
      // Password validation
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
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert user
      await db.query(
        'INSERT INTO admin_users (company_code, name, email, phone_number, role, password) VALUES (?, ?, ?, ?, ?, ?)',
        [company_code, name, email, phone, role, hashedPassword]
      );
  
      return res.status(201).json({ success: true, message: 'User registered successfully' });
  
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
  
  
 // Admin login
static async login(req, res) {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM admin_users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email' });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
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
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}


  // Register company admin (with auto company_code)
  static async registerCompanyAdmin(req, res) {
    try {
      const { name, email, phone, role, password, company_name, company_address, currency } = req.body;
      const logoFile = req.file;
  
      // Field presence check
      if (!name || !email || !phone || !role || !password || !company_name || !company_address || !currency) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
  
      if (!logoFile) {
        return res.status(400).json({ success: false, message: 'Company logo is required' });
      }
  
      // Name validation
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ success: false, message: 'Name can only contain letters and spaces' });
      }
  
      // Email duplication check
      const [emailExists] = await db.query('SELECT * FROM admin_users WHERE email = ?', [email]);
      if (emailExists.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
       
  
      const [phoneExists] = await db.query('SELECT * FROM admin_users WHERE phone_number = ?', [phone]);
      if (phoneExists.length > 0) {
        return res.status(409).json({ success: false, message: 'Phone number already exists' });
      }
  
      // Password validation
      function isValidPassword(pw) {
        const lengthValid = pw.length >= 8 && pw.length <= 12;
        const hasUppercase = /[A-Z]/.test(pw);
        const hasLowercase = /[a-z]/.test(pw);
        const hasNumber = /\d/.test(pw);
        const hasSpecialChar = /[\W_]/.test(pw);
        return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
      }
  
      if (!isValidPassword(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be 8–12 characters, include upper, lower, number, and special character'
        });
      }
  
      // Auto-generate company code like C001, C002...
      const [latest] = await db.query('SELECT company_code FROM admin_users WHERE company_code IS NOT NULL ORDER BY company_code DESC LIMIT 1');
  
      let newCompanyCode = 'C001';
      if (latest.length > 0 && latest[0].company_code) {
        const lastNum = parseInt(latest[0].company_code.slice(1));
        const nextNum = lastNum + 1;
        newCompanyCode = 'C' + nextNum.toString().padStart(3, '0');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const company_logo = logoFile.filename;
  
      // Insert new company admin
      await db.query(
        `INSERT INTO admin_users 
          (name, email, phone_number, role, password, company_name, company_address, company_logo, currency, company_code) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, role, hashedPassword, company_name, company_address, company_logo, currency, newCompanyCode]
      );
  
      res.status(201).json({
        success: true,
        message: 'Company admin registered successfully',
        company_code: newCompanyCode
      });
  
    } catch (err) {
      console.error('Company admin register error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
  

  // // Get admin by ID
  // static async getAdminById(req, res) {
  //   try {
  //     const { user_id } = req.params;
  //     const [rows] = await db.query('SELECT * FROM admin_users WHERE id = ?', [user_id]);

  //     if (rows.length === 0) {
  //       return res.status(404).json({ message: 'Admin not found' });
  //     }

  //     res.json(rows[0]);
  //   } catch (err) {
  //     console.error('Get admin error:', err);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // }

  // Edit admin
  static async editAdmin(req, res) {
    const { user_id } = req.params;
    const { name, email, phone_number, role, currentPassword, newPassword } = req.body;

    if (!name || !email || !phone_number) {
      return res.status(400).json({ success: false, message: 'All basic fields are required' });
    }

    try {
      if (currentPassword && newPassword) {
        // Get current hashed password
        const [userRows] = await db.query('SELECT password FROM admin_users WHERE user_id = ?', [user_id]);

        if (userRows.length === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, userRows[0].password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update admin with new password
        const [result] = await db.query(
          'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ?, password = ? WHERE user_id = ?',
          [name, email, phone_number, role, hashedNewPassword, user_id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, message: 'Admin updated successfully with new password' });
      } else {
        // Update without password change
        const [result] = await db.query(
          'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, role = ? WHERE user_id = ?',
          [name, email, phone_number, role, user_id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, message: 'Admin updated successfully' });
      }
    } catch (err) {
      console.error('Edit admin error:', err);
      res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
  }

  // Delete admin
  static async deleteAdmin(req, res) {
    try {
      const { user_id } = req.params;
      await db.query('DELETE FROM admin_users WHERE user_id = ?', [user_id]);
      res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
      console.error('Delete admin error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update admin profile
  static async updateAdminProfile(req, res) {
    const { user_id } = req.params;
    const { name, email, phone_number, currentPassword, newPassword } = req.body;

    if (!name || !email || !phone_number) {
      return res.status(400).json({ success: false, message: 'All basic fields are required' });
    }

    try {
      // If password change is requested
      if (currentPassword && newPassword) {
        const [userRows] = await db.promise().query(
          'SELECT password FROM admin_users WHERE user_id = ?',
          [user_id]
        );

        if (userRows.length === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRows[0].password);

        if (!isCurrentPasswordValid) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await db.query(
          'UPDATE admin_users SET name = ?, email = ?, phone_number = ?, password = ? WHERE user_id = ?',
          [name, email, phone_number, hashedNewPassword, user_id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        return res.json({ success: true, message: 'Admin updated successfully with new password' });
      } else {
        // Update without password change
        const [result] = await db.query(
          'UPDATE admin_users SET name = ?, email = ?, phone_number = ? WHERE user_id = ?',
          [name, email, phone_number, user_id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        return res.json({ success: true, message: 'Admin updated successfully' });
      }
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
  // Display Company admins only
  static async getCompanyAdmins(req, res) {
    try {
      const [results] = await db.query(
        'SELECT user_id, name AS Name, email AS Email, phone_number AS Phone, company_code AS Company_Code FROM admin_users WHERE role = "Company_Admin"'
      );
      res.json({ success: true, admins: results });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Display all admin users for a given company
  static async getAdminsByCompany(req, res) {
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ success: false, message: 'Company code is required' });
    }

    try {
      const [results] = await db.query(
        'SELECT user_id, name AS Name, email AS Email, phone_number AS Phone, role AS Role FROM admin_users WHERE company_code = ? AND role != "VCM_Admin" AND role != "Company_Admin"',
        [company_code]
      );
      res.json({ success: true, admins: results });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get admin by user ID
  static async getAdminById(req, res) {
    const { user_id } = req.params;

    try {
      const [result] = await db.query(
        'SELECT * FROM admin_users WHERE user_id = ?',
        [user_id]
      );
      if (result.length === 0) {
        return res.json({ success: false, message: 'Admin not found' });
      }
      res.json({ success: true, admin: result[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }


}





module.exports = AdminAuthController;
