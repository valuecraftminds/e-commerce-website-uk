import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';
import { AuthContext } from '../context/AuthContext';
import '../styles/PurchaseOrder.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function PurchaseOrder() {
  const { userData } = useContext(AuthContext);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
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
    items: []
  });
  const [currentSku, setCurrentSku] = useState('');
  const [skuDetails, setSkuDetails] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [poItems, setPoItems] = useState([]);
  const [currentPoNumber, setCurrentPoNumber] = useState(null);
  const [variants, setVariants] = useState([]);

  // Fetch initial data
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, [userData?.company_code]);

  const fetchPurchaseOrders = async () => {
    try {
      const params = { company_code: userData?.company_code, ...filter };
      const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-orders`, { params });
      setPurchaseOrders(response.data.purchase_orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/suppliers/get-suppliers`, {
        params: { company_code: userData?.company_code }
      });
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Search style variant
  const searchVariant = async (sku) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/styles/get-style-variants-by-sku/${sku}`);
      return response.data.variant;
    } catch (error) {
      console.error('Error searching variant:', error);
      return null;
    }
  };

  // Search SKU details
  const searchSku = async (sku) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/styles/get-style-variants-by-sku/${sku}`);
      setSkuDetails(response.data.variant);
    } catch (error) {
      console.error('Error searching SKU:', error);
      setSkuDetails(null);
    }
  };

  // Load SKU options for dropdown
  const loadSkuOptions = async (inputValue) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/styles/search-variants`, {
        params: { 
          search: inputValue,
          company_code: userData?.company_code 
        }
      });
      return response.data.variants.map(v => ({
        value: v.sku,
        label: `${v.sku} - ${v.style_name} (${v.color_name}, ${v.size_name})`,
        ...v
      }));
    } catch (error) {
      console.error('Error loading SKUs:', error);
      return [];
    }
  };

  // Update SKU search in modal
  const handleSkuChange = (selected) => {
    setSkuDetails(selected);
    setCurrentSku(selected?.value || '');
  };

  const handleAddItem = async () => {
    if (!skuDetails || !formData.supplier_id || !formData.attention) {
      alert('Please fill in supplier and attention details first');
      return;
    }
  
    try {
      const postData = {
        company_code: userData?.company_code,
        supplier_id: formData.supplier_id,
        attention: formData.attention,
        remark: formData.remark,
        sku: skuDetails.sku,
        quantity: quantity,
        unit_price: skuDetails.unit_price,
        total_price: quantity * skuDetails.unit_price
      };
  
      const response = await axios.post(`${BASE_URL}/api/admin/po/add-purchase-orders`, postData);
  
      if (response.data.success) {
        setPoItems([...poItems, {
          ...skuDetails,
          quantity,
          po_number: response.data.po_number,
          total_price: quantity * skuDetails.unit_price
        }]);
        setCurrentPoNumber(response.data.po_number);
        
        // Reset SKU form
        setCurrentSku('');
        setSkuDetails(null);
        setQuantity(1);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item to PO');
    }
  };

  const handleDelete = async (po_number) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/admin/po/delete-purchase-orders/${po_number}`);
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.attention || poItems.length === 0) {
      alert('Please fill all required fields and add at least one item');
      return;
    }

    try {
      // For editing existing PO
      if (selectedPO) {
        await axios.put(`${BASE_URL}/api/admin/po/update-purchase-orders/${selectedPO.po_number}`, {
          ...formData,
          items: poItems.map(item => ({
            ...item,
            company_code: userData?.company_code
          }))
        });
      } else {
        // Creating items in the current PO
        const requests = poItems.map(item => 
          axios.post(`${BASE_URL}/api/admin/po/add-purchase-orders`, {
            company_code: userData?.company_code,
            supplier_id: formData.supplier_id,
            attention: formData.attention,
            remark: formData.remark,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unit_price
          })
        );

        await Promise.all(requests);
      }

      setShowModal(false);
      setPoItems([]);
      setCurrentPoNumber(null);
      setFormData({
        attention: '',
        supplier_id: '',
        remark: ''
      });
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Error saving purchase order');
    }
  };

  return (
    <div className="purchase-order-container">
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
            <Button onClick={fetchPurchaseOrders}>Search</Button>
          </Col>
        </Row>
      </div>

      {/* Purchase Orders Table */}
      <div className="table-container mt-4">
        <div className="d-flex justify-content-end mb-3">
          <Button onClick={() => {
            setSelectedPO(null);
            setFormData({
              attention: '',
              supplier_id: '',
              remark: '',
              items: []
            });
            setShowModal(true);
          }}>Create PO</Button>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Total Quantity</th>
              <th>Total Styles</th>
              <th>Total Cost</th>
              <th>Date</th>
              <th>GRN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(po => (
              <tr key={po.po_number}>
                <td>{po.po_number}</td>
                <td>{po.supplier_name}</td>
                <td>{po.total_quantity}</td>
                <td>{po.total_styles}</td>
                <td>${po.total_cost?.toFixed(2)}</td>
                <td>{new Date(po.created_at).toLocaleDateString()}</td>
                <td>Pending</td>
                <td>
                  <FaEdit
                    className="action-icon"
                    onClick={() => {
                      setSelectedPO(po);
                      setFormData({
                        attention: po.attention,
                        supplier_id: po.supplier_id,
                        remark: po.remark,
                        items: [] // Fetch items separately
                      });
                      setShowModal(true);
                    }}
                  />
                  <FaTrash
                    className="action-icon ms-2"
                    onClick={() => handleDelete(po.po_number)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentPoNumber ? `Purchase Order: ${currentPoNumber}` : 'Create Purchase Order'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Attention</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.attention}
                    onChange={e => setFormData({...formData, attention: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Select
                    value={formData.supplier_id}
                    onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Remark</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.remark}
                onChange={e => setFormData({...formData, remark: e.target.value})}
              />
            </Form.Group>

            <Row className="mb-3 align-items-end">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>SKU</Form.Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    value={variants.find(v => v.value === currentSku)}
                    loadOptions={loadSkuOptions}
                    onChange={handleSkuChange}
                    placeholder="Search SKU..."
                  />
                </Form.Group>
              </Col>
              {skuDetails && (
                <>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Button onClick={handleAddItem}>Add Item</Button>
                  </Col>
                </>
              )}
            </Row>

            {skuDetails && (
              <div className="sku-details mb-3">
                <Table bordered size="sm">
                  <tbody>
                    <tr>
                      <th>Color</th>
                      <td>{skuDetails.color_name}</td>
                      <th>Size</th>
                      <td>{skuDetails.size_name}</td>
                    </tr>
                    <tr>
                      <th>Fit</th>
                      <td>{skuDetails.fit_name}</td>
                      <th>Material</th>
                      <td>{skuDetails.material_name}</td>
                    </tr>
                    <tr>
                      <th>Unit Price</th>
                      <td colSpan="3">${skuDetails.unit_price}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            )}

            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Fit</th>
                  <th>Material</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.sku}</td>
                    <td>{item.color_name}</td>
                    <td>{item.size_name}</td>
                    <td>{item.fit_name}</td>
                    <td>{item.material_name}</td>
                    <td>${item.unit_price}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.quantity * item.unit_price).toFixed(2)}</td>
                    <td>
                      <FaTrash
                        className="action-icon"
                        onClick={() => {
                          setPoItems(poItems.filter((_, i) => i !== idx));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div className="total-amount">
              Total Amount: ${poItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
            </div>
            <div>
              <Button 
                variant="primary" 
                className="me-2"
                onClick={handleSubmit}
                disabled={!formData.supplier_id || !formData.attention || poItems.length === 0}
              >
                Create Purchase Order
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowModal(false);
                  setPoItems([]);
                  setCurrentPoNumber(null);
                  setFormData({
                    attention: '',
                    supplier_id: '',
                    remark: '',
                  });
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
