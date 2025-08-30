import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import PoVariantsModal from '../components/modals/PoVariantsModal';
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
  // Style/variant selection states
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [styleVariants, setStyleVariants] = useState([]);
  const [variantQuantities, setVariantQuantities] = useState({});
  const [formData, setFormData] = useState({
    attention: '',
    supplier_id: '',
    remark: '',
    status: 'Pending',
    tolerance_limit: 0,
    delivery_date: ''
  });
  // Removed unused skuOptions state
  const [isLoading, setIsLoading] = useState(false);
  const [poDetails, setPoDetails] = useState(null);

  // Add defaultStyles state for initial loading
  const [defaultStyles, setDefaultStyles] = useState([]);

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
          const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-order-details/${po_number}`, {
            params: { company_code: userData?.company_code }
          });
          
          if (response.data.success) {
            if (isViewing) {
              // For view mode, fetch available stock for each item
              const itemsWithStock = await Promise.all(
                (response.data.items || []).map(async item => {
                  try {
                    const stockRes = await axios.get(`${BASE_URL}/api/admin/stock/get-stock-summary`, {
                      params: {
                        company_code: userData?.company_code,
                        style_number: item.style_number,
                        sku: item.sku
                      }
                    });
                    return {
                      ...item,
                      available_stock_qty: stockRes.data?.stock_qty ?? '-'
                    };
                  } catch {
                    return {
                      ...item,
                      available_stock_qty: '-'
                    };
                  }
                })
              );
              setPoDetails({ ...response.data, items: itemsWithStock });
            } else {
              setFormData({
                attention: response.data.header.attention || '',
                supplier_id: response.data.header.supplier_id?.toString() || '',
                remark: response.data.header.remark || '',
                status: response.data.header.status || 'Pending',
                tolerance_limit: response.data.header.tolerance_limit || 0,
                delivery_date: response.data.header.delivery_date ? response.data.header.delivery_date.slice(0, 10) : ''
              });
              
              const formattedItems = await Promise.all(
                (response.data.items || []).map(async item => {
                  // Always fetch available stock from backend endpoint
                  try {
                    const stockRes = await axios.get(`${BASE_URL}/api/admin/stock/get-stock-summary`, {
                      params: {
                        company_code: userData?.company_code,
                        style_number: item.style_number,
                        sku: item.sku
                      }
                    });
                    return {
                      ...item,
                      available_stock_qty: stockRes.data?.stock_qty ?? '-',
                      quantity: parseInt(item.quantity) || 0,
                      unit_price: parseFloat(item.unit_price) || 0,
                      total_price: parseFloat(item.total_price) || 0,
                      company_code: userData?.company_code
                    };
                  } catch {
                    return {
                      ...item,
                      available_stock_qty: '-',
                      quantity: parseInt(item.quantity) || 0,
                      unit_price: parseFloat(item.unit_price) || 0,
                      total_price: parseFloat(item.total_price) || 0,
                      company_code: userData?.company_code
                    };
                  }
                })
              );
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

  // Load initial styles when component mounts
  useEffect(() => {
    const loadInitialStyles = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/styles/get-styles`, {
          params: { company_code: userData?.company_code }
        });
        if (res.data.success) {
          setDefaultStyles(res.data.styles.map(style => ({
            value: style.style_number,
            label: `${style.style_number} - ${style.name}`,
            ...style
          })));
        }
      } catch (error) {
        // ignore
      }
    };
    if (userData?.company_code) {
      loadInitialStyles();
    }
  }, [userData?.company_code]);

  // Improved loadSkuOptions function
  // Style number search
  const loadStyleOptions = async (inputValue) => {
    try {
      if (!inputValue) return defaultStyles;
      const res = await axios.get(`${BASE_URL}/api/admin/styles/get-styles`, {
        params: { company_code: userData?.company_code, search: inputValue }
      });
      if (res.data.success) {
        return res.data.styles.map(style => ({
          value: style.style_number,
          label: `${style.style_number} - ${style.name}`,
          ...style
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // Improved handleSkuSelect function
  // When a style is selected, fetch its variants and show modal
  const handleStyleSelect = async (selectedOption) => {
    setSelectedStyle(selectedOption);
    setVariantQuantities({});
    if (selectedOption) {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/styles/get-style-variants/${selectedOption.value}`, {
          params: { company_code: userData?.company_code }
        });
        if (res.data.success) {
          // Always fetch available stock for each variant from backend endpoint
          const variantsWithStock = await Promise.all(
            res.data.variants.map(async (variant) => {
              try {
                const stockRes = await axios.get(`${BASE_URL}/api/admin/stock/get-stock-summary`, {
                  params: {
                    company_code: userData?.company_code,
                    style_number: variant.style_number,
                    sku: variant.sku
                  }
                });
                return {
                  ...variant,
                  available_stock_qty: stockRes.data?.stock_qty ?? '-'
                };
              } catch {
                return {
                  ...variant,
                  available_stock_qty: '-'
                };
              }
            })
          );
          setStyleVariants(variantsWithStock);
        } else {
          setStyleVariants([]);
        }
      } catch {
        setStyleVariants([]);
      }
      setShowVariantModal(true);
    } else {
      setShowVariantModal(false);
      setStyleVariants([]);
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
  // Add variant to PO items from modal
  const handleAddVariant = (variant) => {
    const quantity = parseInt(variantQuantities[variant.sku] || 0);
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity for the variant.');
      return;
    }
    const newItem = {
      sku: variant.sku,
      style_name: selectedStyle?.name || variant.style_name || 'Unknown Style',
      color_name: variant.color_name || 'Unknown Color',
      size_name: variant.size_name || 'Unknown Size',
      fit_name: variant.fit_name || 'Unknown Fit',
      material_name: variant.material_name || 'Unknown Material',
      quantity,
      unit_price: parseFloat(variant.unit_price || 0),
      total_price: quantity * parseFloat(variant.unit_price || 0),
      company_code: userData?.company_code,
      available_stock_qty: variant.available_stock_qty
    };
    const validation = validateItem(newItem);
    if (validation) {
      setError(validation);
      return;
    }
    const existingItemIndex = poItems.findIndex(item => item.sku === newItem.sku);
    if (existingItemIndex !== -1) {
      // Update quantity and total price
      const updatedItems = [...poItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;
      updatedItems[existingItemIndex].available_stock_qty = variant.available_stock_qty;
      setPoItems(updatedItems);
    } else {
      setPoItems([...poItems, newItem]);
    }
    setVariantQuantities({ ...variantQuantities, [variant.sku]: '' });
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
        delivery_date: formData.delivery_date || null,
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

  // View mode is now handled by ViewPurchaseOrder.js. This page only supports create and edit modes.
  if (isViewing) {
    return null;
  }

  return (
    <Container fluid className="p-4">
      <Card className='mb-3'>
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
      </Card>

      {/* Header Information Card */}
      <Card className="mb-4">
        <Card.Header>
          <h4>Header Information</h4>
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
                <Form.Group controlId="formDeliveryDate">
                  <Form.Label>Delivery Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.delivery_date}
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    disabled={isViewing}
                    required
                  />
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
          </Form>
        </Card.Body>
      </Card>

      {/* Product Information Card */}
      <Card>
        <Card.Header>
          <h4>Product Information</h4>
        </Card.Header>
        <Card.Body>
          {/* Style Number Search Section for Create/Edit modes */}
          {(isCreating || isEditing) && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Search Style Number <span className="text-danger">*</span></Form.Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions={defaultStyles}
                    loadOptions={loadStyleOptions}
                    value={selectedStyle}
                    onChange={handleStyleSelect}
                    placeholder="Type to search style number..."
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
                      !inputValue ? "Type to search styles..." :
                      inputValue.length < 2 ? "Type at least 2 characters..." :
                      "No styles found"
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          {/* Variant Modal as component */}
          <PoVariantsModal
            show={showVariantModal}
            onHide={() => setShowVariantModal(false)}
            selectedStyle={selectedStyle}
            styleVariants={styleVariants}
            variantQuantities={variantQuantities}
            setVariantQuantities={setVariantQuantities}
            handleAddVariant={handleAddVariant}
            handleAddVariantsBatch={(variants) => {
              // Add all variants to PO items in one go
              let updatedItems = [...poItems];
              let errorMsg = '';
              variants.forEach(variant => {
                const quantity = parseInt(variantQuantities[variant.sku] || 0);
                if (!quantity || quantity <= 0) return;
                const newItem = {
                  sku: variant.sku,
                  style_name: selectedStyle?.name || variant.style_name || 'Unknown Style',
                  color_name: variant.color_name || 'Unknown Color',
                  size_name: variant.size_name || 'Unknown Size',
                  fit_name: variant.fit_name || 'Unknown Fit',
                  material_name: variant.material_name || 'Unknown Material',
                  quantity,
                  unit_price: parseFloat(variant.unit_price || 0),
                  total_price: quantity * parseFloat(variant.unit_price || 0),
                  company_code: userData?.company_code
                };
                const validation = validateItem(newItem);
                if (validation) {
                  errorMsg = validation;
                  return;
                }
                const existingItemIndex = updatedItems.findIndex(item => item.sku === newItem.sku);
                if (existingItemIndex !== -1) {
                  updatedItems[existingItemIndex].quantity += quantity;
                  updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;
                } else {
                  updatedItems.push(newItem);
                }
              });
              setPoItems(updatedItems);
              setError(errorMsg);
              // Optionally clear all quantities after add
              setVariantQuantities({});
            }}
          />

          <Row className="mb-3">
            <Col>
              <h6>Items</h6>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SKU</th>
                      <th>Style</th>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Fit</th>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>Available Stock</th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                      <th>Actions</th>
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
                          {isViewing ? (
                            item.quantity
                          ) : (
                            <Form.Control
                              type="number"
                              value={item.quantity}
                              min={1}
                              onChange={e => {
                                const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                const updatedItems = poItems.map(i =>
                                  i.sku === item.sku
                                    ? { ...i, quantity: newQuantity, total_price: newQuantity * i.unit_price }
                                    : i
                                );
                                setPoItems(updatedItems);
                              }}
                              style={{ width: 80 }}
                            />
                          )}
                        </td>
                        <td>{item.available_stock_qty !== undefined && item.available_stock_qty !== null ? item.available_stock_qty : '-'}</td>
                        <td>${(item.unit_price).toFixed(2)}</td>
                        <td>${(item.total_price).toFixed(2)}</td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleRemoveItem(item.sku)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-info">
                      <th colSpan="10" className="text-end">Total:</th>
                      <th>${(poItems.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0) || 0).toFixed(2)}</th>
                      <th></th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Action Buttons at the bottom of the page */}
      <div className="d-flex justify-content-end mt-4">
        {!isViewing && (
          <Button variant="primary" type="submit" className="me-2" disabled={isLoading} onClick={handleSubmit}>
            {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate('/merchandising/po')} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </Container>
  );
}
