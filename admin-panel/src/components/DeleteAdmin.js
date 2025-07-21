import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function DeleteAdmin({ adminId, onDeleteSuccess }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/delete-admin/${adminId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShow(false);
        onDeleteSuccess();  // callback to parent to refresh list or navigate
      } else {
        setError(data.message || 'Delete failed');
      }
    } catch (e) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button variant="danger" onClick={() => setShow(true)} aria-label="Delete admin">
        <i className="bi-trash"></i>
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center text-danger">
            <ExclamationTriangleFill size={24} className="me-2" />
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-center">
          {error && <p className="text-danger fw-bold">{error}</p>}
          <p className="fs-5 fw-semibold">
            Are you sure you want to <span className="text-danger">delete</span> this admin?
          </p>
          <p className="text-muted small">
            This action cannot be undone.
          </p>
        </Modal.Body>

        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={() => setShow(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default DeleteAdmin;
