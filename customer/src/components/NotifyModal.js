import { Modal, Button } from 'react-bootstrap';
import '../styles/NotifyModal.css';

export default function NotifyModal({ show, message, onClose }) {
  const handleGoToCart = () => {
    onClose();
    window.location.href = '/cart';
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
        {/* <Modal.Header className="success-msg-modal-header">
          <Modal.Title className="success-msg-modal-title">
            Successfully Added to the Cart
          </Modal.Title>
        </Modal.Header> */}
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

// import { Modal, Button } from 'react-bootstrap';
// import '../styles/NotifyModal.css';

// export default function NotifyModal({ show, message, onClose, type = 'success', title, showGoToCart = false }) {
//   const handleGoToCart = () => {
//     onClose();
//     window.location.href = '/cart'; // Redirect to cart page
//   };

//   // Define modal configurations based on type
//   const getModalConfig = () => {
//     switch (type) {
//       case 'cart-success':
//         return {
//           title: title || 'Successfully Added to the Cart',
//           className: 'success-msg-modal',
//           headerClassName: 'success-msg-modal-header',
//           titleClassName: 'success-msg-modal-title',
//           bodyClassName: 'success-msg-modal-body',
//           footerClassName: 'success-msg-modal-footer',
//           showGoToCart: true
//         };
//       case 'success':
//         return {
//           title: title || 'Success',
//           className: 'success-msg-modal',
//           headerClassName: 'success-msg-modal-header',
//           titleClassName: 'success-msg-modal-title',
//           bodyClassName: 'success-msg-modal-body',
//           footerClassName: 'success-msg-modal-footer',
//           showGoToCart: false
//         };
//       case 'warning':
//         return {
//           title: title || 'Warning',
//           className: 'warning-msg-modal',
//           headerClassName: 'warning-msg-modal-header',
//           titleClassName: 'warning-msg-modal-title',
//           bodyClassName: 'warning-msg-modal-body',
//           footerClassName: 'warning-msg-modal-footer',
//           showGoToCart: false
//         };
//       case 'error':
//         return {
//           title: title || 'Error',
//           className: 'error-msg-modal',
//           headerClassName: 'error-msg-modal-header',
//           titleClassName: 'error-msg-modal-title',
//           bodyClassName: 'error-msg-modal-body',
//           footerClassName: 'error-msg-modal-footer',
//           showGoToCart: false
//         };
//       case 'info':
//         return {
//           title: title || 'Information',
//           className: 'info-msg-modal',
//           headerClassName: 'info-msg-modal-header',
//           titleClassName: 'info-msg-modal-title',
//           bodyClassName: 'info-msg-modal-body',
//           footerClassName: 'info-msg-modal-footer',
//           showGoToCart: false
//         };
//       default:
//         return {
//           title: title || 'Notification',
//           className: 'success-msg-modal',
//           headerClassName: 'success-msg-modal-header',
//           titleClassName: 'success-msg-modal-title',
//           bodyClassName: 'success-msg-modal-body',
//           footerClassName: 'success-msg-modal-footer',
//           showGoToCart: false
//         };
//     }
//   };

//   const config = getModalConfig();
//   const shouldShowGoToCart = showGoToCart || config.showGoToCart;

//   return (
//     <div className="notify-modal-wrapper">
//       <Modal 
//         show={show} 
//         onHide={onClose} 
//         centered 
//         className={config.className}
//         dialogClassName={`${config.className}-dialog`}
//       >
//         <Modal.Header className={config.headerClassName}>
//           <Modal.Title className={config.titleClassName}>
//             {config.title}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body className={config.bodyClassName}>
//           {message}
//         </Modal.Body>
//         <Modal.Footer className={config.footerClassName}>
//           {shouldShowGoToCart && (
//             <Button 
//               id="go-to-cart-btn" 
//               className="go-to-cart-btn"
//               onClick={handleGoToCart}
//             >
//               Go to Cart
//             </Button>
//           )}
//           <Button 
//             className={`${type}-msg-btn`} 
//             onClick={onClose}
//           >
//             {type === 'warning' ? 'OK' : 'Done'}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// }