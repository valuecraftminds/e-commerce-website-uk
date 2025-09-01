
import { useContext, useEffect, useState } from 'react';
import { Button, Table, Spinner, Alert } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/WarehouseIssuing.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function WarehouseIssuing() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const company_code = userData?.company_code;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch orders
  useEffect(() => {
    if (!company_code) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/admin/issuing/orders?company_code=${company_code}`)
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load orders');
        setLoading(false);
      });
  }, [company_code]);

  // Navigate to order details
  const handleViewOrderDetails = (order) => {
    navigate(`/order-details/${order.order_id}`);
  };

  return (
    <div className="warehouse-issuing-page">
      <h2>Warehouse Issuing - Orders</h2>
      
      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Order Number</th>
              <th>Customer Name</th>
              <th>Total Amount</th>
              <th>Total Items</th>
              <th>Order Status</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={8} className="text-center">No orders found.</td></tr>
            ) : orders.map((order, idx) => (
              <tr key={order.order_id}>
                <td>{idx + 1}</td>
                <td>{order.order_number}</td>
                <td>{order.customer_name}</td>
                <td>${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td>{order.total_items}</td>
                <td>
                  <span className={`badge ${order.order_status === 'pending' ? 'bg-warning' : 
                    order.order_status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                    {order.order_status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <Button 
                    size="sm" 
                    variant="outline-primary" 
                    onClick={() => handleViewOrderDetails(order)} 
                    title="View Order Details"
                  >
                    <FaEye />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
