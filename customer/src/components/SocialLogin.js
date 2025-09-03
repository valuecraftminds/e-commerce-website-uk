import React, { useEffect } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaGoogle } from 'react-icons/fa';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const SocialLogin = ({ onSocialLoginSuccess, onSocialLoginError, isRegister = false }) => {
  
  useEffect(() => {
    // Load Google Identity Services
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);
  
  const handleGoogleSuccess = async () => {
    try {
      // Check if Google Client ID is configured
      if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID === 'your-google-client-id-here') {
        onSocialLoginError('Google login is not configured. Please set up REACT_APP_GOOGLE_CLIENT_ID in your environment variables.');
        return;
      }

      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        // Use OAuth2 flow instead of One Tap to avoid FedCM warnings
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (response) => {
            if (response.access_token) {
              try {
                // Get user info using the access token
                const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
                const userData = await userResponse.json();

                // Send user data to backend
                const backendResponse = await fetch(`${BASE_URL}/api/customer/auth/google-login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    company_code: COMPANY_CODE,
                    googleId: userData.id,
                    email: userData.email,
                    given_name: userData.given_name,
                    family_name: userData.family_name,
                    picture: userData.picture,
                    access_token: response.access_token
                  }),
                });

                const data = await backendResponse.json();

                if (backendResponse.ok && data.success) {
                  onSocialLoginSuccess(data.token, data.user, 'google');
                } else {
                  onSocialLoginError(data.message || 'Google login failed');
                }
              } catch (error) {
                console.error('Google login backend error:', error);
                onSocialLoginError('Something went wrong with Google login');
              }
            } else {
              onSocialLoginError('Google login was cancelled or failed');
            }
          },
        });

        // Request access token
        client.requestAccessToken();

      } else {
        onSocialLoginError('Google OAuth not loaded. Please refresh and try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      onSocialLoginError('Something went wrong with Google login');
    }
  };

  const handleGoogleError = () => {
    onSocialLoginError('Google login was cancelled or failed');
  };

  return (
    <div className="social-login">
      <h6 className="social-title">
        {isRegister ? 'Or register with' : 'Or sign in with'}
      </h6>
      
      <div className="social-buttons d-flex justify-content-center">
        <Button 
          variant="outline-danger" 
          className="social-btn-modern google p-2" 
          style={{ borderRadius: '50%', width: '45px', height: '45px' }}
          onClick={handleGoogleSuccess}
          title="Sign in with Google"
        >
          <FaGoogle size={16} style={{ color: '#db4437' }} />
        </Button>
      </div>
    </div>
  );
};

export default SocialLogin;
