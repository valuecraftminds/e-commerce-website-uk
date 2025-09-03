import React, { useContext, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { FaFacebookF, FaGoogle, FaTwitter, FaTimesCircle, FaSignInAlt, FaShieldAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import SocialLogin from '../components/SocialLogin';
import '../styles/LoginPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  
  // Get the page the user was trying to access before login
  // Only redirect to 'from' if user was redirected here from a protected route
  const from = location.state?.from?.pathname;
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLoginSuccess = (token, user, provider) => {
    login(token, user);
    console.log(`${provider} login successful:`, user);
    console.log('token:', token);
    
    // Redirect logic same as regular login
    if (from && location.state?.from) {
      const fullPath = from + (location.state.from.search || '');
      navigate(fullPath, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSocialLoginError = (errorMessage) => {
    setErrorMsg(errorMessage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${BASE_URL}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code: COMPANY_CODE,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.token, data.user);
        // Only redirect to 'from' location if user was redirected here from a protected route
        // Otherwise, go to home page for normal logins
        if (from && location.state?.from) {
          const fullPath = from + (location.state.from.search || '');
          navigate(fullPath, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
        console.log('Login successful:', data);
        console.log('token:', data.token);
        
      } else {
        setErrorMsg(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrorMsg('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Container fluid="xl">
        <Card className="login-card">
          <Card.Body className="p-3 p-md-5">
            <div className="text-center mb-4">
              <div className="login-icon mb-3">
                <FaSignInAlt size={48} className="text-primary" />
              </div>
              <h2 className="login-title">Welcome!</h2>
              <p className="login-subtitle">Sign in to your account to continue shopping</p>
            </div>

            {errorMsg && (
              <Alert variant="danger" className="modern-alert">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FaTimesCircle className="me-2" />
                  <strong>Login Failed</strong>
                </div>
                {errorMsg}
                {errorMsg.toLowerCase().includes('invalid') && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Having trouble? Try{' '}
                      <span className="link-text">resetting your password</span>
                    </small>
                  </div>
                )}
              </Alert>
            )}

            <Row className="g-4">
              <Col lg={7} md={12} >
                <div className="form-section">
                  <h5 className="form-section-title mb-4">Account Login</h5>
                  <Form className="login-form" onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className="modern-input"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" style={{ position: "relative" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="form-label mb-0">Password</Form.Label>
                        <small>
                          <span className="link-text">Forgot password?</span>
                        </small>
                      </div>
                      <div className="password-input-wrapper">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className="modern-input password-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-btn"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </Form.Group>
                    
                    <div className="form-actions text-center">
                      <Button 
                        type="submit" 
                        className="login-btn"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Signing you in...
                          </>
                        ) : (
                          <>
                            <FaSignInAlt className="me-2" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </Col>

              <Col lg={5} md={12}>
                <div className="side-section">
                  <div className="welcome-content text-center">
                    <div className="welcome-icon">
                      <div className="icon-circle">
                        <FaShieldAlt size={24} className="text-primary" />
                      </div>
                    </div>
                    <h4 className="welcome-title">Secure Login</h4>
                    <p className="welcome-text">
                      Access your account safely with our encrypted login system
                    </p>
                    
                    <div className="social-login">
                      <SocialLogin 
                        onSocialLoginSuccess={handleSocialLoginSuccess}
                        onSocialLoginError={handleSocialLoginError}
                      />
                    </div>
                    
                      <h5 className="divider-text">New to our platform?</h5>
                    
                    <Button 
                      variant="outline-secondary" 
                      className="signup-btn"
                      onClick={() => navigate('/register')}
                    >
                      Create New Account
                    </Button>
                   
                    
                  
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}