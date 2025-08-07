const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const authController = {
  // User registration
  register: (req, res) => {
    const { company_code, first_name, last_name, email, phone, password, country } = req.body;

    // Check for duplicate email
    db.query('SELECT * FROM customers WHERE email = ?', [email], async (err, emailCheck) => {
      if (err) {
        console.error('Email check error:', err);
        return res.status(500).json({ success: false, message: 'Database error during email check' });
      }

      if (emailCheck.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      // Check for duplicate phone
      db.query('SELECT * FROM customers WHERE phone = ?', [phone], async (err, phoneCheck) => {
        if (err) {
          console.error('Phone check error:', err);
          return res.status(500).json({ success: false, message: 'Database error during phone check' });
        }

        if (phoneCheck.length > 0) {
          return res.status(409).json({ success: false, message: 'Phone number already exists' });
        }

        try {
          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert new user
          db.query(
            'INSERT INTO customers (company_code, first_name, last_name, email, phone, password, country) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [company_code, first_name, last_name, email, phone, hashedPassword, country],
            (err, result) => {
              if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ success: false, message: 'Database error during registration' });
              }

              res.json({ success: true, message: 'User registered successfully' });
            }
          );
        } catch (hashError) {
          console.error('Password hashing error:', hashError);
          return res.status(500).json({ success: false, message: 'Error hashing password' });
        }
      });
    });
  },

  // User login
  login: (req, res) => {
    const { company_code, email, password } = req.body;

    db.query(
      'SELECT * FROM customers WHERE email = ? AND company_code = ?',
      [email, company_code],
      async (err, results) => {
        if (err) {
          console.error('Login query error:', err);
          return res.status(500).json({ success: false, message: 'Database error during login' });
        }

        if (results.length === 0) {
          return res.status(401).json({ success: false, message: 'Invalid email' });
        }

        const user = results[0];

        try {
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
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
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              email: user.email,
              country: user.country
            }
          });

        } catch (compareError) {
          console.error('Password compare error:', compareError);
          return res.status(500).json({ success: false, message: 'Password comparison error' });
        }
      }
    );
  }
};

module.exports = authController;
