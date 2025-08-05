import React, { useState } from 'react';
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
            {/* Billing Inputs */}
            <Row className="mb-3">
              <Col>
                <Form.Group controlId="billingFullName">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={billingData.fullName}
                    onChange={handleBillingChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <Form.Group controlId="billingAddress">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={billingData.address}
                    onChange={handleBillingChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="billingCity">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={billingData.city}
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
                    name="postalCode"
                    value={billingData.postalCode}
                    onChange={handleBillingChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="billingCountry">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={billingData.country}
                    onChange={handleBillingChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="billingPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={billingData.phone}
                    onChange={handleBillingChange}
                    required
                  />
                </Form.Group>
              </Col>

            {/* Payment Method */}
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
                  <Col>
                    <Form.Group controlId="shippingFullName">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={shippingData.fullName}
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Group controlId="shippingAddress">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={shippingData.address}
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="shippingCity">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={shippingData.city}
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
                        name="postalCode"
                        value={shippingData.postalCode}
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="shippingCountry">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        name="country"
                        value={shippingData.country}
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
