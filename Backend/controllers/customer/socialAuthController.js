const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const socialAuthController = {
  // Google OAuth login/register
  googleAuth: async (req, res) => {
    const { company_code, credential, googleId, email, given_name, family_name, picture, access_token } = req.body;

    try {
      let userEmail, userGoogleId, userGivenName, userFamilyName, userPicture;

      // Handle both credential-based (JWT) and access token-based authentication
      if (credential) {
        // JWT credential flow (old method)
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        userEmail = payload.email;
        userGoogleId = payload.sub;
        userGivenName = payload.given_name;
        userFamilyName = payload.family_name;
        userPicture = payload.picture;
      } else if (access_token && googleId && email) {
        // Access token flow (new method) - data already verified on frontend
        userEmail = email;
        userGoogleId = googleId;
        userGivenName = given_name;
        userFamilyName = family_name;
        userPicture = picture;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid Google authentication data' });
      }

      if (!userEmail) {
        return res.status(400).json({ success: false, message: 'Email not provided by Google' });
      }

      // Check if user already exists
      db.query('SELECT * FROM customers WHERE email = ? AND company_code = ?', [userEmail, company_code], async (err, existingUser) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (existingUser.length > 0) {
          // User exists, log them in
          const user = existingUser[0];
          
          // Update google_id if not set
          if (!user.google_id) {
            db.query('UPDATE customers SET google_id = ? WHERE customer_id = ?', [userGoogleId, user.customer_id]);
          }
          
          // Generate token
          const token = jwt.sign(
            { id: user.customer_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.json({
            success: true,
            message: 'Google login successful',
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
        } else {
          // User doesn't exist, create new account
          // Generate a random password since it's not required for social login
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          db.query(
            'INSERT INTO customers (company_code, first_name, last_name, email, phone, password, country, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [company_code, userGivenName || 'User', userFamilyName || '', userEmail, '', hashedPassword, 'Unknown', userGoogleId],
            (err, result) => {
              if (err) {
                console.error('User creation error:', err);
                return res.status(500).json({ success: false, message: 'Error creating user account' });
              }

              // Generate token for new user
              const token = jwt.sign(
                { id: result.insertId, email: userEmail },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
              );

              return res.json({
                success: true,
                message: 'Google registration successful',
                token,
                user: {
                  id: result.insertId,
                  company_code: company_code,
                  first_name: userGivenName || 'User',
                  last_name: userFamilyName || '',
                  phone: '',
                  email: userEmail,
                  country: 'Unknown'
                }
              });
            }
          );
        }
      });
    } catch (error) {
      console.error('Google auth error:', error);
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }
  }
};

module.exports = socialAuthController;
