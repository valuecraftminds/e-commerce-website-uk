import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { po_number } = useParams();
  const [searchParams] = useSearchParams();
  const { userData } = useContext(AuthContext);
  
  const mode = searchParams.get('mode') || (po_number === 'new' ? 'create' : 'view');
  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const isCreating = mode === 'create' || po_number === 'new';

  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [poItems, setPoItems] = useState([]);
  const [skuDetails, setSkuDetails] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [formData, setFormData] = useState({
    attention: '',
    supplier_id: '',
    remark: '',
    status: 'Pending',
    tolerance_limit: 0
  });
  // Removed unused skuOptions state
  const [isLoading, setIsLoading] = useState(false);
  const [poDetails, setPoDetails] = useState(null);

  // Add defaultSKUs state for initial loading
  const [defaultSKUs, setDefaultSKUs] = useState([]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/suppliers/get-suppliers`, {
          params: { company_code: userData?.company_code }
        });
        setSuppliers(response.data.suppliers || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setError('Error fetching suppliers');
      }
    };

    if (userData?.company_code) {
      fetchSuppliers();
    }
  }, [userData?.company_code]);

  // Load data for edit/view modes
  useEffect(() => {
    const loadPOData = async () => {
      if ((isEditing || isViewing) && po_number) {
        setIsLoading(true);
        try {
          const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-order-details/${po_number}`);
          
          if (response.data.success) {
            if (isViewing) {
              setPoDetails(response.data);
            } else {
              setFormData({
                attention: response.data.header.attention || '',
                supplier_id: response.data.header.supplier_id?.toString() || '',
                remark: response.data.header.remark || '',
                status: response.data.header.status || 'Pending',
                tolerance_limit: response.data.header.tolerance_limit || 0
              });
              
              const formattedItems = (response.data.items || []).map(item => ({
                sku: item.sku,
                style_name: item.style_name || 'Unknown Style',
                color_name: item.color_name || 'Unknown Color',
                size_name: item.size_name || 'Unknown Size',
                fit_name: item.fit_name || 'Unknown Fit',
                material_name: item.material_name || 'Unknown Material',
                quantity: parseInt(item.quantity) || 0,
                unit_price: parseFloat(item.unit_price) || 0,
                total_price: parseFloat(item.total_price) || 0,
                company_code: userData?.company_code
              }));
              
              setPoItems(formattedItems);
            }
          } else {
            setError('Failed to load purchase order details');
          }
        } catch (error) {
          setError(`Error loading purchase order: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPOData();
  }, [isEditing, isViewing, po_number, userData?.company_code]);

  // Load initial SKUs when component mounts
  useEffect(() => {
    const loadInitialSKUs = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/styles/search-variants`, {
          params: {
            company_code: userData?.company_code,
            limit: 100 // Load first 100 SKUs
          }
        });

        const options = (response.data.variants || []).map(v => ({
          value: v.sku,
          label: `${v.sku} - ${v.style_name || 'Unknown Style'} (${v.color_name || 'Unknown Color'}, ${v.size_name || 'Unknown Size'})`,
          ...v,
          unit_price: parseFloat(v.unit_price) || 0
        }));

        setDefaultSKUs(options);
        // Removed setSkuOptions as skuOptions is not used
      } catch (error) {
        console.error('Error loading initial SKUs:', error);
      }
    };

    if (userData?.company_code) {
      loadInitialSKUs();
    }
  }, [userData?.company_code]);

  // Improved loadSkuOptions function
  const loadSkuOptions = async (inputValue) => {
    try {
      if (!inputValue) {
        return defaultSKUs;
      }

      if (inputValue.length < 2) {
        return [];
      }

      const response = await axios.get(`${BASE_URL}/api/admin/styles/search-variants`, {
        params: {
          search: inputValue,
          company_code: userData?.company_code
        }
      });

      const options = (response.data.variants || []).map(v => ({
        value: v.sku,
        label: `${v.sku} - ${v.style_name || 'Unknown Style'} (${v.color_name || 'Unknown Color'}, ${v.size_name || 'Unknown Size'})`,
        ...v,
        unit_price: parseFloat(v.unit_price) || 0
      }));

      return options;
    } catch (error) {
      console.error('Error loading SKUs:', error);
      return [];
    }
  };

  // Improved handleSkuSelect function
  const handleSkuSelect = (selectedOption) => {
    if (selectedOption) {
      setSkuDetails(selectedOption);
      setUnitPrice(selectedOption.unit_price);
      setError(''); // Clear any previous errors
    } else {
      setSkuDetails(null);
      setUnitPrice(0);
    }
  };

  // Add validateItem function
  const validateItem = (item) => {
    if (!item.sku) return 'SKU is required';
    if (!item.quantity || item.quantity <= 0) return 'Valid quantity is required';
    if (item.unit_price < 0) return 'Unit price must be 0 or greater';
    return null;
  };

  // Improved handleAddItem function
  const handleAddItem = () => {
    if (!skuDetails) {
      setError('Please select a SKU');
      return;
    }

    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (unitPrice < 0) {
      setError('Unit price must be 0 or greater');
      return;
    }

    const newItem = {
      sku: skuDetails.sku || skuDetails.value,
      style_name: skuDetails.style_name || 'Unknown Style',
      color_name: skuDetails.color_name || 'Unknown Color',
      size_name: skuDetails.size_name || 'Unknown Size',
      fit_name: skuDetails.fit_name || 'Unknown Fit',
      material_name: skuDetails.material_name || 'Unknown Material',
      quantity: parseInt(quantity),
      unit_price: parseFloat(unitPrice),
      total_price: parseInt(quantity) * parseFloat(unitPrice),
      company_code: userData?.company_code
    };

    // Validate the item
    const validation = validateItem(newItem);
    if (validation) {
      setError(validation);
      return;
    }

    const existingItemIndex = poItems.findIndex(item => item.sku === newItem.sku);
    if (existingItemIndex !== -1) {
      // Update existing item - add quantities
      const updatedItems = [...poItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        total_price: (updatedItems[existingItemIndex].quantity + newItem.quantity) * updatedItems[existingItemIndex].unit_price
      };
      setPoItems(updatedItems);
    } else {
      // Add new item
      setPoItems([...poItems, newItem]);
    }

    // Reset form fields
    setSkuDetails(null);
    setQuantity(1);
    setUnitPrice(0);
    setError('');
  };

  const handleRemoveItem = (sku) => {
    setPoItems(poItems.filter(item => item.sku !== sku));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const poData = {
        company_code: userData.company_code,
        supplier_id: parseInt(formData.supplier_id),
        attention: formData.attention.trim(),
        remark: formData.remark ? formData.remark.trim() : '',
        status: formData.status || 'Pending',
        tolerance_limit: parseFloat(formData.tolerance_limit) || 0,
        items: poItems.map(item => ({
          sku: item.sku,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          company_code: userData.company_code
        }))
      };

      let response;
      if (isEditing) {
        response = await axios.put(`${BASE_URL}/api/admin/po/update-purchase-orders/${po_number}`, poData);
      } else {
        response = await axios.post(`${BASE_URL}/api/admin/po/create-purchase-order`, poData);
      }

      if (response.data.success) {
        const message = isEditing ? 'Purchase Order updated successfully' : 'Purchase Order created successfully';
        alert(message);
        navigate('/merchandising/po');
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isViewing && poDetails) {
    return (
      <Container fluid className="p-4">
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h4>Purchase Order Details - {po_number}</h4>
            <Button variant="outline-secondary" onClick={() => navigate('/merchandising/po')}>
              <FaArrowLeft className="me-2" />
              Back to List
            </Button>
          </Card.Header>
          <Card.Body>
            <Row className="mb-4">
              <Col md={6}>
                <h6>Header Information</h6>
                <Table bordered size="sm">
                  <tbody>
                    <tr><th>PO Number:</th><td>{poDetails.header.po_number}</td></tr>
                    <tr><th>Supplier:</th><td>{poDetails.header.supplier_name}</td></tr>
                    <tr><th>Attention:</th><td>{poDetails.header.attention}</td></tr>
                    <tr><th>Tolerance Limit (%):</th><td>{poDetails.header.tolerance_limit}</td></tr>
                    <tr>
                      <th>Status:</th>
                      <td>
                        <span className={`badge ${poDetails.header.status === 'Pending' ? 'bg-warning text-dark' : 
                          poDetails.header.status === 'Approved' ? 'bg-success' : 'bg-secondary'}`}>
                          {poDetails.header.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Summary</h6>
                <Table bordered size="sm">
                  <tbody>
                    <tr><th>Total Items:</th><td>{poDetails.items ? poDetails.items.length : 0}</td></tr>
                    <tr><th>Total Quantity:</th><td>{poDetails.items ? poDetails.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) : 0}</td></tr>
                    <tr><th>Total Amount:</th><td>${(poDetails.total_amount || 0).toFixed(2)}</td></tr>
                    <tr><th>Created Date:</th><td>{new Date(poDetails.header.created_at).toLocaleDateString()}</td></tr>
                  </tbody>
                </Table>
              </Col>
            </Row>

            {poDetails.header.remark && (
              <Row className="mb-3">
                <Col>
                  <h6>Remarks</h6>
                  <p className="bg-light p-2 rounded">{poDetails.header.remark}</p>
                </Col>
              </Row>
            )}

            <Row>
              <Col>
                <h6>Items</h6>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>#</th><th>SKU</th><th>Style</th><th>Color</th><th>Size</th><th>Fit</th><th>Material</th><th>Quantity</th><th>Unit Price</th><th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(poDetails.items || []).map((item, index) => (
                        <tr key={item.item_id || index}>
                          <td>{index + 1}</td>
                          <td>{item.sku}</td>
                          <td>{item.style_name || 'N/A'}</td>
                          <td>{item.color_name || 'N/A'}</td>
                          <td>{item.size_name || 'N/A'}</td>
                          <td>{item.fit_name || 'N/A'}</td>
                          <td>{item.material_name || 'N/A'}</td>
                          <td>{item.quantity}</td>
                          <td>${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                          <td>${parseFloat(item.total_price || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-info">
                        <th colSpan="9" className="text-end">Total:</th>
                        <th>${(poDetails.total_amount || 0).toFixed(2)}</th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>
            {isCreating ? 'Create Purchase Order' :
             isEditing ? `Edit Purchase Order: ${po_number}` :
             `Purchase Order Details - ${po_number}`}
          </h4>
          <Button variant="outline-secondary" onClick={() => navigate('/merchandising/po')}>
            <FaArrowLeft className="me-2" />
            Back to List
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="formSupplier">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Select
                    value={formData.supplier_id}
                    onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                    disabled={isViewing}
                    required
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.supplier_id} value={supplier.supplier_id}>
                        {supplier.supplier_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="formAttention">
                  <Form.Label>Attention</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.attention}
                    onChange={e => setFormData({ ...formData, attention: e.target.value })}
                    placeholder="Enter attention name"
                    disabled={isViewing}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="formStatus">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    disabled={isViewing}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formToleranceLimit">
                  <Form.Label>Tolerance Limit (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={100}
                    value={formData.tolerance_limit}
                    onChange={e => setFormData({ ...formData, tolerance_limit: e.target.value })}
                    placeholder="Enter tolerance %"
                    disabled={isViewing}
                  />
                  <Form.Text className="text-muted">
                    Allowed range: 0 - 100
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formRemark">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.remark}
                    onChange={e => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Enter remarks"
                    disabled={isViewing}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Add SKU Selection Section for Create/Edit modes */}
            {(isCreating || isEditing) && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search SKU <span className="text-danger">*</span></Form.Label>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions={defaultSKUs}
                        loadOptions={loadSkuOptions}
                        value={skuDetails}
                        onChange={handleSkuSelect}
                        placeholder="Type to search SKU..."
                        isClearable
                        isSearchable
                        menuPlacement="auto"
                        styles={{
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
                            color: state.isSelected ? 'white' : '#212529'
                          })
                        }}
                        noOptionsMessage={({ inputValue }) => 
                          !inputValue ? "Type to search SKUs..." : 
                          inputValue.length < 2 ? "Type at least 2 characters..." : 
                          "No SKUs found"
                        }
                        formatOptionLabel={option => (
                          <div>
                            <strong>{option.value}</strong>
                            <div style={{ fontSize: '0.8em' }}>
                              Style: {option.style_name} | Color: {option.color_name} | Size: {option.size_name}
                            </div>
                          </div>
                        )}
                      />
                    </Form.Group>
                  </Col>
                  {skuDetails && (
                    <>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>Unit Price</Form.Label>
                          <Form.Control
                            type="number"
                            value={unitPrice}
                            onChange={e => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                            step="0.01"
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button 
                          variant="primary" 
                          onClick={handleAddItem} 
                          disabled={!skuDetails || quantity <= 0}
                          className="w-100"
                        >
                          Add Item
                        </Button>
                      </Col>
                    </>
                  )}
                </Row>

                {skuDetails && (
                  <Row className="mb-3">
                    <Col>
                      <div className="bg-light p-3 rounded">
                        <h6>Selected SKU Details:</h6>
                        <Row>
                          <Col md={3}><strong>Style:</strong> {skuDetails.style_name}</Col>
                          <Col md={3}><strong>Color:</strong> {skuDetails.color_name}</Col>
                          <Col md={3}><strong>Size:</strong> {skuDetails.size_name}</Col>
                          <Col md={3}><strong>Fit:</strong> {skuDetails.fit_name}</Col>
                        </Row>
                        <Row className="mt-2">
                          <Col md={6}><strong>Material:</strong> {skuDetails.material_name}</Col>
                          <Col md={6}><strong>Catalog Price:</strong> ${parseFloat(skuDetails.unit_price || 0).toFixed(2)}</Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                )}
              </>
            )}

            <Row className="mb-3">
              <Col>
                <h6>Items</h6>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>#</th><th>SKU</th><th>Style</th><th>Color</th><th>Size</th><th>Fit</th><th>Material</th><th>Quantity</th><th>Unit Price</th><th>Total Price</th>
                        {isEditing && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((item, index) => (
                        <tr key={item.sku}>
                          <td>{index + 1}</td>
                          <td>{item.sku}</td>
                          <td>{item.style_name}</td>
                          <td>{item.color_name}</td>
                          <td>{item.size_name}</td>
                          <td>{item.fit_name}</td>
                          <td>{item.material_name}</td>
                          <td>
                            <Form.Control
                              type="number"
                              value={item.quantity}
                              onChange={e => {
                                const newQuantity = Math.max(1, parseInt(e.target.value));
                                const updatedItems = poItems.map(i => i.sku === item.sku ? { ...i, quantity: newQuantity, total_price: newQuantity * i.unit_price } : i);
                                setPoItems(updatedItems);
                              }}
                              disabled={isViewing}
                              min={1}
                            />
                          </td>
                          <td>
                            ${(item.unit_price).toFixed(2)}
                          </td>
                          <td>${(item.total_price).toFixed(2)}</td>
                          {isEditing && (
                            <td>
                              <Button variant="danger" size="sm" onClick={() => handleRemoveItem(item.sku)} disabled={isViewing}>
                                <FaTrash />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-info">
                        <th colSpan="8" className="text-end">Total:</th>
                        <th>${(poItems.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0) || 0).toFixed(2)}</th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              {!isViewing && (
                <Button variant="success" type="submit" className="me-2" disabled={isLoading}>
                  {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => navigate('/merchandising/po')} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
