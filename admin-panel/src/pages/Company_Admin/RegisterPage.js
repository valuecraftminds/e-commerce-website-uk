import React, { useContext, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/RegisterPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
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
  const { userData } = useContext(AuthContext);


  const navigate = useNavigate();

  const company_code = userData?.company_code;


  // prevent entering numbers or symbols to name field
  const handleNameChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z\s]/g, '');
    setFormData((prev) => ({ ...prev, name: value }));
  };

  // prevent entering letters and symbols and limit to 10 digits starting with 07
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    value = value.slice(0, 15); // Limit to 15 digits
    
    setFormData((prev) => ({ ...prev, phone: value }));
  
    // Validation rules
    if (!value) {
      setPhoneError('Phone number is required');
    } else if (value.length < 8) {
      setPhoneError('Phone number must be at least 8 digits');
    } else if (value.length > 15) {
      setPhoneError('Phone number must be 15 digits or less');
    } else if (/^0/.test(value)) {
      setPhoneError('Please use country code without 0 (e.g., 254 instead of 07)');
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

    console.log("Form Data:", formData.role);

    try {
      const response = await fetch(`${BASE_URL}/admin/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code: company_code,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('User registered successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          password: '',
          confirmPassword: ''
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
      <Container>
        <Card className="register-card">

          <Button 
            variant="primary" 
            className=" btn-custom-primary" 
            onClick={() => navigate('/dashboard/users')}
          >
            ← Back
          </Button>

          <Card.Body>
            <h2 className="register-title">Add New Admin</h2>
            
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

            <Form className="register-form" onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="name">Full Name</Form.Label>
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
                    <Form.Label htmlFor="email">Email Address</Form.Label>
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
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="phone">Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      isInvalid={!!phoneError}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="15"  // Changed from 10 to 15
                      placeholder="Enter phone number with country code"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {phoneError}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="role">Role</Form.Label>
                    <Form.Select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="pdc">PDC</option>
                      <option value="warehouse_grn">Warehouse GRN</option>
                      <option value="warehouse_issuing">Warehouse Issuing</option>
                      <option value="order">Ordering</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                
                <Form.Group className="mb-3">
                <Form.Label htmlFor="password">Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    onFocus={() => setShowRules(true)}
                    onBlur={() => setShowRules(false)}
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
                  <div className='password-rules'>
                    <small>Password requirements:</small>
                    <ul className='list-unstyled ms-2'>
                      <li style={{ color: passwordRules.length ? '#28a745' : '#dc3545' }}>
                        {passwordRules.length ? '✅' : '❌'} 8-12 characters
                      </li>
                      <li style={{ color: passwordRules.uppercase ? '#28a745' : '#dc3545' }}>
                        {passwordRules.uppercase ? '✅' : '❌'} At least one uppercase letter 
                      </li>
                      <li style={{ color: passwordRules.lowercase ? '#28a745' : '#dc3545' }}>
                        {passwordRules.lowercase ? '✅' : '❌'} At least one lowercase letter
                      </li>
                      <li style={{ color: passwordRules.number ? '#28a745' : '#dc3545' }}>
                        {passwordRules.number ? '✅' : '❌'} At least one number  
                      </li>
                      <li style={{ color: passwordRules.specialChar ? '#28a745' : '#dc3545' }}>
                        {passwordRules.specialChar ? '✅' : '❌'} At least one special character 
                      </li>
                    </ul>
                  </div>
                )}
              </Form.Group>

              
                </Col>
                <Col>
                <Form.Group className="mb-3">
                <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
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

              

              <div className="text-center">
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
                    'Register Admin'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}