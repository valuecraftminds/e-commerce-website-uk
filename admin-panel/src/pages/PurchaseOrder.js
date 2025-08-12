import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap';
import { FaDownload, FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/PurchaseOrder.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function PurchaseOrder() {
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPoDetails] = useState(null);
  const [filter, setFilter] = useState({
    po_number: '',
    supplier_id: '',
    from_date: '',
    to_date: ''
  });
  const [formData, setFormData] = useState({
    attention: '',
    supplier_id: '',
    remark: '',
    status: 'Pending'
  });
  const [currentSku, setCurrentSku] = useState('');
  const [skuDetails, setSkuDetails] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0); // Add separate unit price state
  const [poItems, setPoItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug logging
  const logDebug = (message, data = null) => {
    console.log(`[PO Component] ${message}`, data || '');
  };

  // Fetch initial data
  useEffect(() => {
    if (userData?.company_code) {
      logDebug('Component mounted, fetching initial data');
      fetchPurchaseOrders();
      fetchSuppliers();
    } else {
      logDebug('No company_code available in userData', userData);
    }
  }, [userData?.company_code]);

  const fetchPurchaseOrders = async () => {
    try {
      logDebug('Fetching purchase orders with filters', filter);
      const params = { company_code: userData?.company_code, ...filter };
      logDebug('Request params', params);
      
      const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-orders`, { params });
      logDebug('Purchase orders response', response.data);
      
      setPurchaseOrders(response.data.purchase_orders || []);
    } catch (error) {
      logDebug('Error fetching purchase orders', error);
      console.error('Error fetching purchase orders:', error);
      setError(`Error fetching purchase orders: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchSuppliers = async () => {
    try {
      logDebug('Fetching suppliers');
      const response = await axios.get(`${BASE_URL}/api/admin/suppliers/get-suppliers`, {
        params: { company_code: userData?.company_code }
      });
      logDebug('Suppliers response', response.data);
      
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      logDebug('Error fetching suppliers', error);
      console.error('Error fetching suppliers:', error);
      setError(`Error fetching suppliers: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchPODetails = async (po_number) => {
    try {
      logDebug('Fetching PO details for', po_number);
      const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-order-details/${po_number}`);
      logDebug('PO details response', response.data);
      
      setPoDetails(response.data);
    } catch (error) {
      logDebug('Error fetching PO details', error);
      console.error('Error fetching PO details:', error);
      alert(`Error fetching purchase order details: ${error.response?.data?.message || error.message}`);
    }
  };

  // Load SKU options for dropdown
  const loadSkuOptions = async (inputValue) => {
    try {
      logDebug('Loading SKU options for input', inputValue);
      
      if (!inputValue || inputValue.length < 2) {
        return [];
      }
      
      const response = await axios.get(`${BASE_URL}/api/admin/styles/search-variants`, {
        params: { 
          search: inputValue,
          company_code: userData?.company_code 
        }
      });
      
      logDebug('SKU search response', response.data);
      
      const options = (response.data.variants || []).map(v => ({
        value: v.sku,
        label: `${v.sku} - ${v.style_name || 'Unknown Style'} (${v.color_name || 'Unknown Color'}, ${v.size_name || 'Unknown Size'})`,
        ...v,
        unit_price: parseFloat(v.unit_price) || 0 // Ensure unit_price is a number
      }));
      
      logDebug('Formatted SKU options', options);
      return options;
    } catch (error) {
      logDebug('Error loading SKUs', error);
      console.error('Error loading SKUs:', error);
      return [];
    }
  };

  // Update SKU search in modal
  const handleSkuChange = (selected) => {
    logDebug('SKU changed', selected);
    setSkuDetails(selected);
    setCurrentSku(selected?.value || '');
    setUnitPrice(parseFloat(selected?.unit_price) || 0); // Set unit price separately
    setError(''); // Clear any previous errors
  };

  const validateItem = (item) => {
    if (!item.sku) {
      return 'SKU is required';
    }
    if (!item.quantity || item.quantity <= 0) {
      return 'Valid quantity is required';
    }
    if (item.unit_price === undefined || item.unit_price === null || item.unit_price < 0) {
      return 'Valid unit price is required (must be 0 or greater)';
    }
    return null;
  };

  const handleAddItem = () => {
    logDebug('Adding item', { skuDetails, quantity, unitPrice });
    
    if (!skuDetails) {
      setError('Please select a SKU');
      return;
    }

    const finalUnitPrice = unitPrice > 0 ? unitPrice : 0; // Allow 0 price
    const finalQuantity = parseInt(quantity) || 1;

    const newItem = {
      sku: skuDetails.sku || skuDetails.value,
      style_name: skuDetails.style_name || 'Unknown Style',
      color_name: skuDetails.color_name || 'Unknown Color',
      size_name: skuDetails.size_name || 'Unknown Size',
      fit_name: skuDetails.fit_name || 'Unknown Fit',
      material_name: skuDetails.material_name || 'Unknown Material',
      quantity: finalQuantity,
      unit_price: finalUnitPrice,
      total_price: finalQuantity * finalUnitPrice,
      company_code: userData?.company_code
    };

    // Validate the item
    const validation = validateItem(newItem);
    if (validation) {
      setError(validation);
      return;
    }

    logDebug('New item to add', newItem);

    // Check if SKU already exists in items
    const existingIndex = poItems.findIndex(item => item.sku === newItem.sku);
    
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...poItems];
      updatedItems[existingIndex].quantity += newItem.quantity;
      updatedItems[existingIndex].total_price = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_price;
      setPoItems(updatedItems);
      logDebug('Updated existing item', updatedItems[existingIndex]);
    } else {
      // Add new item
      setPoItems([...poItems, newItem]);
      logDebug('Added new item to list');
    }

    // Reset form fields
    setCurrentSku('');
    setSkuDetails(null);
    setQuantity(1);
    setUnitPrice(0);
    setError('');
  };

  const handleRemoveItem = (index) => {
    logDebug('Removing item at index', index);
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleEditPO = (po) => {
    navigate(`/merchandising/po/${po.po_number}?mode=edit`);
  };

  const handleViewDetails = (po_number) => {
    navigate(`/merchandising/po/${po_number}?mode=view`);
  };

  const handleDownloadPO = async (po_number) => {
    try {
      logDebug('Downloading PO PDF', po_number);
      setIsLoading(true);
      
      const response = await axios.get(
        `${BASE_URL}/api/admin/po/download-purchase-order/${po_number}?company_code=${userData?.company_code}`,
        {
          responseType: 'blob', // Important for file download
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO-${po_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      logDebug('PDF download completed');
    } catch (error) {
      logDebug('Error downloading PDF', error);
      console.error('Error downloading PDF:', error);
      alert(`Error downloading PDF: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (po_number) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;

    logDebug('Deleting PO', po_number);
    setIsLoading(true);
    
    try {
      const response = await axios.delete(`${BASE_URL}/api/admin/po/delete-purchase-orders/${po_number}`);
      logDebug('Delete response', response.data);
      
      if (response.data.success) {
        alert('Purchase order deleted successfully');
        fetchPurchaseOrders();
      } else {
        alert(`Delete failed: ${response.data.message}`);
      }
    } catch (error) {
      logDebug('Delete error', error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Error deleting purchase order: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.supplier_id) {
      return 'Please select a supplier';
    }
    if (!formData.attention?.trim()) {
      return 'Please enter attention field';
    }
    if (poItems.length === 0) {
      return 'Please add at least one item';
    }
    
    // Validate each item
    for (let i = 0; i < poItems.length; i++) {
      const validation = validateItem(poItems[i]);
      if (validation) {
        return `Item ${i + 1}: ${validation}`;
      }
    }
    
    return null;
  };

  const handleSubmit = async (poData) => {
    setError('');
    setIsLoading(true);

    try {
      let response;
      if (isEditing && selectedPO) {
        response = await axios.put(
          `${BASE_URL}/api/admin/po/update-purchase-orders/${selectedPO.po_number}`, 
          poData
        );
      } else {
        response = await axios.post(`${BASE_URL}/api/admin/po/create-purchase-order`, poData);
      }

      if (response.data.success) {
        const message = isEditing ? 'Purchase Order updated successfully' : 'Purchase Order created successfully';
        alert(message);
        resetForm();
        fetchPurchaseOrders();
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    logDebug('Resetting form');
    setShowModal(false);
    setPoItems([]);
    setSelectedPO(null);
    setIsEditing(false);
    setFormData({
      attention: '',
      supplier_id: '',
      remark: '',
      status: 'Pending'
    });
    setCurrentSku('');
    setSkuDetails(null);
    setQuantity(1);
    setUnitPrice(0);
    setError('');
  };

  return (
    <div className="purchase-order-container">
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Alert variant="info">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Processing...
          </div>
        </Alert>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label>PO Number</Form.Label>
              <Form.Control
                type="text"
                value={filter.po_number}
                onChange={e => setFilter({...filter, po_number: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Supplier</Form.Label>
              <Form.Select
                value={filter.supplier_id}
                onChange={e => setFilter({...filter, supplier_id: e.target.value})}
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={filter.from_date}
                onChange={e => setFilter({...filter, from_date: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={filter.to_date}
                onChange={e => setFilter({...filter, to_date: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button onClick={fetchPurchaseOrders} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Purchase Orders Table */}
      <div className="table-container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Purchase Orders ({purchaseOrders.length})</h5>
          <Button 
            onClick={() => navigate('/merchandising/po/new?mode=create')}
            disabled={isLoading}
          >
            Create PO
          </Button>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Total Quantity</th>
              <th>Total Styles</th>
              <th>Total Cost</th>
              <th>Tolerance Limit (%)</th>
              <th>Status</th>
              <th>GRN</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  {isLoading ? 'Loading...' : 'No purchase orders found'}
                </td>
              </tr>
            ) : (
              purchaseOrders.map(po => (
                <tr key={po.po_number}>
                  <td>{po.po_number}</td>
                  <td>{po.supplier_name || 'Unknown Supplier'}</td>
                  <td>{po.total_quantity || 0}</td>
                  <td>{po.total_styles || 0}</td>
                  <td>
                    {po.total_cost ||"0.00"}
                  </td>
                  <td>{po.tolerance_limit !== undefined ? po.tolerance_limit : 0}</td>
                  <td>
                    <span className={`badge ${po.status === 'Pending' ? 'bg-warning text-dark' : 
                      po.status === 'Approved' ? 'bg-success' : 'bg-secondary'}`}>
                      {po.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className='badge bg-warning text-dark'>
                      {'Pending'}
                    </span>
                  </td>
                  <td>{new Date(po.created_at).toLocaleDateString()}</td>
                  <td>
                    <FaEye
                      className="action-icon me-2 text-primary"
                      onClick={() => handleViewDetails(po.po_number)}
                      title="View Details"
                      style={{ cursor: 'pointer' }}
                    />
                    <FaEdit
                      className="action-icon me-2 text-warning"
                      onClick={() => handleEditPO(po)}
                      title="Edit"
                      style={{ cursor: 'pointer' }}
                    />
                    <FaDownload
                      className="action-icon me-2 text-success"
                      onClick={() => handleDownloadPO(po.po_number)}
                      title="Download PDF"
                      style={{ cursor: 'pointer' }}
                    />
                    <FaTrash
                      className="action-icon text-danger"
                      onClick={() => handleDelete(po.po_number)}
                      title="Delete"
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}