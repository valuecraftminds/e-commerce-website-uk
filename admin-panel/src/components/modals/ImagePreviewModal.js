import React from 'react';
import { Modal } from 'react-bootstrap';

import '../../styles/ImagePreviewModal.css';

const ImagePreviewModal = ({ show, onHide, previewImage, setError }) => (
  <Modal 
    show={!!previewImage} 
    onHide={onHide} 
    centered 
    size="lg"
    className="image-preview-modal"
  >
    <Modal.Header closeButton>
      <Modal.Title>Measure Guide Image</Modal.Title>
    </Modal.Header>
    <Modal.Body className='preview-image-modal-body'>
      {previewImage && (
        <img 
          src={previewImage} 
          alt="Measure Guide Preview" 
          className='preview-image-modal'
          onError={(e) => {
            console.error('Preview image failed to load:', previewImage);
            if (setError) setError('Failed to load image preview');
          }}
        />
      )}
    </Modal.Body>
    {/* <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Close
      </Button>
    </Modal.Footer> */}
  </Modal>
);

export default ImagePreviewModal;