import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Select from 'react-select';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function RegisterCompanyAdmins() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isUpdateMode = Boolean(id);
  const companyCodeFromParams = searchParams.get('company_code');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Company_Admin',
    password: '',
    company_code: companyCodeFromParams || ''
  });

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Fetch companies list
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/companies`);
        const data = await response.json();
        if (data.success) {
          setCompanies(data.companies);
          
          // If company_code is provided in params, auto-select that company
          if (companyCodeFromParams) {
            const matchedCompany = data.companies.find(c => c.company_code === companyCodeFromParams);
            if (matchedCompany) {
              setSelectedCompany(matchedCompany);
              setFormData(prev => ({ ...prev, company_code: companyCodeFromParams }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    
    fetchCompanies();
  }, [companyCodeFromParams]);


  // Fetch admin data for update mode
  const fetchAdminData = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMsg('');
    try {
      console.log('Fetching admin data for ID:', id);
      const url = `${BASE_URL}/api/admin/auth/get-admin/${id}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Full API Response:', JSON.stringify(data, null, 2)); // Detailed debug log

      if (response.ok && data.success) {
        const admin = data.admin;
        console.log('Admin data received:', JSON.stringify(admin, null, 2)); // Detailed debug log
        console.log('All admin object keys:', Object.keys(admin)); // Show all available keys
        
        // Use the exact database column names based on backend code
        setFormData({
          name: admin.name || '',
          email: admin.email || '',
          phone: admin.phone_number || '',
          role: admin.role || 'Company_Admin',
          password: '', // Keep empty for security
          company_code: admin.company_code || ''
        });

        console.log('Form data set to:', {
          name: admin.name || '',
          email: admin.email || '',
          phone: admin.phone_number || '',
          company_code: admin.company_code || ''
        }); // Debug log
        
        // Find and set the selected company
        if (admin.company_code) {
          const matchedCompany = companies.find(c => c.company_code === admin.company_code);
          if (matchedCompany) {
            setSelectedCompany(matchedCompany);
          }
        }
      } else {
        console.error('API Error Response:', data);
        setErrorMsg(data.message || 'Failed to fetch admin data');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setErrorMsg('Error fetching admin data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [id, companies]);

  useEffect(() => {
    if (isUpdateMode && id) {
      console.log('Update mode detected, ID:', id);
      fetchAdminData();
    } else {
      console.log('Create mode or no ID provided');
    }
  }, [id, isUpdateMode, fetchAdminData]);

  const handleNameChange = (e) => {
    let value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData((prev) => ({ ...prev, name: value }));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 15);
    
    setFormData((prev) => ({ ...prev, phone: value }));
  
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
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanySelect = (selectedOption) => {
    const company = companies.find(c => c.company_code === selectedOption.value);
    setSelectedCompany(company);
    setFormData((prev) => ({ ...prev, company_code: selectedOption.value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
  
    // Validate phone number before submitting
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      setErrorMsg('Phone number must be 8-15 digits (include country code)');
      setIsLoading(false);
      return;
    }

    // Password validation for update mode (only if password is provided)
    if (isUpdateMode && formData.password) {
      const allRulesPassed = Object.values(passwordRules).every(rule => rule);
      if (!allRulesPassed) {
        setErrorMsg('Please ensure password meets all requirements');
        setIsLoading(false);
        return;
      }
    }

    // Password validation for create mode
    if (!isUpdateMode) {
      const allRulesPassed = Object.values(passwordRules).every(rule => rule);
      if (!allRulesPassed) {
        setErrorMsg('Please ensure password meets all requirements');
        setIsLoading(false);
        return;
      }
    }
  
    try {
      if (isUpdateMode) {
        // Update existing admin
        await updateCompanyAdmin();
      } else {
        // Create new admin for existing company
        await createCompanyAdmin();
      }
    } catch (error) {
      console.error(`${isUpdateMode ? 'Update' : 'Registration'} error:`, error);
      setErrorMsg(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createCompanyAdmin = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    
    if (!formData.company_code) {
      throw new Error('Please select a company');
    }

    const adminFormData = new FormData();
    adminFormData.append('name', formData.name);
    adminFormData.append('email', formData.email);
    adminFormData.append('phone', cleanPhone);
    adminFormData.append('role', formData.role);
    adminFormData.append('password', formData.password);
    adminFormData.append('company_code', formData.company_code);

    console.log('Creating admin user...', {
      name: formData.name,
      email: formData.email,
      phone: cleanPhone,
      role: formData.role,
      company_code: formData.company_code
    });

    const response = await fetch(`${BASE_URL}/api/admin/auth/create-company-admin`, {
      method: 'POST',
      body: adminFormData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create admin user');
    }

    setSuccessMsg(`Admin account created successfully for company "${selectedCompany?.company_name}"!`);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Company_Admin',
      password: '',
      company_code: companyCodeFromParams || ''
    });
  };

  const updateCompanyAdmin = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    
    const requestBody = {
      name: formData.name,
      email: formData.email,
      phone_number: cleanPhone, // Match backend expectation
      role: formData.role
    };
    
    // Only include password if provided
    if (formData.password) {
      requestBody.password = formData.password;
    }

    const response = await fetch(`${BASE_URL}/api/admin/auth/update-admin/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Update failed');
    }

    setSuccessMsg('Company admin updated successfully!');
    
    // Redirect after a delay
    setTimeout(() => {
      if (formData.company_code) {
        navigate(`/vcm-admin/view-company-admins/${formData.company_code}`);
      } else {
        navigate('/vcm-admin/view-companies');
      }
    }, 2000);
  };

  if (isLoadingData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="register-container">
      <Container>
        <Card className="register-card">
          <Button 
            variant="primary" 
            className="btn-custom-primary mb-3" 
            onClick={() => {
              if (companyCodeFromParams) {
                navigate(`/vcm-admin/view-company-admins/${companyCodeFromParams}`);
              } else {
                navigate('/vcm-admin/view-companies');
              }
            }}
          >
            ← Back to {companyCodeFromParams ? 'Company Admins' : 'Companies'}
          </Button>

          <Card.Body>
            <h2 className="register-title">
              {isUpdateMode ? 'Update Company Admin' : 'Add Company Admin'}
            </h2>

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
              {!isUpdateMode && (
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Company</Form.Label>
                      <Select
                        name="company_code"
                        value={companies.find(c => c.company_code === formData.company_code) ? 
                          { value: formData.company_code, label: `${formData.company_code} - ${selectedCompany?.company_name}` } : null}
                        onChange={handleCompanySelect}
                        options={companies.map(company => ({
                          value: company.company_code,
                          label: `${company.company_code} - ${company.company_name}`
                        }))}
                        isSearchable={true}
                        placeholder="Select a company"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        required
                        isDisabled={!!companyCodeFromParams}
                      />
                      {companyCodeFromParams && (
                        <Form.Text className="text-muted">
                          Company pre-selected from navigation
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {selectedCompany && (
                <Row>
                  <Col md={12}>
                    <Card className="mb-3 bg-light">
                      <Card.Body>
                        <h6>Company Details:</h6>
                        <div className="d-flex align-items-center">
                          {selectedCompany.company_logo && (
                            <img 
                              src={`${BASE_URL}/uploads/company_logos/${selectedCompany.company_logo}`} 
                              alt="Company Logo" 
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'contain',
                                marginRight: '15px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                backgroundColor: '#fff',
                                padding: '5px'
                              }}
                            />
                          )}
                          <div>
                            <strong>{selectedCompany.company_name}</strong><br/>
                            <small className="text-muted">Code: {selectedCompany.company_code}</small><br/>
                            <small className="text-muted">Currency: {selectedCompany.currency}</small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

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
                      maxLength="15"
                      placeholder="Enter phone number with country code"
                      required
                    />
                    {phoneError && (
                      <Form.Control.Feedback type="invalid">
                        {phoneError}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Password 
                      {isUpdateMode && <small className="text-muted"> (Leave empty to keep current)</small>}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"  
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isUpdateMode ? "Enter new password (optional)" : "Enter password"}
                      onFocus={() => setShowRules(true)}
                      onBlur={() => setShowRules(false)}
                      required={!isUpdateMode}
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
                      {isUpdateMode ? 'Updating...' : 'Registering...'}
                    </>
                  ) : (
                    isUpdateMode ? 'Update Admin' : 'Register Admin'
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
