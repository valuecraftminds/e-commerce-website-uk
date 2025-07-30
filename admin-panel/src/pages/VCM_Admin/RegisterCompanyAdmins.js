import React, { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function RegisterCompanyAdmins() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Company_Admin',
    password: '',
    company_name: '',
    company_address: '',
    company_logo: null,
    currency: 'GBP'
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
  const [logoPreview, setLogoPreview] = useState(null);

  const currencies = [
    { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
    { code: 'ALL', symbol: 'L', name: 'Albanian Lek' },
    { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
    { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
    { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark' },
    { code: 'BBD', symbol: '$', name: 'Barbadian Dollar' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
    { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
    { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
    { code: 'BMD', symbol: '$', name: 'Bermudan Dollar' },
    { code: 'BND', symbol: '$', name: 'Brunei Dollar' },
    { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'BSD', symbol: '$', name: 'Bahamian Dollar' },
    { code: 'BWP', symbol: 'P', name: 'Botswanan Pula' },
    { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
    { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
    { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
    { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
    { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
    { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
    { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
    { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
    { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
    { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
    { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
    { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
    { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
    { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
    { code: 'LAK', symbol: '₭', name: 'Laotian Kip' },
    { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound' },
    { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
    { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
    { code: 'MDL', symbol: 'L', name: 'Moldovan Leu' },
    { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
    { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
    { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
    { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik' },
    { code: 'MOP', symbol: 'MOP$', name: 'Macanese Pataca' },
    { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
    { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
    { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'NAD', symbol: '$', name: 'Namibian Dollar' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
    { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
    { code: 'PEN', symbol: 'S/.', name: 'Peruvian Nuevo Sol' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
    { code: 'PYG', symbol: '₲', name: 'Paraguayan Guarani' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Rial' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
    { code: 'RSD', symbol: 'din.', name: 'Serbian Dinar' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
    { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
    { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
    { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
    { code: 'UZS', symbol: 'so\'m', name: 'Uzbekistani Som' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
    { code: 'YER', symbol: '﷼', name: 'Yemeni Rial' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' }
  ].map(currency => ({
    value: currency.code,
    label: `${currency.code} (${currency.symbol}) - ${currency.name}`
  }));

  const navigate = useNavigate();

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
  
    // Validate phone number before submitting
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      setErrorMsg('Phone number must be 8-15 digits (include country code)');
      setIsLoading(false);
      return;
    }
  
    try {
      // Create FormData
      const formDataToSend = new FormData();
      
      // Add all fields - ensure phone has only digits
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', cleanPhone);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('company_name', formData.company_name);
      formDataToSend.append('company_address', formData.company_address);
      formDataToSend.append('currency', formData.currency);
      
      if (formData.company_logo) {
        formDataToSend.append('company_logo', formData.company_logo);
      }
  
      const response = await fetch(`${BASE_URL}/api/admin/auth/company-admin-register`, {
        method: 'POST',
        body: formDataToSend,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
  
      if (data.success) {
        setSuccessMsg('Company admin registered successfully!');
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'Company_Admin',
          password: '',
          company_name: '',
          company_address: '',
          company_logo: null,
          currency: 'GBP'
        });
        setLogoPreview(null);
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
            onClick={() => navigate('/vcm-admin/view-company-admins')}
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
                    <Form.Label>Company Logo</Form.Label>
                    <Form.Control
                      type="file"
                      name="company_logo"
                      onChange={handleFileChange}
                      accept="image/*"
                      required
                    />
                    <Form.Text className="text-muted">
                      Please upload a company logo (PNG, JPG, JPEG)
                    </Form.Text>
                    {logoPreview && (
                      <div className="mt-2 text-center">
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
