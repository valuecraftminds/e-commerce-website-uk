import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function RegisterCompany() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_logo: null,
    currency: 'GBP'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);

  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    console.log('Auth token from localStorage:', token ? 'Token exists' : 'No token found');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin' },
    { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
    { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark' },
    { code: 'BBD', symbol: '$', name: 'Barbadian Dollar' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
    { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
    { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
    { code: 'BMD', symbol: '$', name: 'Bermudan Dollar' },
    { code: 'BND', symbol: '$', name: 'Brunei Dollar' },
    { code: 'BOB', symbol: '$b', name: 'Bolivian Boliviano' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'BSD', symbol: '$', name: 'Bahamian Dollar' },
    { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum' },
    { code: 'BWP', symbol: 'P', name: 'Botswanan Pula' },
    { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
    { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
    { code: 'CUC', symbol: '$', name: 'Cuban Convertible Peso' },
    { code: 'CUP', symbol: '₱', name: 'Cuban Peso' },
    { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Republic Koruna' },
    { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
    { code: 'DZD', symbol: 'دج', name: 'Algerian Dinar' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
    { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
    { code: 'FJD', symbol: '$', name: 'Fijian Dollar' },
    { code: 'FKP', symbol: '£', name: 'Falkland Islands Pound' },
    { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
    { code: 'GGP', symbol: '£', name: 'Guernsey Pound' },
    { code: 'GHS', symbol: '¢', name: 'Ghanaian Cedi' },
    { code: 'GIP', symbol: '£', name: 'Gibraltar Pound' },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
    { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
    { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' },
    { code: 'GYD', symbol: '$', name: 'Guyanaese Dollar' },
    { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar' },
    { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
    { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
    { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'ILS', symbol: '₪', name: 'Israeli New Sheqel' },
    { code: 'IMP', symbol: '£', name: 'Manx pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
    { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
    { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
    { code: 'JEP', symbol: '£', name: 'Jersey Pound' },
    { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
    { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'KGS', symbol: 'лв', name: 'Kyrgystani Som' },
    { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
    { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
    { code: 'KPW', symbol: '₩', name: 'North Korean Won' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
    { code: 'KYD', symbol: '$', name: 'Cayman Islands Dollar' },
    { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
    { code: 'LAK', symbol: '₭', name: 'Laotian Kip' },
    { code: 'LBP', symbol: '£', name: 'Lebanese Pound' },
    { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
    { code: 'LRD', symbol: '$', name: 'Liberian Dollar' },
    { code: 'LSL', symbol: 'M', name: 'Lesotho Loti' },
    { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar' },
    { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
    { code: 'MDL', symbol: 'lei', name: 'Moldovan Leu' },
    { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
    { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
    { code: 'MMK', symbol: 'K', name: 'Myanma Kyat' },
    { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik' },
    { code: 'MOP', symbol: 'MOP$', name: 'Macanese Pataca' },
    { code: 'MRO', symbol: 'UM', name: 'Mauritanian Ouguiya (pre-2018)' },
    { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya' },
    { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
    { code: 'MVR', symbol: '.ރ', name: 'Maldivian Rufiyaa' },
    { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
    { code: 'NAD', symbol: '$', name: 'Namibian Dollar' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
    { code: 'NZD', symbol: '$', name: 'New Zealand Dollar' },
    { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
    { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
    { code: 'PEN', symbol: 'S/.', name: 'Peruvian Nuevo Sol' },
    { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'PYG', symbol: 'Gs', name: 'Paraguayan Guarani' },
    { code: 'QAR', symbol: '﷼', name: 'Qatari Rial' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
    { code: 'RSD', symbol: 'Дин.', name: 'Serbian Dinar' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'RWF', symbol: 'R₣', name: 'Rwandan Franc' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'SBD', symbol: '$', name: 'Solomon Islands Dollar' },
    { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee' },
    { code: 'SDG', symbol: 'LS', name: 'Sudanese Pound' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
    { code: 'SHP', symbol: '£', name: 'Saint Helena Pound' },
    { code: 'SLE', symbol: 'Le', name: 'Sierra Leonean Leone' },
    { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone (pre-2022)' },
    { code: 'SOS', symbol: 'S', name: 'Somali Shilling' },
    { code: 'SRD', symbol: '$', name: 'Surinamese Dollar' },
    { code: 'STD', symbol: 'Db', name: 'São Tomé and Príncipe Dobra (pre-2018)' },
    { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
    { code: 'SVC', symbol: '$', name: 'Salvadoran Colón' },
    { code: 'SYP', symbol: '£', name: 'Syrian Pound' },
    { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni' },
    { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat' },
    { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
    { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
    { code: 'TVD', symbol: '$', name: 'Tuvaluan Dollar' },
    { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
    { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
    { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
    { code: 'UYW', symbol: 'UYW', name: 'Unidad Previsional' },
    { code: 'UZS', symbol: 'лв', name: 'Uzbekistan Som' },
    { code: 'VED', symbol: 'Bs.D', name: 'Venezuelan Bolívar Digital' },
    { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolívar Soberano' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu' },
    { code: 'WST', symbol: 'WS$', name: 'Samoan Tala' },
    { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc BEAC' },
    { code: 'XCD', symbol: '$', name: 'East Caribbean Dollar' },
    { code: 'XDR', symbol: 'SDR', name: 'Special Drawing Rights' },
    { code: 'XOF', symbol: 'CFA', name: 'CFA Franc BCEAO' },
    { code: 'XPF', symbol: '₣', name: 'CFP Franc' },
    { code: 'YER', symbol: '﷼', name: 'Yemeni Rial' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' }
  ].map(currency => ({
    value: currency.code,
    label: `${currency.code} (${currency.symbol}) - ${currency.name}`
  }));

  // Fetch company data for edit mode
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
  }, [id, isEditMode]);

  const fetchCompanyData = async () => {
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
          currency: company.currency || 'GBP'
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
  };

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
          currency: 'GBP'
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
