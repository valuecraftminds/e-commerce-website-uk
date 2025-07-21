import React, { useState } from 'react';
import Header from '../../components/Header';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function RegisterCompanyAdmins() {
  return (
    <div className="dashboard-container">
      <Header role="VCM_Admin" data-testid="header-toggle-button" />
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<RegisterCompanyAdminsHome />} />
        </Routes>
      </main>
    </div>
  );
}

function RegisterCompanyAdminsHome() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Company_Admin',
    password: ''
  });

  const [phoneError, setPhoneError] = useState('');
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });
  const [showRules, setShowRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleNameChange = (e) => {
    let value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData((prev) => ({ ...prev, name: value }));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: value }));

    if (value && !value.startsWith('07')) {
      setPhoneError('Phone number must start with 07');
    } else if (value.length > 0 && value.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits');
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
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await fetch(`${BASE_URL}/api/company-admin-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('User registered successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          password: ''
        });
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
            className="btn-custom-primary mb-3" 
            onClick={() => navigate('/vcm-admin-dashboard/view-company-admins')}
          >
            ← Back
          </Button>

          <Card.Body>
            <h2 className="register-title">Add Company Admin</h2>

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
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
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
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
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
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      isInvalid={!!phoneError}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="10"
                      placeholder="07xxxxxxxx"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {phoneError}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  onFocus={() => setShowRules(true)}
                  onBlur={() => setShowRules(false)}
                  required
                />
                {showRules && (
                  <div className="password-rules mt-2">
                    <small>Password requirements:</small>
                    <ul className="list-unstyled ms-2">
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
