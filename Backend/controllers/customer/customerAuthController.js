const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const authController = {
  // User registration
  register: async (req, res) => {
    const { company_code, name, email, phone, password, country } = req.body;

    try {
      // Check for duplicate email
      const emailCheck = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM customers WHERE email = ?', [email], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (emailCheck.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already exists' 
        });
      }

      // Check for duplicate phone
      const phoneCheck = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM customers WHERE phone = ?', [phone], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (phoneCheck.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Phone number already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO customers (company_code, name, email, phone, password, country) VALUES (?, ?, ?, ?, ?, ?)',
          [company_code, name, email, phone, hashedPassword, country],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

      res.json({ 
        success: true, 
        message: 'User registered successfully' 
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Database error during registration' 
      });
    }
  },

  // User login
  login: async (req, res) => {
    const { company_code, email, password } = req.body;

    try {
      const results = await new Promise((resolve, reject) => {
        db.query(
          'SELECT * FROM customers WHERE email = ? AND company_code = ?',
          [email, company_code],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

      if (results.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email' 
        });
      }

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid password' 
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.customer_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.customer_id,
          company_code: user.company_code,
          name: user.name,
          phone: user.phone,
          email: user.email,
          country: user.country
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Database error during login' 
      });
    }
  },

  // Protected route
  // protectedProfile: async (req, res) => {
  // const authHeader = req.headers.authorization;
  // if (!authHeader) return res.sendStatus(401);

  //   const token = authHeader.split(' ')[1];
  //   jwt.verify(token, SECRET_KEY, (err, user) => {
  //     if (err) return res.sendStatus(403);
  //     res.json({ message: `Welcome ${user.username}` });
  //   });
  // }
}

module.exports = authController;