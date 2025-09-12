import axios from 'axios';
import { useContext, useEffect, useCallback, useState } from 'react';
import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap';
import DeleteModal from '../components/modals/DeleteModal';
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
  const [filter, setFilter] = useState({
    po_number: '',
    supplier_id: '',
    from_date: '',
    to_date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Delete modal state
  const [deleteModalInfo, setDeleteModalInfo] = useState({ po_number: null });

  // Debug logging
  const logDebug = (message, data = null) => {
    console.log(`[PO Component] ${message}`, data || '');
  };

  // Fetch purchase orders with useCallback to prevent unnecessary recreations
  const fetchPurchaseOrders = useCallback(async () => {
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
  }, [filter, userData?.company_code]);

  // Fetch suppliers with useCallback
  const fetchSuppliers = useCallback(async () => {
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
  }, [userData?.company_code]);

  // Fetch initial data
  useEffect(() => {
    if (userData?.company_code) {
      logDebug('Component mounted, fetching initial data');
      fetchPurchaseOrders();
      fetchSuppliers();
    } else {
      logDebug('No company_code available in userData', userData);
    }
  }, [userData, userData?.company_code, fetchPurchaseOrders, fetchSuppliers]);

  const handleEditPO = (po) => {
    if (po.status === 'Approved') {
      alert('You cannot edit an approved purchase order.');
      return;
    }
    navigate(`/merchandising/po/${po.po_number}?mode=edit`);
  };

  const handleViewDetails = (po_number) => {
    navigate(`/merchandising/po/${po_number}/view`);
  }

  const handleDownloadPO = async (po_number) => {
    try {
      logDebug('Downloading PO PDF', po_number);
      setIsLoading(true);
      
      const response = await axios.get(
        `${BASE_URL}/api/admin/po/download-purchase-order/${po_number}?company_code=${userData?.company_code}`,
        {
          responseType: 'blob',
        }
      );

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

  // Open DeleteModal for PO
  const handleDelete = (po_number) => {
    setDeleteModalInfo({ po_number });
  };

  // Called after successful delete from DeleteModal
  const handleDeleteConfirmed = () => {
    setDeleteModalInfo({ po_number: null });
    fetchPurchaseOrders();
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

        <Table striped bordered hover className="po-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Total Quantity</th>
              <th>Total Styles</th>
              <th>Total Cost</th>
              <th>Tolerance Limit (%)</th>
              <th>Status</th>
              <th>Delivery Date</th>
              <th>Created date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">
                  {isLoading ? 'Loading...' : 'No purchase orders found'}
                </td>
              </tr>
            ) : (
              purchaseOrders.map(po => (
                <tr key={po.po_number}>
                  <td>{po.po_number}</td>
                  <td>{po.supplier_name || 'Unknown Supplier'}</td>
                  <td className='cols-with-number'>{po.total_quantity || 0}</td>
                  <td className='cols-with-number'>{po.total_styles || 0}</td>
                  <td className='cols-with-number'>{po.total_cost || "0.00"}</td>
                  <td className='cols-with-number'>{po.tolerance_limit !== undefined ? po.tolerance_limit : 0}</td>
                  <td>
                    <span className={`badge ${po.status === 'Pending' ? 'bg-warning text-dark' : 
                      po.status === 'Approved' ? 'bg-success' : 'bg-secondary'}`}>
                      {po.status || 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(po.delivery_date).toLocaleDateString()}</td>
                  <td>{new Date(po.created_at).toLocaleDateString()}</td>
                  <td>
                    <FaEye
                      className="action-icon me-2 text-primary"
                      onClick={() => handleViewDetails(po.po_number)}
                      title="View Details"
                      style={{ cursor: 'pointer' }}
                    />
                    <FaEdit
                      className={`action-icon me-2 text-warning${po.status === 'Approved' ? ' disabled' : ''}`}
                      onClick={() => handleEditPO(po)}
                      title={po.status === 'Approved' ? 'Cannot edit approved PO' : 'Edit'}
                      style={{ cursor: po.status === 'Approved' ? 'not-allowed' : 'pointer', opacity: po.status === 'Approved' ? 0.5 : 1 }}
                    />
                    <FaDownload
                      className="action-icon me-2 text-success"
                      onClick={() => handleDownloadPO(po.po_number)}
                      title="Download PDF"
                      style={{ cursor: 'pointer' }}
                    />
                    <FaTrash
                      className={`action-icon text-danger${po.status === 'Approved' ? ' disabled' : ''}`}
                      onClick={() => {
                        if (po.status === 'Approved') {
                          alert('You cannot delete an approved purchase order.');
                        } else {
                          handleDelete(po.po_number);
                        }
                      }}
                      title={po.status === 'Approved' ? 'Cannot delete approved PO' : 'Delete'}
                      style={{ cursor: po.status === 'Approved' ? 'not-allowed' : 'pointer', opacity: po.status === 'Approved' ? 0.5 : 1 }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* DeleteModal for PO */}
      <DeleteModal
        id={deleteModalInfo.po_number}
        show={!!deleteModalInfo.po_number}
        onHide={() => setDeleteModalInfo({ po_number: null })}
        deleteUrl={id => id ? `/api/admin/po/delete-purchase-orders/${id}` : ''}
        entityLabel="purchase order"
        modalTitle="Delete Purchase Order"
        confirmMessage="Are you sure you want to delete this purchase order? This action cannot be undone."
        onDeleteSuccess={handleDeleteConfirmed}
      />
    </div>
  );
}