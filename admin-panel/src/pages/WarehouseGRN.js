import React, { useContext, useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Modal, Table, Alert, Badge, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import '../styles/WarehouseGRN.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function WarehouseGRN() {
  const [searchPO, setSearchPO] = useState('');
  const [poResults, setPOResults] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPODetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [grnItems, setGRNItems] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [grnStatus, setGrnStatus] = useState('');
  const [showGRNHistory, setShowGRNHistory] = useState(false);
  const [grnHistory, setGrnHistory] = useState([]);

  // Modal form state
  const [modalForm, setModalForm] = useState({
    received_qty: '',
    location: '',
    notes: ''
  });
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;
  const warehouse_user_id = userData?.id;

  // Clear all states
  const clearAllStates = () => {
    setSearchPO('');
    setPOResults([]);
    setSelectedPO(null);
    setPODetails(null);
    setGRNItems([]);
    setBatchNumber('');
    setInvoiceNumber('');
    setGrnStatus('');
    setShowGRNHistory(false);
    setGrnHistory([]);
    setError('');
    setSuccess('');
  };

  // Search PO numbers
  const handleSearchPO = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    clearAllStates();

    try {
      const response = await fetch(`${BASE_URL}/api/admin/grn/search-po?company_code=${company_code}&po_number=${searchPO}`);
      const data = await response.json();
      
      if (data.success && data.purchase_orders && data.purchase_orders.length > 0) {
        setPOResults(data.purchase_orders);
        
        // If only one result, auto-select it
        if (data.purchase_orders.length === 1) {
          await handleSelectPO(data.purchase_orders[0].po_number);
        }
      } else {
        setError(data.message || 'No PO found matching the search criteria');
      }
    } catch (err) {
      setError('Error searching PO numbers');
    } finally {
      setLoading(false);
    }
  };

  // Select PO and fetch details
  const handleSelectPO = async (po_number) => {
    setSelectedPO(po_number);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Fetch PO details
      const response = await fetch(`${BASE_URL}/api/admin/grn/details/${po_number}`);
      const data = await response.json();
      
      if (data.success) {
        setPODetails(data);
        
        // Fetch GRN history
        const historyResponse = await fetch(`${BASE_URL}/api/admin/grn/grn-history/${po_number}?company_code=${company_code}`);
        const historyData = await historyResponse.json();
        
        if (historyData.success) {
          setGrnHistory(historyData.grn_history);
          setShowGRNHistory(historyData.grn_history.length > 0);
        }
        
        // Fetch remaining quantities for each item
        const itemsWithRemaining = await Promise.all(
          data.items.map(async (item) => {
            try {
              const remainingResponse = await fetch(`${BASE_URL}/api/admin/grn/get-remaining-qty?po_number=${po_number}&sku=${item.sku}`);
              const remainingData = await remainingResponse.json();
              
              if (remainingData.success) {
                return {
                  ...item,
                  ordered_qty: remainingData.ordered_qty,
                  max_qty: remainingData.max_qty,
                  tolerance_limit: remainingData.tolerance_limit,
                  total_received: remainingData.total_received,
                  remaining_qty: remainingData.remaining_qty
                };
              }
              return {
                ...item,
                ordered_qty: item.quantity,
                max_qty: item.quantity,
                tolerance_limit: 0,
                total_received: 0,
                remaining_qty: item.quantity
              };
            } catch {
              return {
                ...item,
                ordered_qty: item.quantity,
                max_qty: item.quantity,
                tolerance_limit: 0,
                total_received: 0,
                remaining_qty: item.quantity
              };
            }
          })
        );
        
        setPODetails(prev => ({ ...prev, items: itemsWithRemaining }));
      } else {
        setError(data.message || 'Failed to fetch PO details');
      }
    } catch (err) {
      setError('Error fetching PO details');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for item entry
  const handleItemClick = (item) => {
    if (item.remaining_qty <= 0) {
      setError(`SKU ${item.sku} has no remaining quantity to receive`);
      return;
    }
    
    setSelectedItem(item);
    setModalForm({
      received_qty: '',
      location: '',
      notes: ''
    });
    setModalError('');
    setShowModal(true);
  };

  // Handle modal form change
  const handleModalFormChange = (field, value) => {
    setModalForm(prev => ({ ...prev, [field]: value }));
    setModalError('');
  };

  // Validate and add GRN item
  const handleAddGRNItem = async () => {
    setModalError('');
    setModalLoading(true);

    const received_qty = parseInt(modalForm.received_qty);
    
    // Basic validation
    if (!received_qty || received_qty <= 0) {
      setModalError('Please enter a valid received quantity');
      setModalLoading(false);
      return;
    }

    if (received_qty > selectedItem.remaining_qty) {
      setModalError(`Cannot receive ${received_qty} items. Only ${selectedItem.remaining_qty} items remaining (Max allowed: ${selectedItem.max_qty}, Tolerance: ${selectedItem.tolerance_limit}%)`);
      setModalLoading(false);
      return;
    }

    try {
      // Validate with backend
      const validateResponse = await fetch(`${BASE_URL}/api/admin/grn/validate-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_number: selectedPO,
          sku: selectedItem.sku,
          received_qty: received_qty,
          company_code: company_code
        })
      });
      
      const validateData = await validateResponse.json();
      
      if (!validateData.success) {
        setModalError(validateData.message);
        setModalLoading(false);
        return;
      }

      // Check if item already exists in grnItems
      const existingIndex = grnItems.findIndex(item => item.sku === selectedItem.sku);
      
      if (existingIndex !== -1) {
        // Update existing item
        const updatedItems = [...grnItems];
        const newReceivedQty = updatedItems[existingIndex].received_qty + received_qty;
        
        if (newReceivedQty > selectedItem.remaining_qty) {
          setModalError(`Total received quantity (${newReceivedQty}) would exceed remaining quantity (${selectedItem.remaining_qty})`);
          setModalLoading(false);
          return;
        }
        
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          received_qty: newReceivedQty,
          location: modalForm.location || updatedItems[existingIndex].location,
          notes: modalForm.notes || updatedItems[existingIndex].notes
        };
        setGRNItems(updatedItems);
      } else {
        // Add new item
        const newGRNItem = {
          style_code: selectedItem.style_code,
          sku: selectedItem.sku,
          ordered_qty: selectedItem.ordered_qty,
          max_qty: selectedItem.max_qty,
          received_qty: received_qty,
          location: modalForm.location || '',
          notes: modalForm.notes || '',
          tolerance_limit: selectedItem.tolerance_limit
        };
        setGRNItems(prev => [...prev, newGRNItem]);
      }

      // Update remaining quantity in PO details
      const updatedPODetails = { ...poDetails };
      const itemIndex = updatedPODetails.items.findIndex(item => item.sku === selectedItem.sku);
      if (itemIndex !== -1) {
        updatedPODetails.items[itemIndex].remaining_qty -= received_qty;
      }
      setPODetails(updatedPODetails);

      setShowModal(false);
      setSuccess(`Added ${received_qty} units of SKU ${selectedItem.sku} to GRN`);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setModalError('Error validating GRN item');
    } finally {
      setModalLoading(false);
    }
  };

  // Edit GRN item
  const handleEditGRNItem = (index) => {
    const item = grnItems[index];
    const poItem = poDetails.items.find(pi => pi.sku === item.sku);
    
    setSelectedItem({
      ...poItem,
      remaining_qty: poItem.remaining_qty + item.received_qty // Add back the current received qty
    });
    
    setModalForm({
      received_qty: item.received_qty.toString(),
      location: item.location,
      notes: item.notes
    });
    
    // Remove the item from grnItems temporarily
    setGRNItems(prev => prev.filter((_, i) => i !== index));
    
    // Restore remaining quantity in PO details
    const updatedPODetails = { ...poDetails };
    const itemIndex = updatedPODetails.items.findIndex(pi => pi.sku === item.sku);
    if (itemIndex !== -1) {
      updatedPODetails.items[itemIndex].remaining_qty += item.received_qty;
    }
    setPODetails(updatedPODetails);
    
    setModalError('');
    setShowModal(true);
  };

  // Delete GRN item
  const handleDeleteGRNItem = (index) => {
    const item = grnItems[index];
    
    // Restore remaining quantity in PO details
    const updatedPODetails = { ...poDetails };
    const itemIndex = updatedPODetails.items.findIndex(pi => pi.sku === item.sku);
    if (itemIndex !== -1) {
      updatedPODetails.items[itemIndex].remaining_qty += item.received_qty;
    }
    setPODetails(updatedPODetails);
    
    // Remove item from grnItems
    setGRNItems(prev => prev.filter((_, i) => i !== index));
    setSuccess(`Removed SKU ${item.sku} from GRN`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Submit GRN
  const handleSubmitGRN = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (grnItems.length === 0) {
      setError('Please add at least one item to the GRN');
      setLoading(false);
      return;
    }

    if (!batchNumber.trim()) {
      setError('Please enter a batch number');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        po_number: selectedPO,
        grn_items: grnItems,
        warehouse_user_id: warehouse_user_id,
        company_code: company_code,
        received_date: new Date().toISOString(),
        batch_number: batchNumber,
        invoice_number: invoiceNumber
      };

      const response = await fetch(`${BASE_URL}/api/admin/grn/create-grn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`GRN created successfully! GRN ID: ${data.grn_id}`);
        setGrnStatus(data.status || '');
        
        // Reset form
        setGRNItems([]);
        setBatchNumber('');
        setInvoiceNumber('');
        
        // Refresh PO details to show updated remaining quantities
        await handleSelectPO(selectedPO);
        
        setTimeout(() => {
          setSuccess('');
          setGrnStatus('');
        }, 5000);
      } else {
        setError(data.message || 'Failed to create GRN');
      }
    } catch (err) {
      setError('Error creating GRN');
    } finally {
      setLoading(false);
    }
  };

  // Calculate GRN totals
  const calculateTotals = () => {
    return grnItems.reduce((acc, item) => {
      acc.totalItems += 1;
      acc.totalQty += item.received_qty;
      return acc;
    }, { totalItems: 0, totalQty: 0 });
  };

  const totals = calculateTotals();

  return (
    <Container fluid>
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search PO Section */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearchPO}>
            <Row className="g-3 align-items-end">
              <Col lg={4} md={6}>
                <Form.Group>
                  <Form.Label>Search PO Number</Form.Label>
                  <Form.Control 
                    type="text"
                    value={searchPO}
                    onChange={e => setSearchPO(e.target.value)}
                    placeholder="Enter PO number"
                    required
                  />
                </Form.Group>
              </Col>
              <Col lg={2} md={6}>
                <Button 
                  type="submit" 
                  className="w-100" 
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : 'Search'}
                </Button>
              </Col>
              <Col lg={2} md={6}>
                <Button 
                  variant="secondary" 
                  className="w-100" 
                  onClick={clearAllStates}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* PO Results Selection */}
      {poResults.length > 1 && (
        <Card className="mb-4">
          <Card.Header>
            <h6>Select Purchase Order</h6>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier ID</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {poResults.map((po) => (
                  <tr key={po.po_number}>
                    <td>{po.po_number}</td>
                    <td>{po.supplier_id}</td>
                    <td>{new Date(po.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => handleSelectPO(po.po_number)}
                        disabled={loading}
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* PO Details and GRN Processing */}
      {poDetails && (
        <>
          <Card className="mb-4">
            <Card.Header>
              <Row>
                <Col>
                  <h5>PO Details: {poDetails.header.po_number}</h5>
                  <div>Supplier: {poDetails.header.supplier_name}</div>
                  <div>Status: <Badge variant="info">{poDetails.header.status}</Badge></div>
                  <div>Tolerance Limit: <Badge variant="warning">{poDetails.header.tolerance_limit || 0}%</Badge></div>
                </Col>
                <Col xs="auto">
                  {showGRNHistory && (
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => setShowGRNHistory(!showGRNHistory)}
                    >
                      {showGRNHistory ? 'Hide' : 'Show'} GRN History ({grnHistory.length})
                    </Button>
                  )}
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {/* GRN History */}
              {showGRNHistory && grnHistory.length > 0 && (
                <div className="mb-4">
                  <h6>Previous GRN Records</h6>
                  {grnHistory.map((grn) => (
                    <Card key={grn.grn_id} className="mb-2" style={{ fontSize: '0.9em' }}>
                      <Card.Body className="py-2">
                        <Row>
                          <Col>
                            <strong>{grn.grn_id}</strong> - {new Date(grn.received_date).toLocaleDateString()}
                            <Badge variant="secondary" className="ms-2">{grn.status}</Badge>
                          </Col>
                          <Col xs="auto">
                            Batch: {grn.batch_number} | Items: {grn.items.length}
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}

              {/* Batch and Invoice Info */}
              <Form className="mb-3">
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Batch Number *</Form.Label>
                      <Form.Control
                        type="text"
                        value={batchNumber}
                        onChange={e => setBatchNumber(e.target.value)}
                        placeholder="Enter batch number"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Invoice Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={invoiceNumber}
                        onChange={e => setInvoiceNumber(e.target.value)}
                        placeholder="Enter invoice number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <div className="mt-4 pt-2">
                      <div><strong>Items to receive: {totals.totalItems}</strong></div>
                      <div><strong>Total quantity: {totals.totalQty}</strong></div>
                    </div>
                  </Col>
                </Row>
              </Form>

              {/* PO Items Table */}
              <h6>Click on items to add to GRN:</h6>
              <Table striped bordered hover responsive className="mb-4">
                <thead>
                  <tr>
                    <th>Style Code</th>
                    <th>SKU</th>
                    <th>Ordered Qty</th>
                    <th>Max Qty (with tolerance)</th>
                    <th>Total Received</th>
                    <th>Remaining Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {poDetails.items.map((item) => {
                    const canReceive = item.remaining_qty > 0;
                    return (
                      <tr 
                        key={item.sku}
                        className={canReceive ? 'table-row-clickable' : 'table-row-disabled'}
                        onClick={() => canReceive && handleItemClick(item)}
                        style={{ cursor: canReceive ? 'pointer' : 'not-allowed' }}
                      >
                        <td>{item.style_code}</td>
                        <td>{item.sku}</td>
                        <td>{item.ordered_qty}</td>
                        <td>
                          {item.max_qty}
                          {item.tolerance_limit > 0 && (
                            <small className="text-muted"> (+{item.tolerance_limit}%)</small>
                          )}
                        </td>
                        <td>{item.total_received || 0}</td>
                        <td>
                          <Badge variant={canReceive ? 'success' : 'secondary'}>
                            {item.remaining_qty}
                          </Badge>
                        </td>
                        <td>
                          {item.remaining_qty === 0 ? (
                            <Badge variant="success">Complete</Badge>
                          ) : item.total_received > 0 ? (
                            <Badge variant="warning">Partial</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Added GRN Items */}
          {grnItems.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h6>Items Added to GRN ({grnItems.length} items, {totals.totalQty} total quantity)</h6>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Style Code</th>
                      <th>SKU</th>
                      <th>Ordered Qty</th>
                      <th>Received Qty</th>
                      <th>Location</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grnItems.map((item, index) => (
                      <tr key={`${item.sku}-${index}`}>
                        <td>{item.style_code}</td>
                        <td>{item.sku}</td>
                        <td>{item.ordered_qty}</td>
                        <td><Badge variant="primary">{item.received_qty}</Badge></td>
                        <td>{item.location}</td>
                        <td>{item.notes}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-2"
                            onClick={() => handleEditGRNItem(index)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteGRNItem(index)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    {grnStatus && (
                      <Badge variant="info" className="fs-6">
                        Current Status: {grnStatus}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="success"
                    onClick={handleSubmitGRN}
                    disabled={loading || grnItems.length === 0 || !batchNumber.trim()}
                  >
                    {loading ? <Spinner size="sm" className="me-2" /> : null}
                    Submit GRN ({grnItems.length} items)
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* GRN Item Entry Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Add Item to GRN - {selectedItem?.sku}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Style Code:</strong> {selectedItem.style_code}</p>
                  <p><strong>SKU:</strong> {selectedItem.sku}</p>
                  <p><strong>Ordered Quantity:</strong> {selectedItem.ordered_qty}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Max Allowed:</strong> {selectedItem.max_qty} 
                    {selectedItem.tolerance_limit > 0 && (
                      <small className="text-muted"> (with {selectedItem.tolerance_limit}% tolerance)</small>
                    )}
                  </p>
                  <p><strong>Already Received:</strong> {selectedItem.total_received || 0}</p>
                  <p><strong>Remaining:</strong> <Badge variant="success">{selectedItem.remaining_qty}</Badge></p>
                </Col>
              </Row>

              {modalError && (
                <Alert variant="danger">{modalError}</Alert>
              )}

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Received Quantity *</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max={selectedItem.remaining_qty}
                        value={modalForm.received_qty}
                        onChange={e => handleModalFormChange('received_qty', e.target.value)}
                        placeholder={`Max: ${selectedItem.remaining_qty}`}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        value={modalForm.location}
                        onChange={e => handleModalFormChange('location', e.target.value)}
                        placeholder="Storage location"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={modalForm.notes}
                    onChange={e => handleModalFormChange('notes', e.target.value)}
                    placeholder="Additional notes (optional)"
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddGRNItem}
            disabled={modalLoading || !modalForm.received_qty}
          >
            {modalLoading ? <Spinner size="sm" className="me-2" /> : null}
            Add to GRN
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}