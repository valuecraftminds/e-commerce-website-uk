import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Spinner, Table } from 'react-bootstrap';
import { FaCheck, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import '../styles/ApprovePO.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ApprovePO() {
  const { userData } = useContext(AuthContext);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const navigate = useNavigate();

  const fetchPOs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { company_code: userData?.company_code };
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-orders`, { params });
      setPurchaseOrders(res.data.purchase_orders || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.company_code) fetchPOs();
    // eslint-disable-next-line
  }, [userData?.company_code, statusFilter]);

  const handleApprove = async (po_number) => {
    if (!window.confirm(`Approve PO ${po_number}?`)) return;
    setApproving(po_number);
    try {
      await axios.put(`${BASE_URL}/api/admin/po/approve/${po_number}`);
      fetchPOs();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setApproving('');
    }
  };

  const handleView = (po_number) => {
    navigate(`/merchandising/po/${po_number}/view`);
  }

  return (
    <div className="container">
      <h2>Approve Purchase Orders</h2>
      <div className="mb-3">
        <Button
          variant={statusFilter === 'Pending' ? 'primary' : 'outline-primary'}
          className="me-2"
          onClick={() => setStatusFilter('Pending')}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'Approved' ? 'success' : 'outline-success'}
          className="me-2"
          onClick={() => setStatusFilter('Approved')}
        >
          Approved
        </Button>
        
      </div>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {loading ? (
        <div className="text-center my-4"><Spinner animation="border" /></div>
      ) : (
        <Table striped bordered hover className='approve-table'>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Total Quantity</th>
              <th>Total Styles</th>
              <th>Total Cost</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">No {statusFilter.toLowerCase()} purchase orders</td>
              </tr>
            ) : (
              purchaseOrders
                .filter(po =>
                  statusFilter === 'Pending'
                    ? po.status === 'Pending'
                    : po.status === 'Approved'
                )
                .map(po => (
                  <tr key={po.po_number}>
                    <td>{po.po_number}</td>
                    <td>{po.supplier_name}</td>
                    <td className='number-col'>{po.total_quantity}</td>
                    <td className='number-col'>{po.total_styles}</td>
                    <td className='number-col'>{po.total_cost}</td>
                    <td>{new Date(po.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={
                        po.status === 'Pending' ? "badge bg-warning text-dark" :
                        po.status === 'Approved' ? "badge bg-success" :
                        "badge bg-secondary"
                      }>
                        {po.status}
                      </span>
                    </td>
                    <td>
                      {po.status === 'Pending' ? (
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2 app-btn"
                          onClick={() => handleApprove(po.po_number)}
                          disabled={approving === po.po_number}
                        >
                          {approving === po.po_number ? <Spinner size="sm" /> : <FaCheck />} Approve
                        </Button>
                      ) : (
                        <p> </p>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleView(po.po_number)}
                        className='view-btn'
                      >
                        <FaEye /> View
                      </Button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
