import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash, FaFacebookF, FaGoogle, FaTwitter } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom';
import '../styles/RegisterPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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

  console.log("Company Code:", COMPANY_CODE);
  
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
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z\s]/g, '');
    setFormData((prev) => ({ ...prev, name: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if passwords match before submitting
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    console.log("Form Data:", formData);

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code: COMPANY_CODE, // Updated this line
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          country: formData.country
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('User registered successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          country: ''
        });
        setPasswordError('');
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
            <h2 className="register-title">Create Account</h2>

            {successMsg && (
              <div className="mb-3 text-success text-center fw-semibold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <Alert variant="danger" className="text-center">
                {errorMsg}
              </Alert>
            )}

            <Row>
              <Col lg={8} md={12}>
                <Form className="register-form" onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Control
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleNameChange}
                          placeholder="Enter full name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Control
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <PhoneInput
                          country={'gb'}
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          inputProps={{
                            name: 'phone',
                            required: true,
                            className: phoneError ? 'form-control is-invalid' : 'form-control'
                          }}
                          containerStyle={{ width: '100%' }}
                          enableSearch={true} // Add search functionality
                          countryCodeEditable={false} // Prevent manual editing of country code
                        />
                        {phoneError && (
                          <div className="invalid-feedback d-block">{phoneError}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3 password-input-group">
                        <InputGroup>
                          <Form.Control
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            onFocus={() => setShowRules(true)}
                            required
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </InputGroup>
                        {showRules && (
                          <div className='password-rules' ref={passwordRulesRef}>
                            <small>Password requirements:</small>
                            <ul className='list-unstyled ms-2 mb-0'>
                              <li style={{ color: passwordRules.length ? '#28a745' : '#dc3545' }}>
                                {passwordRules.length ? '✅' : '❌'} 8-12 characters
                              </li>
                              <li style={{ color: passwordRules.uppercase ? '#28a745' : '#dc3545' }}>
                                {passwordRules.uppercase ? '✅' : '❌'} Uppercase letter
                              </li>
                              <li style={{ color: passwordRules.lowercase ? '#28a745' : '#dc3545' }}>
                                {passwordRules.lowercase ? '✅' : '❌'} Lowercase letter
                              </li>
                              <li style={{ color: passwordRules.number ? '#28a745' : '#dc3545' }}>
                                {passwordRules.number ? '✅' : '❌'} Number
                              </li>
                              <li style={{ color: passwordRules.specialChar ? '#28a745' : '#dc3545' }}>
                                {passwordRules.specialChar ? '✅' : '❌'} Special character
                              </li>
                            </ul>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <Form.Control
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            isInvalid={!!passwordError}
                            required
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </InputGroup>
                        {passwordError && (
                          <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                            {passwordError}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-center">
                    <Button 
                      type="submit" 
                      className="register-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Registering...
                        </>
                      ) : (
                        'Register'
                      )}
                    </Button>
                  </div>
                </Form>
              </Col>

              <Col lg={4} md={12} className="d-flex flex-column justify-content-center align-items-center mt-4 mt-lg-0">
                <div className="text-center mb-4">
                  <p className="mb-3">Or sign up with</p>
                  <div className="social-login-buttons">
                    <Button variant="link" className="social-btn google">
                      <FaGoogle />
                    </Button>
                    <Button variant="link" className="social-btn facebook">
                      <FaFacebookF />
                    </Button>
                    <Button variant="link" className="social-btn twitter">
                      <FaTwitter />
                    </Button>
                  </div>
                  <div className="mt-4 sign-in-wrapper">
                    <p className="sign-in-text mb-0">
                      Already have an account?{' '}
                      <span className="sign-in-link" onClick={() => navigate('/login')}>
                        Sign In
                      </span>
                    </p>
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