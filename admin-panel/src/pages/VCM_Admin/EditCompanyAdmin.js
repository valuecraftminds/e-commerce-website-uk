import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function EditCompanyAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Company_Admin',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/admin/api/get-admin/${id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setFormData({
            name: data.admin.name,
            email: data.admin.email,
            phone: data.admin.phone_number,
            role: data.admin.role
          });
        } else {
          setErrorMsg(data.message || 'Failed to fetch admin data');
        }
      } catch (error) {
        setErrorMsg('Error fetching admin data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [id]);

  const handleNameChange = (e) => {
    let value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData((prev) => ({ ...prev, name: value }));
  };

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

    if (name === 'newPassword') {
      const rules = {
        length: value.length >= 8 && value.length <= 12,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        specialChar: /[\W_]/.test(value)
      };
      setPasswordRules(rules);
      
      if (formData.confirmNewPassword && value !== formData.confirmNewPassword) {
        setPasswordError('New passwords do not match');
      } else {
        setPasswordError('');
      }
    }

    if (name === 'confirmNewPassword') {
      if (value !== formData.newPassword) {
        setPasswordError('New passwords do not match');
      } else {
        setPasswordError('');
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (phoneError) {
      setErrorMsg('Please fix phone number before submitting.');
      return;
    }

    if (changePassword) {
      if (!formData.currentPassword) {
        setErrorMsg('Current password is required to change password.');
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
    }

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone,
        role: formData.role
      };

      if (changePassword) {
        requestBody.currentPassword = formData.currentPassword;
        requestBody.newPassword = formData.newPassword;
      }

      const response = await fetch(`${BASE_URL}/admin/api/edit-admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('Admin updated successfully!');
        if (changePassword) {
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          }));
          setPasswordError('');
          setChangePassword(false);
        }
        setTimeout(() => navigate('/vcm-admin/view-company-admins'), 1500);
      } else {
        setErrorMsg(data.message || 'Update failed');
      }
    } catch (error) {
      setErrorMsg('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <div className="register-container">
      <Container>
        <Card className="register-card">
          <Button 
            variant="primary" 
            className="btn-custom-primary mb-3" 
            onClick={() => navigate('/vcm-admin/view-company-admins')}
          >
            ← Back
          </Button>

          <Card.Body>
            <h2 className="register-title">Edit Company Admin</h2>

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
                      maxLength="15"  // Changed from 10 to 15
                      placeholder="Enter phone number with country code"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {phoneError}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="mb-4">
                <Form.Check
                  type="checkbox"
                  id="changePassword"
                  label="Change Password"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmNewPassword: ''
                      }));
                      setPasswordError('');
                    }
                  }}
                />
              </div>

              {changePassword && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                        required={changePassword}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            onFocus={() => setShowRules(true)}
                            onBlur={() => setShowRules(false)}
                            required={changePassword}
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </InputGroup>
                        {showRules && (
                          <div className="password-rules">
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
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm New Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showConfirmNewPassword ? "text" : "password"}
                            name="confirmNewPassword"
                            value={formData.confirmNewPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            isInvalid={!!passwordError}
                            required={changePassword}
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                          >
                            {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
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
                </>
              )}

              <div className="text-center">
                <Button 
                  type="submit" 
                  className="register-btn"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
