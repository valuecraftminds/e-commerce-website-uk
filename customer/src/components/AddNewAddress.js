import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Row, Col, Button, Container } from 'react-bootstrap';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const getAuthToken = () => localStorage.getItem('authToken') || '';

const createAxios = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    params: { company_code: COMPANY_CODE }
  });
  instance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

// Helper function for phone number formatting
const onlyDigits = (s) => (s || '').replace(/\D+/g, '');

const AddNewAddress = ({ show, onHide, onSubmit }) => {
  const api = useMemo(() => createAxios(), []);

  const [newAddress, setNewAddress] = useState({
    first_name: '', 
    last_name: '', 
    house: '',
    address_line_1: '', 
    address_line_2: '',
    city: '', 
    state: '', 
    country: '', 
    postal_code: '',
    phone: '',
  });

  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (!show) return;
    setNewAddress({
      first_name: '', 
      last_name: '', 
      house: '',
      address_line_1: '', 
      address_line_2: '',
      city: '', 
      state: '', 
      country: '', 
      postal_code: '',
      phone: '',
    });
    setSetAsDefault(false);
    setFieldErrors({});
    setError('');
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone number to digits only
    if (name === 'phone') {
      const digits = onlyDigits(value).slice(0, 20);
      setNewAddress((prev) => ({ ...prev, [name]: digits }));
      return;
    }
    
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Validate address form
  const validateAddress = () => {
    const fe = {};
    const requiredFields = [
      'first_name', 'last_name', 'house', 'address_line_1', 
      'city', 'state', 'country', 'postal_code', 'phone'
    ];
    
    requiredFields.forEach((field) => {
      if (!String(newAddress[field] || '').trim()) {
        fe[field] = 'Required';
      }
    });
    
    // Validate phone number length
    if (newAddress.phone && onlyDigits(newAddress.phone).length < 7) {
      fe.phone = 'Enter a valid phone number';
    }
    
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  // Save new address
  const saveAddress = async () => {
    const payload = {
      first_name: newAddress.first_name,
      last_name: newAddress.last_name,
      house: newAddress.house,
      address_line_1: newAddress.address_line_1,
      address_line_2: newAddress.address_line_2 || undefined,
      city: newAddress.city,
      state: newAddress.state,
      country: newAddress.country,
      postal_code: newAddress.postal_code,
      phone: newAddress.phone
      // company_code: COMPANY_CODE
    };

    const { data } = await api.post(`${BASE_URL}/api/customer/address/add-address`, payload);

    const addressId =
      data?.address_id ??
      data?.address?.id ??
      data?.created_address_id ??
      data?.id;

    if (!addressId) {
      throw new Error('Address saved but no ID was returned by the server.');
    }

    // Set as default if requested
    if (setAsDefault) {
      try {
        await api.post(`${BASE_URL}/api/customer/address/set-default-address`, {
          address_id: addressId,
          company_code: COMPANY_CODE,
        });
      } catch (e) {
        console.warn('Failed to set default address:', e);
      }
    }

    return { addressId, addressData: { ...newAddress, address_id: addressId } };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateAddress()) return;

    try {
      setIsLoading(true);
      const result = await saveAddress();
      
      // Call parent callback with the new address data
      onSubmit?.(result);
      onHide?.();
    } catch (err) {
      console.error('Error saving address:', err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = isLoading;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="add-address-modal">
      <Modal.Header closeButton>
        <Modal.Title>Add New Address</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          <Container className="address-form-container">
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            {/* Name Fields */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="firstName">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    value={newAddress.first_name}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.first_name}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="lastName">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    autoComplete="family-name"
                    value={newAddress.last_name}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.last_name}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Address Fields */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="house">
                  <Form.Label>House / Apt</Form.Label>
                  <Form.Control
                    type="text"
                    name="house"
                    autoComplete="address-line2"
                    value={newAddress.house}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.house}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.house}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="addressLine1">
                  <Form.Label>Address Line 1</Form.Label>
                  <Form.Control
                    type="text"
                    name="address_line_1"
                    autoComplete="address-line1"
                    value={newAddress.address_line_1}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.address_line_1}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.address_line_1}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="addressLine2">
                  <Form.Label>Address Line 2 (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="address_line_2"
                    autoComplete="address-line2"
                    value={newAddress.address_line_2}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    value={newAddress.city}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.city}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Location Fields */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="state">
                  <Form.Label>Province / State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    autoComplete="address-level1"
                    value={newAddress.state}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.state}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="country">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    autoComplete="country-name"
                    value={newAddress.country}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.country}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.country}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Postal Code and Phone */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="postalCode">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    autoComplete="postal-code"
                    value={newAddress.postal_code}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.postal_code}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.postal_code}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="phone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    value={newAddress.phone}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.phone}
                    disabled={disabled}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Default Address Checkbox */}
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="setAsDefault" className="mt-1">
                  <Form.Check
                    type="checkbox"
                    id="set-as-default"
                    label="Set this as my default address"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="set-as-default-checkbox"
                    disabled={disabled}
                  />
                  <Form.Text className="text-muted">
                    This will be saved as your default shipping address for future orders.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Container>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={disabled}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={disabled}>
            {isLoading ? 'Saving Address...' : 'Save Address'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddNewAddress;