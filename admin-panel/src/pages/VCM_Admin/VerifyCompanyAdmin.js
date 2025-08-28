import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function VerifyCompanyAdmin() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('pending'); // 'pending', 'success', 'error'
  const [message, setMessage] = useState('');

  const calledRef = useRef(false);
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }
    const verify = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/auth/verify-company-admin?token=${token}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified and admin account created successfully.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };
    verify();
  }, [searchParams]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: 500, width: '100%', padding: 24 }}>
        <Card.Body>
          <h2 className="mb-4 text-center">Email Verification</h2>
          {status === 'pending' && (
            <div className="text-center">
              <Spinner animation="border" />
              <div className="mt-3">Verifying your email, please wait...</div>
            </div>
          )}
          {status === 'success' && (
            <Alert variant="success" className="text-center">
              <div>{message}</div>
              <Button href="/login" variant="primary" className="mt-3">Go to Login</Button>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="danger" className="text-center">
              <div>{message}</div>
              <Button href="/" variant="secondary" className="mt-3">Go Home</Button>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
