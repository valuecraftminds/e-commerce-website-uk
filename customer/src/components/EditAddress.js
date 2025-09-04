import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
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

// prevent adding symbols or letters
const onlyDigits = (s) => (s || '').replace(/\D+/g, '');

// no symbols or digits
const isValidName = (name) => /^[a-zA-Z\s]+$/.test(name.trim());

const EditAddress = ({ show, address, onHide, onSubmit }) => {
  const api = useMemo(() => createAxios(), []);
  
  const [addressData, setAddressData] = useState({
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

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Function to fetch specific address details by ID
  const fetchAddressById = useCallback(async (addressId) => {
    setIsFetching(true);
    setError('');
    try {
      // First try to get all addresses and find the specific one
      const { data } = await api.get('/api/customer/address/get-address');
      const foundAddress = data.find(addr => 
        String(addr.address_id || addr.id) === String(addressId)
      );
      
      if (foundAddress) {
        return foundAddress;
      } else {
        throw new Error('Address not found');
      }
    } catch (e) {
      console.error('Error fetching address:', e);
      throw e;
    } finally {
      setIsFetching(false);
    }
  }, [api]);

  // Prefill form with address data
  const prefillFromAddress = (addr) => {
    if (!addr) return;
    
    // Handle the case where name might be combined 
    let firstName = addr.first_name || '';
    let lastName = addr.last_name || '';
    
    // If first_name/last_name are not available but name is, split it
    if (!firstName && !lastName && addr.name) {
      const nameParts = addr.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    setAddressData({
      first_name: firstName,
      last_name: lastName,
      house: addr.house || '',
      address_line_1: addr.address_line_1 || addr.address || '', // Handle both field names
      address_line_2: addr.address_line_2 || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || '',
      postal_code: addr.postal_code || addr.postalCode || '', // Handle both field names
      phone: addr.phone || '',
    });
  };

  // Load address data when modal opens 
  useEffect(() => {
    if (!show) return;

    // Reset form
    setAddressData({
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
    setFieldErrors({});
    setError('');

    // If address prop is passed, use it directly
    if (address) {
      if (address.id || address.address_id) {
        // Fetch fresh data from server
        const addressId = address.id || address.address_id;
        fetchAddressById(addressId)
          .then(prefillFromAddress)
          .catch(err => {
            console.error('Failed to fetch address:', err);
            // Fallback to using the passed address data
            prefillFromAddress(address);
            setError('Using cached address data. Some information might be outdated.');
          });
      } else {
        // Use the passed address data directly
        prefillFromAddress(address);
      }
    }
  }, [show, address, fetchAddressById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number - only digits
    if (name === 'phone') {
      const digits = onlyDigits(value).slice(0, 20);
      setAddressData(prev => ({ ...prev, [name]: digits }));
      return;
    }

    // Validate name fields
    if (name === 'first_name' || name === 'last_name' || name === 'state' || name === 'country') {
      const characters = isValidName(value) ? value : '';
      setAddressData((prev) => ({ ...prev, [name]: characters }));
      return;
    }
    
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  // Validation 
  const validateAddress = () => {
    const fe = {};
    ['first_name', 'last_name', 'house', 'address_line_1', 'city', 'state', 'country', 'postal_code', 'phone']
      .forEach((k) => {
        if (!String(addressData[k] || '').trim()) {
          fe[k] = 'Required';
        }
      });
    
    if (addressData.phone && onlyDigits(addressData.phone).length < 7) {
      fe.phone = 'Enter a valid phone number';
    }
    
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateAddress()) return;

    if (!address?.id && !address?.address_id) {
      setError('No address ID found to update.');
      return;
    }

    try {
      setIsLoading(true);
      
      const addressId = address.id || address.address_id;
      const payload = {
        address_id: addressId,
        first_name: addressData.first_name,
        last_name: addressData.last_name,
        house: addressData.house,
        address_line_1: addressData.address_line_1,
        address_line_2: addressData.address_line_2 || undefined,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country,
        postal_code: addressData.postal_code,
        phone: addressData.phone,
        company_code: COMPANY_CODE
      };

      // Update the address via API
      await api.put(`/api/customer/address/update-address`, payload);
      
      // Call the parent's onSubmit with the result 
      onSubmit?.({
        addressId: addressId,
        addressData: addressData
      });

    } catch (err) {
      console.error('Update address error:', err);
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

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Address</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {isFetching ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading address...</span>
            </Spinner>
            <p className="mt-2">Loading address details...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={addressData.first_name}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.first_name}
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={addressData.last_name}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.last_name}
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>House/Building *</Form.Label>
              <Form.Control
                type="text"
                name="house"
                value={addressData.house}
                onChange={handleChange}
                isInvalid={!!fieldErrors.house}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.house}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address Line 1 *</Form.Label>
              <Form.Control
                type="text"
                name="address_line_1"
                value={addressData.address_line_1}
                onChange={handleChange}
                isInvalid={!!fieldErrors.address_line_1}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.address_line_1}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address Line 2</Form.Label>
              <Form.Control
                type="text"
                name="address_line_2"
                value={addressData.address_line_2}
                onChange={handleChange}
                disabled={isLoading}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={addressData.city}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.city}
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State *</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={addressData.state}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.state}
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country *</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={addressData.country}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.country}
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.country}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Postal Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={addressData.postal_code}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.postal_code}
                    disabled={isLoading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.postal_code}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={addressData.phone}
                onChange={handleChange}
                isInvalid={!!fieldErrors.phone}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.phone}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={isLoading || isFetching}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isLoading || isFetching}
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            'Update Address'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAddress;