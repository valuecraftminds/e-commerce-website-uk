import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSidebar } from '../../App'; // Import the sidebar context
import '../../styles/RegisterPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;

const sidebarOptionsList = [
  // { label: 'User Management', value: 'users' },
  { label: 'Categories', value: 'category' },
  { label: 'Styles', value: 'style' },
  {
    label: 'Warehouse',
    value: 'warehouse',
    dropdown: true,
    items: [
      { label: 'GRN', value: 'warehouse_grn' },
      { label: 'Issuing', value: 'warehouse_issuing' }
    ]
  },
  {
    label: 'Merchandising',
    value: 'merchandising',
    dropdown: true,
    items: [
      { label: 'Create PO', value: 'merchandising_po' }
    ]
  },
  {
    label: 'Finance',
    value: 'finance',
    dropdown: true,
    items: [
      { label: 'Create currency', value: 'finance_currency' },
      { label: 'Create supplier', value: 'finance_supplier' }
    ]
  },
  { label: 'Accounting', value: 'accounting' },
  {
    label: 'Settings',
    value: 'settings',
    dropdown: true,
    items: [
      { label: 'Profile settings', value: 'settings_profile' },
      { label: 'Company settings', value: 'settings_company' },
      { label: 'Website settings', value: 'settings_website' }
    ]
  }
];

export default function RegisterPage() {
  const { id } = useParams();
  const { sidebarCollapsed } = useSidebar(); // Use sidebar context
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
  const [sideBarOptions, setSideBarOptions] = useState([]);
  const { userData } = useContext(AuthContext);

  const navigate = useNavigate();
  const company_code = userData?.company_code;

  // Fetch admin data if editing
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetch(`${BASE_URL}/api/admin/auth/get-admin/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormData({
              name: data.admin.name || '',
              email: data.admin.email || '',
              phone: data.admin.phone_number || '',
              role: data.admin.role || '',
              password: '',
              confirmPassword: ''
            });
            setSideBarOptions(Array.isArray(data.admin.side_bar_options) ? data.admin.side_bar_options : []);
          } else {
            setErrorMsg(data.message || 'Admin not found');
          }
        })
        .catch(() => setErrorMsg('Server error loading admin.'))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  // Helper function to check if a dropdown has any selected sub-items
  const hasSelectedSubItems = (dropdown) => {
    return dropdown.items.some(item => sideBarOptions.includes(item.value));
  };

  // Helper function to check if all sub-items are selected
  const isDropdownFullyChecked = (dropdown) => {
    return dropdown.items.every(item => sideBarOptions.includes(item.value));
  };

  // Helper function to check if dropdown parent should be checked (indeterminate or fully checked)
  const isDropdownChecked = (dropdown) => {
    return sideBarOptions.includes(dropdown.value);
  };

  const handleDropdownChange = (dropdown) => {
    if (isDropdownChecked(dropdown)) {
      // Uncheck parent and all sub-items
      setSideBarOptions(prev => 
        prev.filter(opt => 
          opt !== dropdown.value && 
          !dropdown.items.some(item => item.value === opt)
        )
      );
    } else {
      // Check parent and all sub-items
      const newOptions = [
        dropdown.value,
        ...dropdown.items.map(item => item.value)
      ];
      setSideBarOptions(prev => {
        const filtered = prev.filter(opt => 
          opt !== dropdown.value && 
          !dropdown.items.some(item => item.value === opt)
        );
        return [...filtered, ...newOptions];
      });
    }
  };

  const handleSidebarOptionChange = (option) => {
    // Check if this option is a sub-item of any dropdown
    const parentDropdown = sidebarOptionsList.find(dropdown => 
      dropdown.dropdown && dropdown.items.some(item => item.value === option)
    );

    if (parentDropdown) {
      // Handle sub-item change
      if (sideBarOptions.includes(option)) {
        // Remove sub-item and check if we need to remove parent
        setSideBarOptions(prev => {
          const newOptions = prev.filter(opt => opt !== option);
          // If no other sub-items are selected, remove parent too
          const otherSubsSelected = parentDropdown.items
            .filter(item => item.value !== option)
            .some(item => newOptions.includes(item.value));
          
          if (!otherSubsSelected) {
            return newOptions.filter(opt => opt !== parentDropdown.value);
          }
          return newOptions;
        });
      } else {
        // Add sub-item and ensure parent is included
        setSideBarOptions(prev => {
          const newOptions = [...prev, option];
          if (!newOptions.includes(parentDropdown.value)) {
            newOptions.push(parentDropdown.value);
          }
          return newOptions;
        });
      }
    } else {
      // Handle regular option
      setSideBarOptions(prev =>
        prev.includes(option)
          ? prev.filter(o => o !== option)
          : [...prev, option]
      );
    }
  };

  // prevent entering numbers or symbols to name field
  const handleNameChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z\s]/g, '');
    setFormData((prev) => ({ ...prev, name: value }));
  };

  // Use react-phone-input-2 for phone number input
  const handlePhoneChange = (value, country) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    if (!value) {
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
      
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }

    if (name === 'confirmPassword') {
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
    if (!id && formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let response, data;
      if (id) {
        // Edit mode (no change)
        response = await fetch(`${BASE_URL}/api/admin/auth/update-admin/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone,
            role: formData.role,
            side_bar_options: JSON.stringify(sideBarOptions)
          })
        });
        data = await response.json();
        if (response.ok && data.success) {
          setSuccessMsg('Admin updated successfully!');
          setFormData({
            name: '',
            email: '',
            phone: '',
            role: '',
            password: '',
            confirmPassword: ''
          });
          setPasswordError('');
          setTimeout(() => navigate('/users'), 1200);
        } else {
          setErrorMsg(data.message || 'Update failed');
        }
      } else {
        // Register mode with email verification
        const adminFormData = new FormData();
        adminFormData.append('company_code', company_code);
        adminFormData.append('name', formData.name);
        adminFormData.append('email', formData.email);
        adminFormData.append('phone', formData.phone);
        adminFormData.append('role', formData.role);
        adminFormData.append('password', formData.password);
        adminFormData.append('side_bar_options', JSON.stringify(sideBarOptions));
        adminFormData.append('frontend_url', window.location.origin);

        response = await fetch(`${BASE_URL}/api/admin/auth/create-company-admin`, {
          method: 'POST',
          body: adminFormData,
        });
        data = await response.json();
        if (response.ok && data.success) {
          setSuccessMsg(
            data.message?.toLowerCase().includes('verification')
              ? `A verification email has been sent to ${formData.email}.`
              : 'User registered successfully!'
          );
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
      }
    } catch (error) {
      setErrorMsg('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container" style={{ 
      minHeight: '100vh',
      width: '100%',
      padding: '20px 0'
    }}>
      <Container fluid style={{ 
        maxWidth: '100%',
        padding: '0 20px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <Button 
            variant="primary" 
            className="btn-custom-primary" 
            onClick={() => navigate('/users')}
          >
            ← Back
          </Button>
        </div>
        
        <Card className="register-card" style={{ 
          width: '100%',
          maxWidth: 'none',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <Card.Body style={{ padding: '30px' }}>
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
            
            <div className="register-flex-row" style={{ 
              display: 'flex', 
              gap: '40px',
              alignItems: 'flex-start'
            }}>
              <div className="register-form-section" style={{ 
                flex: formData.role !== 'VCM_Admin' && formData.role !== 'Company_Admin' ? '2' : '1',
                minWidth: '0'
              }}>
                <Form className="register-form" onSubmit={handleSubmit}>
                  <h2 className="register-title" style={{ 
                    marginBottom: '30px',
                    color: '#333',
                    fontWeight: '600'
                  }}>
                    {id ? 'Edit User' : 'Add New User'}
                  </h2>
                  
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
                          style={{
                            borderRadius: '8px',
                            border: '2px solid #e0e0e0',
                            padding: '12px 16px',
                            fontSize: '16px'
                          }}
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
                          style={{
                            borderRadius: '8px',
                            border: '2px solid #e0e0e0',
                            padding: '12px 16px',
                            fontSize: '16px'
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3 phone-input-group">
                        <Form.Label htmlFor="phone">Phone Number</Form.Label>
                        <PhoneInput
                          country={'gb'}
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          inputProps={{
                            name: 'phone',
                            required: true,
                            className: `form-control${phoneError ? ' is-invalid' : ''}`,
                            style: { 
                              width: '100%', 
                              height: '48px', 
                              fontSize: '16px', 
                              borderRadius: '8px', 
                              backgroundColor: '#fff', 
                              border: '2px solid #e0e0e0', 
                              paddingLeft: '48px' 
                            }
                          }}
                          enableSearch={true}
                          countryCodeEditable={false}
                          dropdownStyle={{ fontSize: '16px', zIndex: 9999 }}
                          buttonStyle={{ 
                            borderRadius: '8px 0 0 8px', 
                            border: '2px solid #e0e0e0', 
                            height: '48px', 
                            background: '#fff' 
                          }}
                          searchStyle={{ fontSize: '16px' }}
                        />
                        {phoneError && (
                          <div className="invalid-feedback d-block">{phoneError}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="role">Role</Form.Label>
                        <Form.Control
                          type="text"
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          required
                          placeholder="Enter role"
                          style={{
                            borderRadius: '8px',
                            border: '2px solid #e0e0e0',
                            padding: '12px 16px',
                            fontSize: '16px'
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {!id && (
                    <Row>
                      <Col md={6}>
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
                              style={{
                                borderRadius: '8px 0 0 8px',
                                border: '2px solid #e0e0e0',
                                padding: '12px 16px',
                                fontSize: '16px'
                              }}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ 
                                border: '2px solid #e0e0e0', 
                                borderLeft: 'none',
                                borderRadius: '0 8px 8px 0'
                              }}
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                          </InputGroup>
                          {showRules && (
                            <div className='password-rules' style={{
                              marginTop: '10px',
                              padding: '10px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #e0e0e0'
                            }}>
                              <small>Password requirements:</small>
                              <ul className='list-unstyled ms-2' style={{ marginTop: '5px' }}>
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
                              style={{
                                borderRadius: '8px 0 0 8px',
                                border: '2px solid #e0e0e0',
                                padding: '12px 16px',
                                fontSize: '16px'
                              }}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{ 
                                border: '2px solid #e0e0e0', 
                                borderLeft: 'none',
                                borderRadius: '0 8px 8px 0'
                              }}
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
                  )}
                  
                  <div className="text-center" style={{ marginTop: '30px' }}>
                    <Button 
                      type="submit" 
                      className="register-btn"
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#007bff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 40px',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          {id ? 'Updating...' : 'Registering...'}
                        </>
                      ) : (
                        id ? 'Update User' : 'Register User'
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
              
              {formData.role !== 'VCM_Admin' && formData.role !== 'Company_Admin' && (
                <div className="sidebar-options-section" style={{ 
                  flex: '1',
                  minWidth: '300px',
                  backgroundColor: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0'
                }}>
                  <Form.Group className="mb-3">
                    <Form.Label className='sidebar-label'>
                      <h3 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        color: '#333',
                        marginBottom: '20px'
                      }}>
                        Sidebar Options
                      </h3>
                    </Form.Label>
                    <div>
                      {sidebarOptionsList.map(opt =>
                        opt.dropdown ? (
                          <div key={opt.value} style={{ marginBottom: '12px' }}>
                            <Form.Check
                              type="checkbox"
                              label={<b style={{ fontSize: '16px' }}>{opt.label}</b>}
                              checked={isDropdownChecked(opt)}
                              onChange={() => handleDropdownChange(opt)}
                              style={{ 
                                opacity: hasSelectedSubItems(opt) && !isDropdownFullyChecked(opt) ? 0.6 : 1,
                                fontSize: '16px'
                              }}
                            />
                            <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                              {opt.items.map(sub => (
                                <Form.Check
                                  key={sub.value}
                                  type="checkbox"
                                  label={sub.label}
                                  checked={sideBarOptions.includes(sub.value)}
                                  onChange={() => handleSidebarOptionChange(sub.value)}
                                  style={{ 
                                    marginBottom: '6px',
                                    fontSize: '14px'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Form.Check
                            key={opt.value}
                            type="checkbox"
                            label={opt.label}
                            checked={sideBarOptions.includes(opt.value)}
                            onChange={() => handleSidebarOptionChange(opt.value)}
                            style={{ 
                              marginBottom: '10px',
                              fontSize: '16px'
                            }}
                          />
                        )
                      )}
                    </div>
                  </Form.Group>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}


// import { useContext, useEffect, useState } from 'react';
// import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
// import PhoneInput from 'react-phone-input-2';
// import 'react-phone-input-2/lib/style.css';
// import { useNavigate, useParams } from 'react-router-dom';
// import { AuthContext } from '../../context/AuthContext';
// import '../../styles/RegisterPage.css';

// const BASE_URL = process.env.REACT_APP_API_URL;

// const sidebarOptionsList = [
//   // { label: 'User Management', value: 'users' },
//   { label: 'Categories', value: 'category' },
//   { label: 'Styles', value: 'style' },
//   {
//     label: 'Warehouse',
//     value: 'warehouse',
//     dropdown: true,
//     items: [
//       { label: 'GRN', value: 'warehouse_grn' },
//       { label: 'Issuing', value: 'warehouse_issuing' }
//     ]
//   },
//   {
//     label: 'Merchandising',
//     value: 'merchandising',
//     dropdown: true,
//     items: [
//       { label: 'Create PO', value: 'merchandising_po' }
//     ]
//   },
//   {
//     label: 'Finance',
//     value: 'finance',
//     dropdown: true,
//     items: [
//       { label: 'Create currency', value: 'finance_currency' },
//       { label: 'Create supplier', value: 'finance_supplier' }
//     ]
//   },
//   { label: 'Accounting', value: 'accounting' },
//   {
//     label: 'Settings',
//     value: 'settings',
//     dropdown: true,
//     items: [
//       { label: 'Profile settings', value: 'settings_profile' },
//       { label: 'Company settings', value: 'settings_company' },
//       { label: 'Website settings', value: 'settings_website' }
//     ]
//   }
// ];

// export default function RegisterPage() {
//   const { id } = useParams();
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     role: '',
//     password: '',
//     confirmPassword: ''
//   });

//   const [phoneError, setPhoneError] = useState('');
//   const [passwordError, setPasswordError] = useState('');
//   const [passwordRules, setPasswordRules] = useState({
//     length: false,
//     uppercase: false,
//     lowercase: false,
//     number: false,
//     specialChar: false
//   });
//   const [showRules, setShowRules] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState('');
//   const [successMsg, setSuccessMsg] = useState('');
//   const [sideBarOptions, setSideBarOptions] = useState([]);
//   const { userData } = useContext(AuthContext);

//   const navigate = useNavigate();
//   const company_code = userData?.company_code;

//   // Fetch admin data if editing
//   useEffect(() => {
//     if (id) {
//       setIsLoading(true);
//       fetch(`${BASE_URL}/api/admin/auth/get-admin/${id}`)
//         .then(res => res.json())
//         .then(data => {
//           if (data.success) {
//             setFormData({
//               name: data.admin.name || '',
//               email: data.admin.email || '',
//               phone: data.admin.phone_number || '',
//               role: data.admin.role || '',
//               password: '',
//               confirmPassword: ''
//             });
//             setSideBarOptions(Array.isArray(data.admin.side_bar_options) ? data.admin.side_bar_options : []);
//           } else {
//             setErrorMsg(data.message || 'Admin not found');
//           }
//         })
//         .catch(() => setErrorMsg('Server error loading admin.'))
//         .finally(() => setIsLoading(false));
//     }
//   }, [id]);

//   // Helper function to check if a dropdown has any selected sub-items
//   const hasSelectedSubItems = (dropdown) => {
//     return dropdown.items.some(item => sideBarOptions.includes(item.value));
//   };

//   // Helper function to check if all sub-items are selected
//   const isDropdownFullyChecked = (dropdown) => {
//     return dropdown.items.every(item => sideBarOptions.includes(item.value));
//   };

//   // Helper function to check if dropdown parent should be checked (indeterminate or fully checked)
//   const isDropdownChecked = (dropdown) => {
//     return sideBarOptions.includes(dropdown.value);
//   };

//   const handleDropdownChange = (dropdown) => {
//     if (isDropdownChecked(dropdown)) {
//       // Uncheck parent and all sub-items
//       setSideBarOptions(prev => 
//         prev.filter(opt => 
//           opt !== dropdown.value && 
//           !dropdown.items.some(item => item.value === opt)
//         )
//       );
//     } else {
//       // Check parent and all sub-items
//       const newOptions = [
//         dropdown.value,
//         ...dropdown.items.map(item => item.value)
//       ];
//       setSideBarOptions(prev => {
//         const filtered = prev.filter(opt => 
//           opt !== dropdown.value && 
//           !dropdown.items.some(item => item.value === opt)
//         );
//         return [...filtered, ...newOptions];
//       });
//     }
//   };

//   const handleSidebarOptionChange = (option) => {
//     // Check if this option is a sub-item of any dropdown
//     const parentDropdown = sidebarOptionsList.find(dropdown => 
//       dropdown.dropdown && dropdown.items.some(item => item.value === option)
//     );

//     if (parentDropdown) {
//       // Handle sub-item change
//       if (sideBarOptions.includes(option)) {
//         // Remove sub-item and check if we need to remove parent
//         setSideBarOptions(prev => {
//           const newOptions = prev.filter(opt => opt !== option);
//           // If no other sub-items are selected, remove parent too
//           const otherSubsSelected = parentDropdown.items
//             .filter(item => item.value !== option)
//             .some(item => newOptions.includes(item.value));
          
//           if (!otherSubsSelected) {
//             return newOptions.filter(opt => opt !== parentDropdown.value);
//           }
//           return newOptions;
//         });
//       } else {
//         // Add sub-item and ensure parent is included
//         setSideBarOptions(prev => {
//           const newOptions = [...prev, option];
//           if (!newOptions.includes(parentDropdown.value)) {
//             newOptions.push(parentDropdown.value);
//           }
//           return newOptions;
//         });
//       }
//     } else {
//       // Handle regular option
//       setSideBarOptions(prev =>
//         prev.includes(option)
//           ? prev.filter(o => o !== option)
//           : [...prev, option]
//       );
//     }
//   };

//   // prevent entering numbers or symbols to name field
//   const handleNameChange = (e) => {
//     let value = e.target.value;
//     value = value.replace(/[^a-zA-Z\s]/g, '');
//     setFormData((prev) => ({ ...prev, name: value }));
//   };

//   // Use react-phone-input-2 for phone number input
//   const handlePhoneChange = (value, country) => {
//     setFormData((prev) => ({ ...prev, phone: value }));
//     if (!value) {
//       setPhoneError('Phone number is required');
//     } else {
//       setPhoneError('');
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === 'password') {
//       const rules = {
//         length: value.length >= 8 && value.length <= 12,
//         uppercase: /[A-Z]/.test(value),
//         lowercase: /[a-z]/.test(value),
//         number: /\d/.test(value),
//         specialChar: /[\W_]/.test(value)
//       };
//       setPasswordRules(rules);
      
//       if (formData.confirmPassword && value !== formData.confirmPassword) {
//         setPasswordError('Passwords do not match');
//       } else {
//         setPasswordError('');
//       }
//     }

//     if (name === 'confirmPassword') {
//       if (value !== formData.password) {
//         setPasswordError('Passwords do not match');
//       } else {
//         setPasswordError('');
//       }
//     }

//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!id && formData.password !== formData.confirmPassword) {
//       setPasswordError('Passwords do not match');
//       return;
//     }
//     setIsLoading(true);
//     setErrorMsg('');
//     setSuccessMsg('');
//     try {
//       let response, data;
//       if (id) {
//         // Edit mode (no change)
//         response = await fetch(`${BASE_URL}/api/admin/auth/update-admin/${id}`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             name: formData.name,
//             email: formData.email,
//             phone_number: formData.phone,
//             role: formData.role,
//             side_bar_options: JSON.stringify(sideBarOptions)
//           })
//         });
//         data = await response.json();
//         if (response.ok && data.success) {
//           setSuccessMsg('Admin updated successfully!');
//           setFormData({
//             name: '',
//             email: '',
//             phone: '',
//             role: '',
//             password: '',
//             confirmPassword: ''
//           });
//           setPasswordError('');
//           setTimeout(() => navigate('/users'), 1200);
//         } else {
//           setErrorMsg(data.message || 'Update failed');
//         }
//       } else {
//         // Register mode with email verification
//         const adminFormData = new FormData();
//         adminFormData.append('company_code', company_code);
//         adminFormData.append('name', formData.name);
//         adminFormData.append('email', formData.email);
//         adminFormData.append('phone', formData.phone);
//         adminFormData.append('role', formData.role);
//         adminFormData.append('password', formData.password);
//         adminFormData.append('side_bar_options', JSON.stringify(sideBarOptions));
//         adminFormData.append('frontend_url', window.location.origin);

//         response = await fetch(`${BASE_URL}/api/admin/auth/create-company-admin`, {
//           method: 'POST',
//           body: adminFormData,
//         });
//         data = await response.json();
//         if (response.ok && data.success) {
//           setSuccessMsg(
//             data.message?.toLowerCase().includes('verification')
//               ? `A verification email has been sent to ${formData.email}.`
//               : 'User registered successfully!'
//           );
//           setFormData({
//             name: '',
//             email: '',
//             phone: '',
//             role: '',
//             password: '',
//             confirmPassword: ''
//           });
//           setPasswordError('');
//         } else {
//           setErrorMsg(data.message || 'Registration failed');
//         }
//       }
//     } catch (error) {
//       setErrorMsg('Something went wrong');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="register-container">
//       <Container>
//         <Card className="register-card">
//           <Button 
//             variant="primary" 
//             className="btn-custom-primary" 
//             onClick={() => navigate('/users')}
//           >
//             ← Back
//           </Button>
//           <Card.Body>
//             {successMsg && (
//               <div className="mb-3 text-success text-center fw-semibold">
//                 {successMsg}
//               </div>
//             )}
//             {errorMsg && (
//               <Alert variant="danger" className="text-center">
//                 {errorMsg}
//               </Alert>
//             )}
//             <div className="register-flex-row">
//               <div className="register-form-section">
//                 <Form className="register-form" onSubmit={handleSubmit}>
//                   <h2 className="register-title">{id ? 'Edit User' : 'Add New User'}</h2>
//                   <Row>
//                     <Col md={6}>
//                       <Form.Group className="mb-3">
//                         <Form.Label htmlFor="name">Full Name</Form.Label>
//                         <Form.Control
//                           id="name"
//                           type="text"
//                           name="name"
//                           value={formData.name}
//                           onChange={handleNameChange}
//                           placeholder="Enter full name"
//                           required
//                         />
//                       </Form.Group>
//                     </Col>
//                     <Col md={6}>
//                       <Form.Group className="mb-3">
//                         <Form.Label htmlFor="email">Email Address</Form.Label>
//                         <Form.Control
//                           id="email"
//                           type="email"
//                           name="email"
//                           value={formData.email}
//                           onChange={handleChange}
//                           placeholder="Enter email address"
//                           required
//                         />
//                       </Form.Group>
//                     </Col>
//                   </Row>
//                   <Row>
//                     <Col md={6}>
//                       <Form.Group className="mb-3 phone-input-group">
//                         <Form.Label htmlFor="phone">Phone Number</Form.Label>
//                         <PhoneInput
//                           country={'gb'}
//                           value={formData.phone}
//                           onChange={handlePhoneChange}
//                           inputProps={{
//                             name: 'phone',
//                             required: true,
//                             className: `form-control${phoneError ? ' is-invalid' : ''}`,
//                             style: { width: '100%', height: '48px', fontSize: '1rem', borderRadius: '12px', backgroundColor: '#f7fafc', border: '2px solid #e2e8f0', paddingLeft: '48px' }
//                           }}
//                           enableSearch={true}
//                           countryCodeEditable={false}
//                           dropdownStyle={{ fontSize: '1rem', zIndex: 9999 }}
//                           buttonStyle={{ borderRadius: '12px 0 0 12px', border: '2px solid #e2e8f0', height: '48px', background: '#f7fafc' }}
//                           searchStyle={{ fontSize: '1rem' }}
//                         />
//                         {phoneError && (
//                           <div className="invalid-feedback d-block">{phoneError}</div>
//                         )}
//                       </Form.Group>
//                     </Col>
//                     <Col md={6}>
//                       <Form.Group className="mb-3">
//                         <Form.Label htmlFor="role">Role</Form.Label>
//                         <Form.Control
//                           type="text"
//                           id="role"
//                           name="role"
//                           value={formData.role}
//                           onChange={handleChange}
//                           required
//                           placeholder="Enter role"
//                         />
//                       </Form.Group>
//                     </Col>
//                   </Row>
//                   {!id && (
//                     <Row>
//                       <Col>
//                         <Form.Group className="mb-3">
//                           <Form.Label htmlFor="password">Password</Form.Label>
//                           <InputGroup>
//                             <Form.Control
//                               id="password"
//                               type={showPassword ? "text" : "password"}
//                               name="password"
//                               value={formData.password}
//                               onChange={handleChange}
//                               placeholder="Enter password"
//                               onFocus={() => setShowRules(true)}
//                               onBlur={() => setShowRules(false)}
//                               required
//                             />
//                             <Button
//                               variant="outline-secondary"
//                               onClick={() => setShowPassword(!showPassword)}
//                               style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
//                             >
//                               {showPassword ? <FaEyeSlash /> : <FaEye />}
//                             </Button>
//                           </InputGroup>
//                           {showRules && (
//                             <div className='password-rules'>
//                               <small>Password requirements:</small>
//                               <ul className='list-unstyled ms-2'>
//                                 <li style={{ color: passwordRules.length ? '#28a745' : '#dc3545' }}>
//                                   {passwordRules.length ? '✅' : '❌'} 8-12 characters
//                                 </li>
//                                 <li style={{ color: passwordRules.uppercase ? '#28a745' : '#dc3545' }}>
//                                   {passwordRules.uppercase ? '✅' : '❌'} At least one uppercase letter 
//                                 </li>
//                                 <li style={{ color: passwordRules.lowercase ? '#28a745' : '#dc3545' }}>
//                                   {passwordRules.lowercase ? '✅' : '❌'} At least one lowercase letter
//                                 </li>
//                                 <li style={{ color: passwordRules.number ? '#28a745' : '#dc3545' }}>
//                                   {passwordRules.number ? '✅' : '❌'} At least one number  
//                                 </li>
//                                 <li style={{ color: passwordRules.specialChar ? '#28a745' : '#dc3545' }}>
//                                   {passwordRules.specialChar ? '✅' : '❌'} At least one special character 
//                                 </li>
//                               </ul>
//                             </div>
//                           )}
//                         </Form.Group>
//                       </Col>
//                       <Col>
//                         <Form.Group className="mb-3">
//                           <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
//                           <InputGroup>
//                             <Form.Control
//                               id="confirmPassword"
//                               type={showConfirmPassword ? "text" : "password"}
//                               name="confirmPassword"
//                               value={formData.confirmPassword}
//                               onChange={handleChange}
//                               placeholder="Confirm your password"
//                               isInvalid={!!passwordError}
//                               required
//                             />
//                             <Button
//                               variant="outline-secondary"
//                               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                               style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
//                             >
//                               {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
//                             </Button>
//                           </InputGroup>
//                           {passwordError && (
//                             <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
//                               {passwordError}
//                             </Form.Control.Feedback>
//                           )}
//                         </Form.Group>
//                       </Col>
//                     </Row>
//                   )}
//                   <div className="text-center">
//                     <Button 
//                       type="submit" 
//                       className="register-btn"
//                       disabled={isLoading}
//                     >
//                       {isLoading ? (
//                         <>
//                           <Spinner animation="border" size="sm" className="me-2" />
//                           {id ? 'Updating...' : 'Registering...'}
//                         </>
//                       ) : (
//                         id ? 'Update User' : 'Register User'
//                       )}
//                     </Button>
//                   </div>
//                 </Form>
//               </div>
//               {formData.role !== 'VCM_Admin' && formData.role !== 'Company_Admin' && (
//                 <div className="sidebar-options-section">
//                   <Form.Group className="mb-3">
//                     <Form.Label className='sidebar-label'> <h3>Sidebar Options </h3></Form.Label>
//                     <div>
//                       {sidebarOptionsList.map(opt =>
//                         opt.dropdown ? (
//                           <div key={opt.value} style={{ marginBottom: 8 }}>
//                             <Form.Check
//                               type="checkbox"
//                               label={<b>{opt.label}</b>}
//                               checked={isDropdownChecked(opt)}
//                               onChange={() => handleDropdownChange(opt)}
//                               style={{ 
//                                 opacity: hasSelectedSubItems(opt) && !isDropdownFullyChecked(opt) ? 0.6 : 1 
//                               }}
//                             />
//                             <div style={{ marginLeft: 24 }}>
//                               {opt.items.map(sub => (
//                                 <Form.Check
//                                   key={sub.value}
//                                   type="checkbox"
//                                   label={sub.label}
//                                   checked={sideBarOptions.includes(sub.value)}
//                                   onChange={() => handleSidebarOptionChange(sub.value)}
//                                 />
//                               ))}
//                             </div>
//                           </div>
//                         ) : (
//                           <Form.Check
//                             key={opt.value}
//                             type="checkbox"
//                             label={opt.label}
//                             checked={sideBarOptions.includes(opt.value)}
//                             onChange={() => handleSidebarOptionChange(opt.value)}
//                           />
//                         )
//                       )}
//                     </div>
//                   </Form.Group>
//                 </div>
//               )}
//             </div>
//           </Card.Body>
//         </Card>
//       </Container>
//     </div>
//   );
// }
