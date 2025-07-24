import { Modal, Button } from 'react-bootstrap';

import '../styles/SuccessMsg.css';

export default function SuccessMsg({ show, message, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Successfully Added to the Cart</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button className='btn-success' onClick={onClose}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// export default function SuccessMsg({ show, message, onClose, type = 'success' }) {
//   const isError = type === 'error';

//   return (
//     <Modal show={show} onHide={onClose} centered>
//       <Modal.Header closeButton className={isError ? 'modal-header-error' : 'modal-header-success'}>
//         <Modal.Title>
//           {isError ? 'Error Occurred' : 'Successfully Added to the Cart'}
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body className={isError ? 'modal-body-error' : 'modal-body-success'}>
//         {message}
//       </Modal.Body>
//       <Modal.Footer>
//         <Button className={isError ? 'btn-danger' : 'btn-success'} onClick={onClose}>
//           {isError ? 'Close' : 'Done'}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }
