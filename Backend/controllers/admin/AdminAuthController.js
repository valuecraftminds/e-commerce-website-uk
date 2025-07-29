const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { validateName, validatePhone, validatePassword, validateEmail } = require('../../utils/AdminValidation');

class AdminAuthController {
  static async register(req, res) {
    try {
      const { company_code, name, email, phone, password, country } = req.body;

      // Input validation
      const missingFields = [];
      if (!company_code) missingFields.push('company_code');
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');
      if (!password) missingFields.push('password');
      if (!country) missingFields.push('country');

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate name
      if (!validateName(name)) {
        return res.status(400).json({
          success: false,
          message: 'Name can only contain letters and spaces'
        });
      }

      // Validate email
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate phone
      if (!validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Validate password
      if (!validatePassword(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be 8-12 characters with uppercase, lowercase, number and special character'
        });
      }

      // Check for existing email
      const [emailCheck] = await db.execute(
        'SELECT customer_id FROM customers WHERE email = ?',
        [email]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Check for existing phone
      const [phoneCheck] = await db.execute(
        'SELECT customer_id FROM customers WHERE phone = ?',
        [phone]
      );

      if (phoneCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert new user
      await db.execute(
        'INSERT INTO customers (company_code, name, email, phone, password, country) VALUES (?, ?, ?, ?, ?, ?)',
        [company_code, name, email, phone, hashedPassword, country]
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  }

  static async login(req, res) {
    try {
      const { company_code, email, password } = req.body;

      // Input validation
      if (!company_code || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Company code, email and password are required'
        });
      }

      // Find user
      const [results] = await db.execute(
        'SELECT * FROM customers WHERE email = ? AND company_code = ?',
        [email, company_code]
      );

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = results[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.customer_id, 
          email: user.email,
          company_code: user.company_code 
        },
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
        message: 'Server error during login'
      });
    }
  }
}
module.exports = AdminAuthController;