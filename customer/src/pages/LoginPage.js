import React, { useContext, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { FaFacebookF, FaGoogle, FaTwitter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import '../styles/LoginPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${BASE_URL}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code: COMPANY_CODE,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.token, data.user);
        navigate('/');
        console.log('Login successful:', data);
        console.log('token:', data.token);
        
      } else {
        setErrorMsg(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrorMsg('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Container fluid="xl">
        <Card className="login-card">
          <Card.Body className="p-3 p-md-5">
            <h2 className="login-title">Welcome</h2>

            {errorMsg && (
              <Alert variant="danger" className="text-center">
                {errorMsg}
              </Alert>
            )}

            <Row>
              <Col lg={8} md={12}>
                <Form className="login-form" onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      required
                    />
                  </Form.Group>

                  {/* <Form.Group className="mb-4">
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className="password-input"
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />} 
                      </Button>
                    </InputGroup>
                  </Form.Group> */}
                  <Form.Group className="mb-4" style={{ position: "relative" }}>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="password-input"
                      style={{ paddingRight: "40px" }} // Space for the button
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </Form.Group>
                  <div className="d-flex justify-content-center">
                    <Button 
                      type="submit" 
                      className="login-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </div>
                </Form>
              </Col>

              <Col lg={4} md={12} className="d-flex flex-column justify-content-center align-items-center mt-4 mt-lg-0">
                <div className="text-center mb-4">
                  <p className="mb-3">Or sign in with</p>
                  <div className="social-login-buttons">
                    <Button variant="link" className="social-btn google">
                      <FaGoogle />
                    </Button>
                    <Button variant="link" className="social-btn facebook">
                      <FaFacebookF />
                    </Button>
                    <Button variant="link" className="social-btn twitter">
                      <FaTwitter />
                    </Button>
                  </div>
                  <div className="mt-4 sign-up-wrapper">
                    <p className="sign-up-text mb-0">
                      Don't have an account?{' '}
                      <span className="sign-up-link" onClick={() => navigate('/register')}>
                        Sign Up
                      </span>
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}