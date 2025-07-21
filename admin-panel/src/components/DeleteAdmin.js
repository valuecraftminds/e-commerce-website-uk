import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

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
      <Button variant="danger" style={{ height: '45px' }} onClick={() => setShow(true)}>
        Delete
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title >Confirm Delete</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <p className="text-danger">{error}</p>}
          Are you sure you want to delete this admin?
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => setShow(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default DeleteAdmin;
