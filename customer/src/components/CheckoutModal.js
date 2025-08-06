import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Container } from 'react-bootstrap';

import '../styles/CheckoutModal.css';

const CheckoutModal = ({ show, onHide, onSubmit }) => {
  const [billingData, setBillingData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    payment_method: 'credit-card',
  });

  const [shippingData, setShippingData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);

  useEffect(() => {
    if(!show){
      setBillingData({
      fullName: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      phone: '',
      payment_method: 'credit-card',
    });
      setShippingData({
        fullName: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        phone: '',
      });
      setSameAsBilling(true);
    }
  }, [show]);

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalShippingData = sameAsBilling ? billingData : shippingData;
    console.log('Billing:', billingData);
    console.log('Shipping:', finalShippingData);
    if (onSubmit) {
      onSubmit({ billing: billingData, shipping: finalShippingData });
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header>
        <Modal.Title>Update Shipping Information</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Container className="details-container">
            <h5 className="mb-3">Billing Details</h5>

          {/* Name Fields */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="billingFirstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_first_name"
                  value={billingData.first_name || ''}
                  onChange={handleBillingChange}
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
              <Form.Group controlId="billingLastName">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_last_name"
                  value={billingData.last_name || ''}
                  onChange={handleBillingChange}
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

          {/* Address Breakdown */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="billingHouseNumber">
                <Form.Label>House / Apt</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_house_number"
                  value={billingData.house_number || ''}
                  onChange={handleBillingChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="billingStreetName">
                <Form.Label>Street Name</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_street_name"
                  value={billingData.street_name || ''}
                  onChange={handleBillingChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="billingCity">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_city"
                  value={billingData.city || ''}
                  onChange={handleBillingChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="billingProvince">
                <Form.Label>Province / Region</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_province"
                  value={billingData.province || ''}
                  onChange={handleBillingChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="billingCountry">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_country"
                  value={billingData.country || ''}
                  onChange={handleBillingChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="billingPostalCode">
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  type="text"
                  name="billing_postal_code"
                  value={billingData.postal_code || ''}
                  onChange={handleBillingChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="billingPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="billing_phone"
                    value={billingData.phone}
                    onChange={handleBillingChange}
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
                      checked={billingData.payment_method === "credit-card"}
                      onChange={handleBillingChange}
                    />

                    <Form.Check 
                      type="radio"
                      id="paypal"
                      label="PayPal"
                      name="payment_method"
                      value="paypal"
                      checked={billingData.payment_method === "paypal"}
                      onChange={handleBillingChange}
                    />

                    <Form.Check 
                      type="radio"
                      id="bank-transfer"
                      label="Bank Transfer"
                      name="payment_method"
                      value="bank-transfer"
                      checked={billingData.payment_method === "bank-transfer"}
                      onChange={handleBillingChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Check
              type="checkbox"
              label="Shipping address same as billing"
              checked={sameAsBilling}
              onChange={() => setSameAsBilling(!sameAsBilling)}
              className="mb-4"
            />

            {!sameAsBilling && (
              <>
                <h5 className="mb-3">Shipping Details</h5>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="shippingFirstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="shipping_first_name"
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
                  name="shipping_last_name"
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
                  name="shipping_house_number"
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
                  name="shipping_street_name"
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
                  name="shipping_city"
                  value={shippingData.city || ''}
                  onChange={handleShippingChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="shippingProvince">
                <Form.Label>Province / Region</Form.Label>
                <Form.Control
                  type="text"
                  name="shipping_province"
                  value={shippingData.province || ''}
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
                  name="shipping_country"
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
                  name="shipping_postal_code"
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
        </>
      )}
      </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className='continue-btn'>
            Continue
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CheckoutModal;
