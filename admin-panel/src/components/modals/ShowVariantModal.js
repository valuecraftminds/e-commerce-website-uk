import React, { useState } from 'react';
import { Modal, Table, Button, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function ShowVariantModal({
  show,
  onHide,
  selectedStyle,
  styleVariants,
  variantQuantities,
  setVariantQuantities,
  handleAddVariant,
  handleAddVariantsBatch // optional: for batch add
}) {
  const [localVariants, setLocalVariants] = useState([]);

  React.useEffect(() => {
    setLocalVariants(styleVariants);
  }, [styleVariants]);

  // Set quantity for all
  const handleSetAllQuantities = (qty) => {
    const newQuantities = { ...variantQuantities };
    localVariants.forEach(v => {
      newQuantities[v.sku] = qty;
    });
    setVariantQuantities(newQuantities);
  };

  // Remove variant from modal
  const handleRemoveVariant = (sku) => {
    setLocalVariants(localVariants.filter(v => v.sku !== sku));
    // Optionally remove quantity
    const newQuantities = { ...variantQuantities };
    delete newQuantities[sku];
    setVariantQuantities(newQuantities);
  };

  // Add all variants with quantity > 0
  const handleAddAll = () => {
    const variantsToAdd = localVariants.filter(variant => {
      const qty = parseInt(variantQuantities[variant.sku]);
      return qty && qty > 0;
    });
    if (handleAddVariantsBatch) {
      handleAddVariantsBatch(variantsToAdd);
    } else {
      variantsToAdd.forEach(variant => handleAddVariant(variant));
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Variants for Style: {selectedStyle?.label}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3 d-flex align-items-center gap-2">
          <InputGroup style={{ maxWidth: 250 }}>
            <Form.Control
              type="number"
              min={1}
              placeholder="Set quantity for all"
              onChange={e => handleSetAllQuantities(e.target.value)}
            />
            <Button variant="outline-primary" onClick={handleAddAll}>
              Add All to PO
            </Button>
          </InputGroup>
        </div>
        <div className="table-responsive">
          <Table bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Color</th>
                <th>Size</th>
                <th>Fit</th>
                <th>Material</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localVariants.map((variant, idx) => (
                <tr key={variant.sku}>
                  <td>{idx + 1}</td>
                  <td>{variant.sku}</td>
                  <td>{variant.color_name}</td>
                  <td>{variant.size_name}</td>
                  <td>{variant.fit_name}</td>
                  <td>{variant.material_name}</td>
                  <td>${parseFloat(variant.unit_price || 0).toFixed(2)}</td>
                  <td>
                    <Form.Control
                      type="number"
                      min={1}
                      value={variantQuantities[variant.sku] || ''}
                      onChange={e => setVariantQuantities({ ...variantQuantities, [variant.sku]: e.target.value })}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td className="d-flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleAddVariant(variant)} title="Add">
                      <FaPlus />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleRemoveVariant(variant.sku)} title="Remove">
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
