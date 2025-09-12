import React, { useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { ChromePicker } from 'react-color';
import ntc from 'ntcjs';

import '../../styles/ColorPickerModal.css';

const ColorPickerModal = ({ showColorPicker, setShowColorPicker, formData, setFormData }) => {
  return (
    <Modal 
      show={showColorPicker} 
      onHide={() => setShowColorPicker(false)}
      className='color-picker-modal'
    >
      <Modal.Header closeButton>
        <Modal.Title>Select a Color</Modal.Title>
      </Modal.Header>
        <Modal.Body className='cp-modal-body'>
          <ChromePicker
            color={formData.color_code || '#000000'}
            onChange={color => {
              const ntcResult = ntc.name(color.hex);
              setFormData({
                ...formData,
                color_code: color.hex,
                color_name: ntcResult[1]
              });
            }}
            disableAlpha
            className='chrome-picker'
          />
          {/* color preview */}
          <div className="mt-3">
            <span 
              style={{ 
                display: 'inline-block',
                width: '100%', 
                height: 40, 
                background: formData.color_code, 
                border: '1px solid #ccc' 
              }}>
            </span>

            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <strong>Color Name: </strong>
              {useMemo(() => {
                if (!formData.color_code) return '-';
                const ntcResult = ntc.name(formData.color_code);
                return ntcResult[1];
              }, [formData.color_code])} 
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowColorPicker(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
};

export default ColorPickerModal;
