import 'bootstrap/dist/css/bootstrap.min.css';

import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/CompanySettings.css';


const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';



export default function CompanySettings() {
  const [formData, setFormData] = useState({
    company_code: '',
    company_name: '',
    company_address: '',
    company_logo: null,
    currency: 'GBP',
    company_phone: '',
    company_email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
    const { userData } = useContext(AuthContext);
  

    const company_code = userData?.company_code;



  // Currency options from API
  const [currencies, setCurrencies] = useState([
    { value: 'GBP', label: 'GBP (£) - British Pound Sterling' }
  ]);

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        // Use openexchangerates.org/api/currencies.json (no access key required for currency list)
        const res = await fetch(`${BASE_URL}/api/admin/currencies/get-all-currency-symbols`);
        if (!res.ok) throw new Error('Currency API error');
        const data = await res.json();
        if (data && data.currencies) {
          setCurrencies(data.currencies);
        } else {
          throw new Error('Currency API returned no symbols');
        }
      } catch (err) {
        // fallback to default
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

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BASE_URL}/api/admin/companies-by-code/${company_code}`);
        if (!res.ok) throw new Error('Failed to fetch company');
        const data = await res.json();
        const company = data.company || {};
        setFormData({
          company_code: company.company_code || '',
          company_name: company.company_name || '',
          company_address: company.company_address || '',
          company_logo: null,
          currency: company.currency || 'GBP',
          company_phone: company.company_phone || '',
          company_email: company.company_email || ''
        });
        if (company.company_logo) {
          setCurrentLogo(company.company_logo);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchCompany();
  }, [company_code]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = selected => {
    setFormData(prev => ({ ...prev, currency: selected.value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, company_logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const companyFormData = new FormData();
      companyFormData.append('company_name', formData.company_name);
      companyFormData.append('company_address', formData.company_address);
      companyFormData.append('currency', formData.currency);
      companyFormData.append('company_phone', formData.company_phone);
      companyFormData.append('company_email', formData.company_email);
      if (formData.company_logo) {
        companyFormData.append('company_logo', formData.company_logo);
      }
      const res = await fetch(`${BASE_URL}/api/admin/companies-by-code/${company_code}`, {
        method: 'PUT',
        body: companyFormData
      });
      if (!res.ok) throw new Error('Update failed');
      setSuccess('Company updated successfully!');
      setLogoPreview(null);
      // Optionally refetch company data
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <Container>
        <Card className="register-card">
          <Card.Body>
            <h2 className="register-title text-center mb-4">Company Settings</h2>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="secondary" />
              </div>
            ) : (
              <Form className="register-form" onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Code</Form.Label>
                      <Form.Control name="company_code" value={formData.company_code} disabled className="bg-light" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Currency</Form.Label>
                      <Select
                        name="currency"
                        value={currencies.find(c => c.value === formData.currency)}
                        onChange={handleCurrencyChange}
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
                  <Col md={3}>
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
                  <Col md={3}>
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
                      <Form.Label>Company Logo <small className="text-muted">(Leave empty to keep current logo)</small></Form.Label>
                      <Form.Control
                        type="file"
                        name="company_logo"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      <Form.Text className="text-muted">
                        Please upload a company logo (PNG, JPG, JPEG)
                      </Form.Text>
                      {/* Show current logo */}
                      {currentLogo && !logoPreview && (
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
                          <p className="small text-muted">New Logo Preview:</p>
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
                  <Button type="submit" className="register-btn" style={{ background: '#667eea', color: '#fff', fontWeight: 600, border: 'none' }} disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Updating Company...
                      </>
                    ) : (
                      'Update Company'
                    )}
                  </Button>
                </div>
                {error && <Alert variant="danger" className="mt-3 text-center">{error}</Alert>}
                {success && <Alert variant="success" className="mt-3 text-center">{success}</Alert>}
              </Form>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
