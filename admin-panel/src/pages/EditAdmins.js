import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner, Row, Col, Card, Container } from 'react-bootstrap';

export default function EditAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: ''
  });

  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8081/api/admin/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log(formData);

          setFormData({
            name: data.admin.name,
            email: data.admin.email,
            phone_number: data.admin.phone_number,
            role: data.admin.role
          });
        } else {
          setErrorMsg(data.message || 'Admin not found');
        }
      })
      .catch(() => {
        setErrorMsg('Server error loading admin.');
      });
  }, [id]);

  const handleNameChange = (e) => {
    let value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, name: value }));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    setFormData(prev => ({ ...prev, phone_number: value }));

    if (value && !value.startsWith('07')) {
      setPhoneError('Phone number must start with 07');
    } else if (value.length > 0 && value.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (phoneError) {
      setErrorMsg('Please fix phone number before submitting.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`http://localhost:8081/api/editAdmin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number,
          role: formData.role
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('Admin updated successfully!');
        setTimeout(() => navigate('/dashboard/users'), 1500);
      } else {
        setErrorMsg(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      setErrorMsg('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-container">
      <Container>
        <Card className="edit-card p-4 mt-4 shadow-sm">

          <Button
            variant="primary"
            className="mb-3 btn-custom-primary"
            onClick={() => navigate('/dashboard/users')}
          >
            ← Back
          </Button>

          <Card.Body>
            <h2 className="edit-title text-center mb-4">Edit Admin</h2>

            {successMsg && <Alert variant="success" className="text-center">{successMsg}</Alert>}
            {errorMsg && <Alert variant="danger" className="text-center">{errorMsg}</Alert>}

            <Form className="edit-form" onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleNameChange}
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
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handlePhoneChange}
                      isInvalid={!!phoneError}
                      inputMode="numeric"
                      maxLength="10"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {phoneError}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="pdc">PDC</option>
                      <option value="warehouse_grn">Warehouse GRN</option>
                      <option value="warehouse_issuing">Warehouse Issuing</option>
                      <option value="order">Ordering</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <div className="text-center">
                <Button type="submit" className="edit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Admin'
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

