import React, { useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function LicenseModal({ show, onHide, company_code, onSuccess }) {
  const [categoryCount, setCategoryCount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/admin/license/add-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code,
          category_count: parseInt(categoryCount)
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onHide();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to update license');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal className='license-modal' show={show} onHide={onHide} size="sm" centered >  
      <Modal.Header closeButton>
        <Modal.Title>Update License</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Category Limit</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={categoryCount}
              onChange={(e) => setCategoryCount(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Set the maximum number of categories allowed
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update License'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
