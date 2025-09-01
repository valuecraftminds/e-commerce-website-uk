import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import '../styles/WarehouseIssuing.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function OrderDetails() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch order details
  useEffect(() => {
    if (!company_code || !order_id) return;
    
    setLoading(true);
    fetch(`${BASE_URL}/api/admin/issuing/orders/${order_id}?company_code=${company_code}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrder(data.order);
          setOrderItems(data.items || []);
          // Extract shipping address from order details
          if (data.order) {
            setShippingAddress({
              address_line_1: data.order.address_line_1,
              address_line_2: data.order.address_line_2,
              city: data.order.city,
              state: data.order.state,
              postal_code: data.order.postal_code,
              country: data.order.country,
              phone: data.order.address_phone
            });
          }
        } else {
          setError(data.error || 'Failed to load order details');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load order details');
        setLoading(false);
      });
  }, [company_code, order_id]);

  // Handle issue all items at once
  const handleIssueAllItems = () => {
    if (!window.confirm('Are you sure you want to issue all available items for this order? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    // Filter out already issued items and prepare issuing data
    const availableItems = orderItems.filter(item => item.booking_status !== 'Issued');
    
    if (availableItems.length === 0) {
      setError('No items available for issuing.');
      setLoading(false);
      return;
    }

    // For demonstration, we'll use first available stock for each item
    // In a real application, you might want to show a modal to select stock for each item
    const processAllItems = async () => {
      const issuingItems = [];
      
      for (const item of availableItems) {
        try {
          // Fetch main stock for each item
          const stockResponse = await fetch(`${BASE_URL}/api/admin/issuing/main-stock?company_code=${company_code}&style_number=${item.style_number}&sku=${item.sku}`);
          const stockData = await stockResponse.json();
          
          if (Array.isArray(stockData) && stockData.length > 0) {
            // Use the first available stock
            const stock = stockData[0];
            issuingItems.push({
              order_item_id: item.order_item_id,
              style_number: item.style_number,
              sku: item.sku,
              batch_number: stock.batch_number,
              lot_no: stock.lot_no,
              unit_price: stock.unit_price,
              issuing_qty: item.quantity
            });
          }
        } catch (error) {
          console.error(`Failed to fetch stock for ${item.sku}:`, error);
        }
      }

      if (issuingItems.length === 0) {
        setError('No available stock found for any items.');
        setLoading(false);
        return;
      }

      // Issue all items
      fetch(`${BASE_URL}/api/admin/issuing/orders/${order.order_id}/issue-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_code: company_code,
          issuing_items: issuingItems
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Update all issued items
            setOrderItems(prev => prev.map(item => {
              const issuedItem = issuingItems.find(issued => issued.order_item_id === item.order_item_id);
              return issuedItem ? { ...item, booking_status: 'Issued' } : item;
            }));
            alert(`Successfully issued ${data.issued_count} items!`);
          } else {
            setError(data.error || 'Failed to issue all items.');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to issue all items.');
          setLoading(false);
        });
    };

    processAllItems();
  };

  const handleBackToOrders = () => {
    navigate('/warehouse-issuing');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!order) {
    return <Alert variant="warning">Order not found</Alert>;
  }

  return (
    <div className="order-details-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Details - {order.order_number}</h2>
        <Button variant="outline-secondary" onClick={handleBackToOrders}>
          <FaArrowLeft className="me-2" />
          Back to Orders
        </Button>
      </div>

      <Row className="mb-4">
        {/* Order Information */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={6}>
                  <strong>Order Number:</strong><br />
                  {order.order_number}
                </Col>
                <Col sm={6}>
                  <strong>Order Status:</strong><br />
                  <Badge bg={order.order_status === 'pending' ? 'warning' : 
                    order.order_status === 'completed' ? 'success' : 'secondary'}>
                    {order.order_status}
                  </Badge>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col sm={6}>
                  <strong>Customer:</strong><br />
                  {order.customer_name}
                </Col>
                <Col sm={6}>
                  <strong>Email:</strong><br />
                  {order.customer_email}
                </Col>
              </Row>
              <hr />
              <Row>
                <Col sm={6}>
                  <strong>Subtotal:</strong><br />
                  ${parseFloat(order.subtotal || 0).toFixed(2)}
                </Col>
                <Col sm={6}>
                  <strong>Shipping Fee:</strong><br />
                  ${parseFloat(order.shipping_fee || 0).toFixed(2)}
                </Col>
              </Row>
              <Row className="mt-2">
                <Col sm={6}>
                  <strong>Tax Amount:</strong><br />
                  ${parseFloat(order.tax_amount || 0).toFixed(2)}
                </Col>
                <Col sm={6}>
                  <strong>Total Amount:</strong><br />
                  <h5 className="text-primary">${parseFloat(order.total_amount || 0).toFixed(2)}</h5>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col sm={6}>
                  <strong>Total Items:</strong><br />
                  {order.total_items}
                </Col>
                <Col sm={6}>
                  <strong>Created:</strong><br />
                  {new Date(order.created_at).toLocaleDateString()}
                </Col>
              </Row>
              {order.order_notes && (
                <>
                  <hr />
                  <div>
                    <strong>Order Notes:</strong><br />
                    {order.order_notes}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Shipping Address */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Shipping Address</h5>
            </Card.Header>
            <Card.Body>
              {shippingAddress ? (
                <>
                  <div className="mb-2">
                    <strong>Address Line 1:</strong><br />
                    {shippingAddress.address_line_1}
                  </div>
                  {shippingAddress.address_line_2 && (
                    <div className="mb-2">
                      <strong>Address Line 2:</strong><br />
                      {shippingAddress.address_line_2}
                    </div>
                  )}
                  <Row>
                    <Col sm={6}>
                      <strong>City:</strong><br />
                      {shippingAddress.city}
                    </Col>
                    <Col sm={6}>
                      <strong>State:</strong><br />
                      {shippingAddress.state}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col sm={6}>
                      <strong>Postal Code:</strong><br />
                      {shippingAddress.postal_code}
                    </Col>
                    <Col sm={6}>
                      <strong>Country:</strong><br />
                      {shippingAddress.country}
                    </Col>
                  </Row>
                  {shippingAddress.phone && (
                    <div className="mt-2">
                      <strong>Phone:</strong><br />
                      {shippingAddress.phone}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted">No shipping address available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Items */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Order Items</h5>
          <Button 
            variant="success" 
            size="sm"
            onClick={handleIssueAllItems}
            disabled={orderItems.length === 0 || orderItems.every(item => item.booking_status === 'Issued')}
          >
            Issue All Items
          </Button>
        </Card.Header>
        <Card.Body>
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
                  <th>Unit Price</th>
                  <th>Total Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center">No order items found.</td>
                  </tr>
                ) : orderItems.map((item, idx) => (
                  <tr key={item.order_item_id}>
                    <td>{idx + 1}</td>
                    <td>{item.sku}</td>
                    <td>{item.style_name || 'N/A'}</td>
                    <td>{item.color_name || 'N/A'}</td>
                    <td>{item.size_name || 'N/A'}</td>
                    <td>{item.fit_name || 'N/A'}</td>
                    <td>{item.material_name || 'N/A'}</td>
                    <td>{item.quantity}</td>
                    <td>${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                    <td>${parseFloat(item.total_price || 0).toFixed(2)}</td>
                    <td>
                      <Badge bg={item.booking_status === 'Issued' ? 'success' : 
                        item.booking_status === 'Not Booked' ? 'warning' : 'secondary'}>
                        {item.booking_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
