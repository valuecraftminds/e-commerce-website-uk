import React, { useState, useEffect , useContext} from 'react';
import { Modal, Form, Row, Col, Button, Container } from 'react-bootstrap';
import axios from 'axios';
import '../styles/CheckoutModal.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const CheckoutModal = ({ show, onHide, onSubmit }) => {
  // Get auth token from logged in user
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    return token;
  };

  // Get axios config with auth token
  const getAxiosConfig = () => {
    const token = getAuthToken();
    const config = {
      params: { company_code: COMPANY_CODE },
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  };

  const [shippingData, setShippingData] = useState({
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
    payment_method: '',
    card_number: '',
    card_expiry_date: '', 
    card_cvv: '',
    paypal_email: '',
    bank_account: '',
    bank_name: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  

  useEffect(() => {
    if (!COMPANY_CODE) {
      console.error('Company code not configured');
      return;
    }

    // Reset form when modal opens
    if (show) {
      setShippingData({
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
        payment_method: '',
        card_number: '',
        card_expiry_date: '',
        card_cvv: '',
        paypal_email: '',
        bank_account: '',
        bank_name: '',
      });
      setError('');
    }
  }, [show]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {

      const token = getAuthToken();

      console.log('token:', token);

      // Prepare data in the format expected by backend
      const requestData = {
        first_name: shippingData.first_name,
        last_name: shippingData.last_name,
        house: shippingData.house,
        address_line_1: shippingData.address_line_1,
        address_line_2: shippingData.address_line_2,
        city: shippingData.city,
        state: shippingData.state,
        country: shippingData.country,
        postal_code: shippingData.postal_code,
        phone: shippingData.phone,
        payment_method: {
          method_type: shippingData.payment_method,
          provider: shippingData.payment_method === 'paypal' ? 'PayPal' : 
                   shippingData.payment_method === 'credit-card' ? 'Credit Card' :
                   shippingData.payment_method === 'bank-transfer' ? 'Bank Transfer' : null,
          card_number: shippingData.payment_method === 'credit-card' ? shippingData.card_number : null,
          card_expiry_date: shippingData.payment_method === 'credit-card' ? shippingData.card_expiry_date : null,
          card_cvv: shippingData.payment_method === 'credit-card' ? shippingData.card_cvv : null,
          paypal_email: shippingData.payment_method === 'paypal' ? shippingData.paypal_email : null,
          bank_account: shippingData.payment_method === 'bank-transfer' ? shippingData.bank_account : null,
          bank_name: shippingData.payment_method === 'bank-transfer' ? shippingData.bank_name : null,
        }
      };

      const { data, status } = await axios.post(
        `${BASE_URL}/api/customer/checkout/checkout-details`,
        requestData,
        {
          params: { company_code: COMPANY_CODE },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (status === 200 || status === 201) {
        console.log('Checkout successful:', data);
        onSubmit?.(data); // Pass the response data to callback
        onHide(); // Close modal
      } else {
        setError(`Checkout failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error during checkout submission:', error);
      
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || `Server error: ${error.response.status}`;
        setError(message);
      } else if (error.request) {
        // Request was made but no response received
        setError('Network error. Please check your connection.');
      } else {
        // other
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className='checkout-modal'>
      <Modal.Header>
        <Modal.Title>Update Shipping Information</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Container className="details-container">
            {error && (
              <div className="alert alert-danger mb-3">
                {error}
              </div>
            )}
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="shippingFirstName">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={shippingData.first_name || ''}
                    onChange={handleShippingChange}
                    onKeyPress={(e) => {
                      if (!/^[a-zA-Z\s]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="shippingLastName">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={shippingData.last_name || ''}
                    onChange={handleShippingChange}
                    onKeyPress={(e) => {
                      if (!/^[a-zA-Z\s]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Address Fields */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="shippingHouse">
                  <Form.Label>House / Apt</Form.Label>
                  <Form.Control
                    type="text"
                    name="house"
                    value={shippingData.house || ''}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="shippingAddressLine1">
                  <Form.Label>Address Line 1</Form.Label>
                  <Form.Control
                    type="text"
                    name="address_line_1"
                    value={shippingData.address_line_1 || ''}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="shippingAddressLine2">
                  <Form.Label>Address Line 2 (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="address_line_2"
                    value={shippingData.address_line_2 || ''}
                    onChange={handleShippingChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="shippingCity">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={shippingData.city || ''}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="shippingState">
                  <Form.Label>Province / State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={shippingData.state || ''}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="shippingCountry">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={shippingData.country || ''}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="shippingPostalCode">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={shippingData.postal_code || ''}
                    onChange={handleShippingChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="shippingPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={shippingData.phone}
                    onChange={handleShippingChange}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3 payment-method-inline">
              <Col md={12}>
                <Form.Group controlId="paymentMethod" className="mt-3">
                  <Form.Label>Payment Method</Form.Label>

                  <div className="payment-method-inline">
                    <Form.Check 
                      type="radio"
                      id="credit-card"
                      label="Add Card Details"
                      name="payment_method"
                      value="credit-card"
                      checked={shippingData.payment_method === "credit-card"}
                      onChange={handleShippingChange}
                    />

                    {/* <Form.Check 
                      type="radio"
                      id="paypal"
                      label="PayPal"
                      name="payment_method"
                      value="paypal"
                      checked={shippingData.payment_method === "paypal"}
                      onChange={handleShippingChange}
                    />

                    <Form.Check 
                      type="radio"
                      id="bank-transfer"
                      label="Bank Transfer"
                      name="payment_method"
                      value="bank-transfer"
                      checked={shippingData.payment_method === "bank-transfer"}
                      onChange={handleShippingChange}
                    /> */}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Conditional Payment Fields */}
            {shippingData.payment_method === 'credit-card' && (
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group controlId="cardNumber">
                    <Form.Label>Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="card_number"
                      value={shippingData.card_number}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="cardExpiryDate">
                    <Form.Label>Expiry Date</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="MM/YY"
                      name="card_expiry_date"
                      value={shippingData.card_expiry_date}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="cardCvv">
                    <Form.Label>CVV</Form.Label>
                    <Form.Control
                      type="password"
                      name="card_cvv"
                      value={shippingData.card_cvv}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            {/* {shippingData.payment_method === 'paypal' && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="paypalEmail">
                    <Form.Label>PayPal Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="paypal_email"
                      value={shippingData.paypal_email}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            {shippingData.payment_method === 'bank-transfer' && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="bankAccount">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="bank_account"
                      value={shippingData.bank_account}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="bankName">
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bank_name"
                      value={shippingData.bank_name}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group> 
                </Col>
              </Row>
            )}*/}
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className='continue-btn' 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CheckoutModal;
