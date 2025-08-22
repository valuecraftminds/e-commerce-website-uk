


import { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';

import '../../styles/DeleteModal.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Reusable DeleteModal for any entity and API endpoint.
 * Props:
 * - id: (optional) id of the entity to delete
 * - show: boolean, modal visibility
 * - onHide: function, called to close modal
 * - deleteUrl: string | function, endpoint or function returning endpoint (should include :id or use id param)
 * - entityLabel: string, label for entity (default 'item')
 * - modalTitle: string, custom modal title
 * - confirmMessage: string, custom confirmation message
 * - onDeleteSuccess: function, called after successful delete (optional)
 * - onDeleteError: function, called after failed delete (optional)
 * - requestOptions: object, extra fetch options (optional)
 */
function DeleteModal({
  id = null,
  show = false,
  onHide = () => {},
  deleteUrl,
  entityLabel = 'item',
  modalTitle,
  confirmMessage,
  onDeleteSuccess,
  onDeleteError,
  requestOptions = {},
  ...rest
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) setError('');
  }, [show]);

  // Flexible delete URL builder
  const getDeleteUrl = () => {
    if (!deleteUrl) return '';
    if (typeof deleteUrl === 'function') {
      return deleteUrl(id);
    }
    if (id && deleteUrl.includes(':id')) {
      return deleteUrl.replace(':id', id);
    }
    return deleteUrl;
  };

  // Generalized delete handler
  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const url = getDeleteUrl();
      if (!url) throw new Error('Delete URL not provided');
      const res = await fetch(url.startsWith('http') ? url : `${BASE_URL}${url}`, {
        method: 'DELETE',
        ...requestOptions,
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (res.ok && (data.success !== false)) {
        if (onDeleteSuccess) onDeleteSuccess(id, data);
        onHide();
      } else {
        setError(data.message || 'Delete failed');
        if (onDeleteError) onDeleteError(data);
      }
    } catch (e) {
      setError(e.message || 'Server error');
      if (onDeleteError) onDeleteError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="delete-modal-sm"
      {...rest}
    >
      <Modal.Body className="text-center p-4" >
        <div className="d-flex flex-column align-items-center justify-content-center mb-2">
          <span
            style={{
              background: '#fff3cd',
              borderRadius: '50%',
              padding: 16,
              display: 'inline-flex',
              marginBottom: 12,
              border: '2px solid #ffe69c',
            }}
          >
            <ExclamationTriangleFill size={38} color="#f59e42" />
          </span>
          <h5 className="fw-bold text-danger mb-2" style={{ fontSize: '1.2rem' }}>
            {modalTitle || 'Delete Confirmation'}
          </h5>
        </div>
        {error && <div className="text-danger fw-bold small mb-2">{error}</div>}
        <div className="mb-2">
          <span className="fw-semibold">
            {confirmMessage || (
              <>
                Are you sure you want to <span className="text-danger">delete</span> this {entityLabel}?
              </>
            )}
          </span>
        </div>
        <div className="text-muted small mb-3">This action cannot be undone.</div>
        <div className="d-flex gap-2 justify-content-center">
          <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default DeleteModal;
