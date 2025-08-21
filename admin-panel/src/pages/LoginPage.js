import { useContext, useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/LoginPage.css';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save user data along with token
        const userData = {
          id: data.user.id,
          company_code: data.user.company_code,
          name: data.user.name,
          phone_number: data.user.phone_number,
          email: data.user.email,
          role: data.user.role,
          side_bar_options: data.user.side_bar_options || []
        };
        console.log('User Data:', userData);
        login(data.token, userData);
        const role = data.user.role;

        // Navigate based on role
        // Map role to dashboard path
        const dashboardMap = {
          VCM_Admin: '/vcm-admin-dashboard',
          Company_Admin: '/dashboard',
          // Add more mappings as needed
        };
        if (dashboardMap[role]) {
          navigate(dashboardMap[role]);
        } else if (role && role.toLowerCase().includes('dashboard')) {
          // If role is a dashboard path, use it directly
          navigate(`/${role}`);
        } else if (role && role !== 'VCM_Admin' && role !== 'Company_Admin') {
           navigate(`/dashboard`);
        } else {
          setErrorMsg('Unknown user role. Please contact administrator.');
        }
      } else {
        setErrorMsg(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-container">
      <Container>
        <Card className="login-card mx-auto">
          <Card.Body>
            <h1 className="login-title">Welcome Back</h1>
            
            {errorMsg && (
              <Alert variant="danger" className="text-center">
                {errorMsg}
              </Alert>
            )}

            <Form className="login-form" onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="email">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label htmlFor="password">Password</Form.Label>
                <Form.Control
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </Form.Group>

              <Button 
                type="submit" 
                className="login-btn w-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}



