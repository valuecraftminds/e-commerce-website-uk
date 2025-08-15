import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';


const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function RegisterCompany() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_logo: null,
    currency: 'GBP',
    company_phone: '',
    company_email: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);

  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    console.log('Auth token from localStorage:', token ? 'Token exists' : 'No token found');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };


  // Currency options from backend API
  const [currencies, setCurrencies] = useState([
    { value: 'GBP', label: 'GBP (£) - British Pound Sterling' }
  ]);

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/currencies/get-all-currency-symbols`);
        if (!res.ok) throw new Error('Currency API error');
        const data = await res.json();
        if (data && data.currencies) {
          setCurrencies(data.currencies);
        } else {
          throw new Error('Currency API returned no symbols');
        }
      } catch (err) {
        setCurrencies([
          { value: 'GBP', label: 'GBP (£) - British Pound Sterling' },
          { value: 'USD', label: 'USD ($) - US Dollar' },
          { value: 'EUR', label: 'EUR (€) - Euro' },
          { value: 'AED', label: 'AED (د.إ) - UAE Dirham' }
        ]);
      }
    }
    fetchCurrencies();
  }, []);


  const fetchCompanyData = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${BASE_URL}/api/admin/companies/${id}`, {
        headers: getAuthHeaders()
      });
      
      // Check if response is HTML (error page) before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response received:', errorText);
        setErrorMsg(`Server returned non-JSON response. Status: ${response.status}`);
        return;
      }
      
      const data = await response.json();

      if (response.ok && data.success) {
        const company = data.company;
        setFormData({
          company_name: company.company_name || '',
          company_address: company.company_address || '',
          company_logo: null, // Reset file input
          currency: company.currency || 'GBP',
          company_phone: company.company_phone || '',
          company_email: company.company_email || ''
        });
        
        if (company.company_logo) {
          setCurrentLogo(company.company_logo);
        }
      } else {
        setErrorMsg(data.message || 'Failed to fetch company data');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setErrorMsg('Error fetching company data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode && id) {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setErrorMsg('Authentication required. Please log in.');
        setIsLoadingData(false);
        return;
      }
      fetchCompanyData();
    }
  }, [id, isEditMode, fetchCompanyData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, company_logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setErrorMsg('Authentication required. Please log in.');
        setIsLoading(false);
        return;
      }

      const companyFormData = new FormData();
      companyFormData.append('company_name', formData.company_name);
      companyFormData.append('company_address', formData.company_address);
      companyFormData.append('currency', formData.currency);
      companyFormData.append('company_phone', formData.company_phone);
      companyFormData.append('company_email', formData.company_email);
      
      if (formData.company_logo) {
        companyFormData.append('company_logo', formData.company_logo);
      }

      // Get auth headers
      const authHeaders = getAuthHeaders();
      
      let response;
      if (isEditMode) {
        // Update existing company using CompanyController
        response = await fetch(`${BASE_URL}/api/admin/companies/${id}`, {
          method: 'PUT',
          headers: {
            ...authHeaders
            // Note: Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: companyFormData,
        });
      } else {
        // Create new company using CompanyController
        response = await fetch(`${BASE_URL}/api/admin/companies`, {
          method: 'POST',
          headers: {
            ...authHeaders
            // Note: Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: companyFormData,
        });
      }

      // Check if response is HTML (error page) before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response received:', errorText);
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} company`);
      }

      if (isEditMode) {
        setSuccessMsg(`Company "${formData.company_name}" updated successfully!`);
      } else {
        setSuccessMsg(`Company "${formData.company_name}" created successfully! Company Code: ${data.company_code}`);
        
        // Reset form for create mode
        setFormData({
          company_name: '',
          company_address: '',
          company_logo: null,
          currency: 'GBP',
          company_phone: '',
          company_email: ''
        });
        setLogoPreview(null);
        setCurrentLogo(null);
      }

      // Redirect after success
      setTimeout(() => {
        navigate('/vcm-admin/view-companies');
      }, 2000);

    } catch (error) {
      console.error(`Company ${isEditMode ? 'update' : 'creation'} error:`, error);
      setErrorMsg(error.message || 'Something went wrong. Please try again.');
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
            onClick={() => navigate('/vcm-admin/view-companies')}
          >
            ← Back to Companies
          </Button>

          <Card.Body>
            <h2 className="register-title">
              {isEditMode ? 'Edit Company' : 'Add New Company'}
            </h2>

            {isLoadingData ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading company data...</span>
                </Spinner>
                <p className="mt-2 text-muted">Loading company data...</p>
              </div>
            ) : (
              <>
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
                        <Form.Label>Company Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Phone</Form.Label>
                        <Form.Control
                          type="text"
                          name="company_phone"
                          value={formData.company_phone}
                          onChange={handleChange}
                          placeholder="Enter company phone"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="company_email"
                          value={formData.company_email}
                          onChange={handleChange}
                          placeholder="Enter company email"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency</Form.Label>
                        <Select
                          name="currency"
                          value={currencies.find(c => c.value === formData.currency)}
                          onChange={(selected) => handleChange({ target: { name: 'currency', value: selected.value } })}
                          options={currencies}
                          isSearchable={true}
                          placeholder="Select Currency"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="company_address"
                          value={formData.company_address}
                          onChange={handleChange}
                          placeholder="Enter company address"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Company Logo
                          {isEditMode && <small className="text-muted"> (Leave empty to keep current logo)</small>}
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="company_logo"
                          onChange={handleFileChange}
                          accept="image/*"
                          required={!isEditMode}
                        />
                        <Form.Text className="text-muted">
                          Please upload a company logo (PNG, JPG, JPEG)
                        </Form.Text>
                        
                        {/* Show current logo in edit mode */}
                        {isEditMode && currentLogo && !logoPreview && (
                          <div className="mt-2 text-center">
                            <p className="small text-muted">Current Logo:</p>
                            <img 
                              src={`${BASE_URL}/uploads/company_logos/${currentLogo}`} 
                              alt="Current Company Logo" 
                              style={{
                                maxWidth: '200px',
                                maxHeight: '100px',
                                objectFit: 'contain',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                padding: '5px'
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Show new logo preview */}
                        {logoPreview && (
                          <div className="mt-2 text-center">
                            <p className="small text-muted">
                              {isEditMode ? 'New Logo Preview:' : 'Logo Preview:'}
                            </p>
                            <img 
                              src={logoPreview} 
                              alt="Company Logo Preview" 
                              style={{
                                maxWidth: '200px',
                                maxHeight: '100px',
                                objectFit: 'contain',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                padding: '5px'
                              }}
                            />
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
                          {isEditMode ? 'Updating Company...' : 'Creating Company...'}
                        </>
                      ) : (
                        isEditMode ? 'Update Company' : 'Create Company'
                      )}
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
