import React, { useEffect, useState, useRef } from 'react';
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function VerifyCustomerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    
    const token = searchParams.get('token');
    
    if (!token) {
      setMessage('Invalid verification link. No token provided.');
      setIsLoading(false);
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${BASE_URL}/api/customer/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setIsSuccess(true);
      } else {
        setMessage(data.message || 'Verification failed. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage('Something went wrong during verification. Please try again later.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa', 
      display: 'flex', 
      alignItems: 'center', 
      paddingTop: '2rem', 
      paddingBottom: '2rem' 
    }}>
      <Container>
        <div className="d-flex justify-content-center">
          <Card style={{ maxWidth: '600px', width: '100%', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <Card.Body className="text-center p-5">
              <h2 className="mb-4" style={{ color: '#2c3e50', fontWeight: '600' }}>
                Email Verification
              </h2>
              
              {isLoading ? (
                <div className="py-4">
                  <Spinner 
                    animation="border" 
                    variant="primary" 
                    className="mb-3" 
                    style={{ width: '3rem', height: '3rem' }}
                  />
                  <p className="text-muted fs-5">Verifying your email address...</p>
                  <p className="text-muted">Please wait while we confirm your account.</p>
                </div>
              ) : (
                <div className="py-3">
                  <div className="mb-4">
                    {isSuccess ? (
                      <FaCheckCircle 
                        size={60} 
                        color="#28a745" 
                        className="mb-3"
                      />
                    ) : (
                      <FaTimesCircle 
                        size={60} 
                        color="#dc3545" 
                        className="mb-3"
                      />
                    )}
                  </div>
                  
                  <Alert 
                    variant={isSuccess ? 'success' : 'danger'} 
                    className="mb-4"
                    style={{ 
                      fontSize: '1.1rem',
                      padding: '1rem 1.5rem',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    {message}
                  </Alert>
                  
                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                    {isSuccess ? (
                      <>
                        <Button 
                          variant="primary" 
                          size="lg"
                          onClick={() => navigate('/login')}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        >
                          Login to Your Account
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="lg"
                          onClick={() => navigate('/')}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        >
                          Go to Home
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="primary" 
                          size="lg"
                          onClick={() => navigate('/register')}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        >
                          Try Register Again
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="lg"
                          onClick={() => navigate('/login')}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        >
                          Go to Login
                        </Button>
                      </>
                    )}
                  </div>

                  {isSuccess && (
                    <div className="mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <h6 className="text-muted mb-2">What's Next?</h6>
                      <p className="text-muted mb-0 small">
                        Your account is now verified! You can log in and start exploring our products.
                      </p>
                    </div>
                  )}

                  {!isSuccess && (
                    <div className="mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <h6 className="text-muted mb-2">Need Help?</h6>
                      <p className="text-muted mb-0 small">
                        If you continue to have issues, please contact our support team or try registering again with a different email address.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}
