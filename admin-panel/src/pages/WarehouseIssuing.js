import { useContext, useEffect, useState } from 'react';
import { Button, Table, Spinner, Alert, Nav } from 'react-bootstrap';
import { FaEye, FaShippingFast } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import '../styles/WarehouseIssuing.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function WarehouseIssuing() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const company_code = userData?.company_code;

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch orders
  useEffect(() => {
    if (!company_code) return;
    setLoading(true);
    axios.get(`${BASE_URL}/api/admin/issuing/orders`, {
      params: { company_code }
    })
      .then(response => {
        const ordersData = Array.isArray(response.data) ? response.data : [];
        setOrders(ordersData);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load orders');
        setLoading(false);
      });
  }, [company_code]);

  // Filter orders based on active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      setFilteredOrders(orders.filter(order => 
        order.order_status === 'Pending' 
      ));
    } else if (activeTab === 'in-transit') {
      setFilteredOrders(orders.filter(order => 
        order.order_status === 'In Transit' 
      ));
    }
  }, [orders, activeTab]);

  // Navigate to order details
  const handleViewOrderDetails = (order) => {
    navigate(`/order-details/${order.order_id}`);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="warehouse-issuing-page">
      <h2>Warehouse Issuing - Orders</h2>
      
      {/* Filter Tabs */}
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'pending'} 
            onClick={() => handleTabChange('pending')}
            style={{ cursor: 'pointer' }}
          >
            Pending
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'in-transit'} 
            onClick={() => handleTabChange('in-transit')}
            style={{ cursor: 'pointer' }}
          >
            In Transit
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Order Number</th>
              <th>Customer Name</th>
              <th>Total Amount</th>
              <th>Total Items</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No {activeTab === 'pending' ? 'pending' : 'in-transit'} orders found.
                </td>
              </tr>
            ) : filteredOrders.map((order, idx) => (
              <tr key={order.order_id}>
                <td>{idx + 1}</td>
                <td>{order.order_number}</td>
                <td>{order.customer_name}</td>
                <td>${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td>{order.total_items}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  {activeTab === 'pending' ? (
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      onClick={() => handleViewOrderDetails(order)} 
                      title="Issue Order Items"
                    >
                      <FaShippingFast />
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline-info" 
                      onClick={() => handleViewOrderDetails(order)} 
                      title="View Order Details"
                    >
                      <FaEye />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
