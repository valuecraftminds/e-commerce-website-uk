import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Container } from 'react-bootstrap';
import axios from 'axios';

import '../styles/CheckoutModal.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const CheckoutModal = ({ show, onHide, onSubmit }) => {
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
    card_expiry: '',
    card_cvv: '',
    paypal_email: '',
    bank_account: '',
    bank_name: '',
  });

  useEffect(() => {
    if(!COMPANY_CODE) {
      console.error('Company code not configured');
      return;
    }

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
      card_expiry: '',
      card_cvv: '',
      paypal_email: '',
      bank_account: '',
      bank_name: '',
    });
  }, [show]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

      try {
      const { data, status } = await axios.post(
        `${BASE_URL}/api/customer/checkout/checkout-details`,
        shippingData,
        {
          params: {
            company_code: COMPANY_CODE, // passed via URL
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (status === 200) {
        console.log('Checkout successful:', data);
        onSubmit?.(shippingData); // call callback if provided
        onHide(); // close modal
      } else {
        console.error(`Checkout failed: ${status}`);
      }
    } catch (error) {
      console.error('Error during checkout submission:', error);
    }
  };


  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header>
        <Modal.Title>Update Shipping Information</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Container className="details-container">
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
              {/* address */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="shippingHouseNumber">
                    <Form.Label>House / Apt</Form.Label>
                    <Form.Control
                      type="text"
                      name="house_number"
                      value={shippingData.house_number || ''}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="shippingStreetName">
                    <Form.Label>Street Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="street_name"
                      value={shippingData.street_name || ''}
                      onChange={handleShippingChange}
                      required
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
                <Col md={6}>
                  <Form.Group controlId="shippingProvince">
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
              </Row>
            <Row className="mb-3">
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
              <Col md={6}>
                <Form.Group controlId="paymentMethod" className="mt-3">
                  <Form.Label>Payment Method</Form.Label>

                  <div className="payment-method-inline">
                    <Form.Check 
                      type="radio"
                      id="credit-card"
                      label="Credit Card"
                      name="payment_method"
                      value="credit-card"
                      checked={shippingData.payment_method === "credit-card"}
                      onChange={handleShippingChange}
                    />

                    <Form.Check 
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
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Conditional Fields */}
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
                  <Form.Group controlId="expiryDate">
                    <Form.Label>Expiry Date</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="MM/YY"
                      name="expiry_date"
                      value={shippingData.expiry_date}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="cvv">
                    <Form.Label>CVV</Form.Label>
                    <Form.Control
                      type="password"
                      name="cvv"
                      value={shippingData.cvv}
                      onChange={handleShippingChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            {shippingData.payment_method === 'paypal' && (
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
            )}
        </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className='continue-btn' onClick={handleSubmit}>
            Continue
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CheckoutModal;
