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
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
        name,
        email,
        hashedPassword,
        'admin'
      ]);

      res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Admin login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Register company admin (with auto company_code)
  static async registerCompanyAdmin(req, res) {
    try {
      const { name, email, password, company_name, company_address, currency } = req.body;
      const logoFile = req.file;
  
      if (!logoFile) {
        return res.status(400).json({ message: 'Company logo is required' });
      }
  
      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const company_code = 'CMP' + Math.floor(1000 + Math.random() * 9000);
      const company_logo = logoFile.filename;
  
      await db.query(
        'INSERT INTO users (name, email, password, role, company_name, company_address, company_logo, currency, company_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, 'company_admin', company_name, company_address, company_logo, currency, company_code]
      );
  
      res.status(201).json({ message: 'Company admin registered', company_code });
    } catch (err) {
      console.error('Company admin register error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get admin by ID
  static async getAdminById(req, res) {
    try {
      const { user_id } = req.params;
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [user_id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error('Get admin error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Edit admin
  static async editAdmin(req, res) {
    try {
      const { user_id } = req.params;
      const { name, email } = req.body;

      await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, user_id]);
      res.json({ message: 'Admin updated successfully' });
    } catch (err) {
      console.error('Edit admin error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete admin
  static async deleteAdmin(req, res) {
    try {
      const { user_id } = req.params;
      await db.query('DELETE FROM users WHERE id = ?', [user_id]);
      res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
      console.error('Delete admin error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update admin profile
  static async updateAdminProfile(req, res) {
    try {
      const { user_id } = req.params;
      const { name, email, password } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [
        name, email, hashedPassword, user_id
      ]);

      res.json({ message: 'Admin profile updated successfully' });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AdminAuthController;
