import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { FaGoogle, FaCheckCircle, FaTimesCircle, FaUserPlus } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import SocialLogin from '../components/SocialLogin';
import { useNotifyModal } from "../context/NotifyModalProvider";
import '../styles/RegisterPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    confirmPassword: ''
  });

  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });
  const [showRules, setShowRules] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const passwordRulesRef = useRef(null);
  const { showNotify } = useNotifyModal();

  useEffect(() => {
    function handleClickOutside(event) {
      if (passwordRulesRef.current && !passwordRulesRef.current.contains(event.target)) {
        // Check if the click is not on the password input
        if (!event.target.matches('#password')) {
          setShowRules(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // prevent entering numbers or symbols to name field
  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/[^a-zA-Z\s]/g, ''); // Allow only letters and spaces
    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
  };

  // prevent entering letters and symbols and limit to 10 digits starting with 07
  const handlePhoneChange = (value, country) => {
    setFormData(prev => ({
      ...prev,
      phone: value,
      country: country.name // This will capture the full country name
    }));

    if (value.length === 0) {
      setPhoneError('Phone number is required');
    } else {
      setPhoneError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'password') {
      const rules = {
        length: value.length >= 8 && value.length <= 12,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        specialChar: /[\W_]/.test(value)
      };
      setPasswordRules(rules);
      
      // Check if passwords match when password changes
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }

    if (name === 'confirmPassword') {
      // Check if passwords match when confirm password changes
      if (value !== formData.password) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLoginSuccess = (token, user, provider) => {
    // For social login, authenticate the user and redirect to home since account is created automatically
    login(token, user);
    console.log('token:', token);

    showNotify({
      title: "Registration Successful",
      message: `Welcome! Your account has been created successfully via ${provider}.`,
      type: "success"
    });
    
    // Redirect to home page after a short delay
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 1500);
  };

  const handleSocialLoginError = (errorMessage) => {
    setErrorMsg(errorMessage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if passwords match before submitting
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/customer/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code: COMPANY_CODE,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          country: formData.country,
          frontend_url: window.location.origin // Add frontend URL for verification link
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('Registration successful! Please check your email to verify your account.');
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          country: ''
        });
        setPasswordError('');
        // Don't redirect immediately - let user verify email first
        // navigate('/login');
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      setErrorMsg('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Container fluid="xl">
        <Card className="register-card">
          <Card.Body className="p-3 p-md-5">
            <div className="text-center mb-4">
              <div className="register-icon mb-3">
                <FaUserPlus size={48} className="text-primary" />
              </div>
              <h2 className="register-title">Join Our Community</h2>
              <p className="register-subtitle">Create your account and discover amazing products</p>
            </div>

            {successMsg && (
              <Alert variant="success" className="modern-alert">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FaCheckCircle className="me-2" />
                  <strong>Success!</strong>
                </div>
                <p className="mb-2">{successMsg}</p>
                <small className="text-muted">
                  Didn't receive the email? Check your spam folder or{' '}
                  <span 
                    className="text-primary fw-bold" 
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                  >
                    try again
                  </span>
                </small>
              </Alert>
            )}
            {errorMsg && (
              <Alert variant="danger" className="modern-alert">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FaTimesCircle className="me-2" />
                  <strong>Oops!</strong>
                </div>
                {errorMsg}
              </Alert>
            )}

            <Row className="g-4">
              <Col lg={7} md={12}>
                <div className="form-section">
                  <h5 className="form-section-title mb-4">Personal Information</h5>
                  <Form className="register-form" onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label">First Name *</Form.Label>
                          <Form.Control
                            id="first_name"
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleNameChange}
                            placeholder="Enter your first name"
                            className="modern-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label">Last Name *</Form.Label>
                          <Form.Control
                            id="last_name"
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleNameChange}
                            placeholder="Enter your last name"
                            className="modern-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="form-label">Email Address *</Form.Label>
                          <Form.Control
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            className="modern-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3 phone-input-group">
                          <Form.Label className="form-label">Phone Number *</Form.Label>
                          <PhoneInput
                            country={'gb'}
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            inputProps={{
                              name: 'phone',
                              required: true,
                              className: phoneError ? 'form-control modern-input is-invalid' : 'form-control modern-input'
                            }}
                            enableSearch={true}
                            countryCodeEditable={false} 
                          />
                          {phoneError && (
                            <div className="invalid-feedback d-block">{phoneError}</div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    
                    <div className="password-section mb-4">
                      <h6 className="section-subtitle">Security</h6>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">Password *</Form.Label>
                            <div className="password-input-wrapper">
                              <Form.Control
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                className="modern-input password-input"
                                onFocus={() => setShowRules(true)}
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
                            {showRules && (
                              <div className='password-rules' ref={passwordRulesRef}>
                                <small className="rules-title">Password requirements:</small>
                                <ul className='requirements-list'>
                                  <li className={passwordRules.length ? 'valid' : 'invalid'}>
                                    {passwordRules.length ? '✓' : '✗'} 8-12 characters long
                                  </li>
                                  <li className={passwordRules.uppercase ? 'valid' : 'invalid'}>
                                    {passwordRules.uppercase ? '✓' : '✗'} One uppercase letter (A-Z)
                                  </li>
                                  <li className={passwordRules.lowercase ? 'valid' : 'invalid'}>
                                    {passwordRules.lowercase ? '✓' : '✗'} One lowercase letter (a-z)
                                  </li>
                                  <li className={passwordRules.number ? 'valid' : 'invalid'}>
                                    {passwordRules.number ? '✓' : '✗'} One number (0-9)
                                  </li>
                                  <li className={passwordRules.specialChar ? 'valid' : 'invalid'}>
                                    {passwordRules.specialChar ? '✓' : '✗'} One special character (!@#$...)
                                  </li>
                                </ul>
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">Confirm Password *</Form.Label>
                            <div className="password-input-wrapper">
                              <Form.Control
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                className="modern-input password-input"
                                isInvalid={!!passwordError}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="password-toggle-btn"
                                title={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                            {passwordError && (
                              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                {passwordError}
                              </Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div className="form-actions text-center">
                      <Button 
                        type="submit" 
                        className="register-btn"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Creating Your Account...
                          </>
                        ) : (
                          <>
                            <FaUserPlus className="me-2" />
                            Create My Account
                          </>
                        )}
                      </Button>
                      
                      <div className="terms-text mt-3">
                        <small className="text-muted">
                          By creating an account, you agree to our{' '}
                          <span className="link-text">Terms of Service</span>{' '}
                          and{' '}
                          <span className="link-text">Privacy Policy</span>
                        </small>
                      </div>
                    </div>
                  </Form>
                </div>
              </Col>

              <Col lg={5} md={12}>
                <div className="side-section">
                  <div className="welcome-content text-center">
                    <div className="welcome-icon mb-4">
                      <div className="icon-circle">
                        <FaGoogle size={24} className="text-primary" />
                      </div>
                    </div>
                    <h4 className="welcome-title">Quick & Easy Registration</h4>
                    <p className="welcome-text">
                      Join thousands of satisfied customers and start your shopping journey today
                    </p>
                    
                    <div className="social-register">
                      <SocialLogin 
                        onSocialLoginSuccess={handleSocialLoginSuccess}
                        onSocialLoginError={handleSocialLoginError}
                        isRegister={true}
                      />
                    </div>
                    
                      <h5 className="divider-text">Already a member?</h5>
                    
                    <Button 
                      variant="outline-secondary" 
                      className="signin-btn"
                      onClick={() => navigate('/login')}
                    >
                      Sign In to Your Account
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