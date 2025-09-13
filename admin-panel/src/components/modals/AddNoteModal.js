// import React, { useState } from 'react';
// import { Modal, Button, Form } from 'react-bootstrap';

// const AddNoteModal = ({ show, onClose, onSave, initialValue }) => {
//   const [note, setNote] = useState(initialValue || '');

//   const handleSave = () => {
//     onSave(note);
//     onClose();
//   };

//   return (
//     <Modal show={show} onHide={onClose} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Add Note</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form.Group>
//           <Form.Label>Note</Form.Label>
//           <Form.Control
//             as="textarea"
//             rows={4}
//             value={note}
//             onChange={e => setNote(e.target.value)}
//             placeholder="Enter note for this item..."
//             autoFocus
//           />
//         </Form.Group>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onClose}>
//           Cancel
//         </Button>
//         <Button variant="primary" onClick={handleSave}>
//           Save Note
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default AddNoteModal;
