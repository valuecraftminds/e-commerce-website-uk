const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/database');
const transporter = require('../../utils/mailer');

const authController = {
  // User registration with email verification
  register: (req, res) => {
    const { company_code, first_name, last_name, email, phone, password, country, frontend_url } = req.body;

    // Check for duplicate email in customers table
    db.query('SELECT * FROM customers WHERE email = ?', [email], async (err, emailCheck) => {
      if (err) {
        console.error('Email check error:', err);
        return res.status(500).json({ success: false, message: 'Database error during email check' });
      }

      if (emailCheck.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      // Check for duplicate phone in customers table
      db.query('SELECT * FROM customers WHERE phone = ?', [phone], async (err, phoneCheck) => {
        if (err) {
          console.error('Phone check error:', err);
          return res.status(500).json({ success: false, message: 'Database error during phone check' });
        }

        if (phoneCheck.length > 0) {
          return res.status(409).json({ success: false, message: 'Phone number already exists' });
        }

        // Check for existing email in pending_customer_verifications
        db.query('SELECT * FROM pending_customer_verifications WHERE email = ?', [email], async (err, pendingCheck) => {
          if (err) {
            console.error('Pending check error:', err);
            return res.status(500).json({ success: false, message: 'Database error during pending check' });
          }

          if (pendingCheck.length > 0) {
            return res.status(409).json({ success: false, message: 'A verification email has already been sent to this address. Please check your inbox.' });
          }

          try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate verification token
            const token = crypto.randomBytes(32).toString('hex');

            // Insert into pending_customer_verifications
            db.query(
              'INSERT INTO pending_customer_verifications (company_code, first_name, last_name, email, phone, password, country, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [company_code, first_name, last_name, email, phone, hashedPassword, country, token],
              async (err, result) => {
                if (err) {
                  console.error('Insert error:', err);
                  return res.status(500).json({ success: false, message: 'Database error during registration' });
                }

                try {
                  // Use frontend_url from request if provided, else fallback to env
                  const frontendUrl = frontend_url || process.env.FRONTEND_URL || 'http://localhost:3000';
                  const verifyUrl = `${frontendUrl}/verify-customer?token=${token}`;

                  // Send verification email
                  await transporter.sendMail({
                    from: process.env.SMTP_USER || 'no-reply@yourdomain.com',
                    to: email,
                    subject: 'Verify Your Account - Welcome!',
                    html: `
                      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px 18px;background:#f9f9f9;border-radius:8px;">
                        <h2 style="color:#2d3748;">Welcome! Please Verify Your Email</h2>
                        <p>Hello <strong>${first_name} ${last_name}</strong>,</p>
                        <p>Thank you for creating an account with us! To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
                        <div style="margin:18px 0;">
                          <a href="${verifyUrl}" style="background:#007bff;color:#fff;text-decoration:none;padding:12px 28px;border-radius:5px;font-size:1.1em;display:inline-block;">Verify My Email</a>
                        </div>
                        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                        <p style="word-break:break-all;color:#666;">${verifyUrl}</p>
                        <hr style="margin:24px 0;" />
                        <p style="color:#555;font-size:0.97em;">If you did not create this account, you can safely ignore this email.</p>
                        <p style="color:#888;font-size:0.93em;">&copy; ${new Date().getFullYear()} Our Store</p>
                      </div>
                    `
                  });

                  res.json({ success: true, message: 'Registration successful! Please check your email to verify your account.' });
                } catch (emailError) {
                  console.error('Email sending error:', emailError);
                  // Delete the pending record if email fails
                  db.query('DELETE FROM pending_customer_verifications WHERE email = ?', [email]);
                  return res.status(500).json({ success: false, message: 'Registration failed. Could not send verification email.' });
                }
              }
            );
          } catch (hashError) {
            console.error('Password hashing error:', hashError);
            return res.status(500).json({ success: false, message: 'Error hashing password' });
          }
        });
      });
    });
  },

  // Verify customer email and move to customers table
  verifyCustomerEmail: (req, res) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invalid or missing token.' });
    }

    // Find pending customer by token
    db.query('SELECT * FROM pending_customer_verifications WHERE token = ?', [token], (err, pendingResults) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (pendingResults.length === 0) {
        return res.status(409).json({ success: false, message: 'This email is already verified or the link is invalid/expired.' });
      }

      const pendingCustomer = pendingResults[0];

      // Check if customer already exists in customers table
      db.query('SELECT * FROM customers WHERE email = ?', [pendingCustomer.email], (err, existingCustomer) => {
        if (err) {
          console.error('Customer check error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (existingCustomer.length > 0) {
          // Clean up pending record
          db.query('DELETE FROM pending_customer_verifications WHERE id = ?', [pendingCustomer.id]);
          return res.status(409).json({ success: false, message: 'Customer already verified.' });
        }

        // Insert into customers table
        db.query(
          'INSERT INTO customers (company_code, first_name, last_name, email, phone, password, country) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            pendingCustomer.company_code,
            pendingCustomer.first_name,
            pendingCustomer.last_name,
            pendingCustomer.email,
            pendingCustomer.phone,
            pendingCustomer.password,
            pendingCustomer.country
          ],
          (err, insertResult) => {
            if (err) {
              console.error('Customer insert error:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            // Delete from pending_customer_verifications
            db.query('DELETE FROM pending_customer_verifications WHERE id = ?', [pendingCustomer.id], (err) => {
              if (err) {
                console.error('Pending cleanup error:', err);
                // Continue anyway since customer is created
              }

              res.json({ success: true, message: 'Email verified successfully! You can now log in to your account.' });
            });
          }
        );
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
          return res.status(401).json({ success: false, message: 'Invalid email or account not verified' });
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
