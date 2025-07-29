import { Modal, Button } from 'react-bootstrap';
import '../styles/SuccessMsg.css';

export default function SuccessMsg({ show, message, onClose }) {
  const handleGoToCart = () => {
    onClose();
    window.location.href = '/cart'; // Redirect to cart page
  };

  return (
    <div className="success-msg-modal-wrapper">
      <Modal 
        show={show} 
        onHide={onClose} 
        centered 
        className="success-msg-modal"
        dialogClassName="success-msg-modal-dialog"
      >
        <Modal.Header className="success-msg-modal-header">
          <Modal.Title className="success-msg-modal-title">
            Successfully Added to the Cart
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="success-msg-modal-body">
          {message}
        </Modal.Body>
        <Modal.Footer className="success-msg-modal-footer">
          <Button 
            id="go-to-cart-btn" 
            className="go-to-cart-btn"
            onClick={handleGoToCart}
          >
            Go to Cart
          </Button>
          <Button 
            className="success-msg-btn" 
            onClick={onClose}
          >
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}