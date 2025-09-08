import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Card, Row, Col, Table, Badge, ButtonGroup, Modal, Form } from 'react-bootstrap';
import { FaArrowLeft, FaDownload, FaFileAlt, FaBoxOpen, FaCog, FaCheck } from 'react-icons/fa';
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
  const [stockData, setStockData] = useState({});

  // Modal states
  const [showIssuingModal, setShowIssuingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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
              shipping_first_name: data.order.shipping_first_name,
              shipping_last_name: data.order.shipping_last_name,
              address_line_1: data.order.address_line_1,
              address_line_2: data.order.address_line_2,
              city: data.order.city,
              state: data.order.state,
              postal_code: data.order.postal_code,
              country: data.order.country,
              phone: data.order.shipping_phone
            });
          }
          // Fetch stock data for all items
          fetchStockData(data.items || []);
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

  // Fetch stock data for order items
  const fetchStockData = async (items) => {
    if (!company_code || items.length === 0) return;

    try {
      const stockPromises = items.map(async item => {
        try {
          const response = await fetch(`${BASE_URL}/api/admin/stock/get-stock-summary?company_code=${company_code}&style_number=${item.style_number}&sku=${item.sku}`);
          const data = await response.json();
          return {
            sku: item.sku,
            stock_qty: data?.stock_qty ?? 0
          };
        } catch (error) {
          console.error(`Failed to fetch stock for ${item.sku}:`, error);
          return {
            sku: item.sku,
            stock_qty: 0
          };
        }
      });

      const stockResults = await Promise.all(stockPromises);
      const stockMap = {};
      
      stockResults.forEach(result => {
        stockMap[result.sku] = result.stock_qty;
      });

      setStockData(stockMap);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    }
  };

  // Handle issue all items at once
  const handleIssueAllItems = () => {
    if (!window.confirm('Are you sure you want to issue items for this order? This action cannot be undone.')) {
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

    // Check if all items have sufficient stock before proceeding
    const insufficientStockItems = availableItems.filter(item => 
      stockData[item.sku] !== undefined && stockData[item.sku] < item.quantity
    );

    if (insufficientStockItems.length > 0) {
      const itemsList = insufficientStockItems.map(item => `${item.sku} (Required: ${item.quantity}, Available: ${stockData[item.sku]})`).join('\n');
      setError(`Insufficient stock for the following items:\n${itemsList}`);
      setLoading(false);
      return;
    }

    // Prepare issuing items - backend will automatically select appropriate stock using FIFO
    const issuingItems = availableItems.map(item => ({
      order_item_id: item.order_item_id,
      style_number: item.style_number,
      sku: item.sku,
      issuing_qty: item.quantity
    }));

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
          // Refresh stock data after issuing
          fetchStockData(orderItems);
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

  // Handle download picking list
  const handleDownloadPickingList = () => {
    if (!company_code || !order_id) return;
    
    const url = `${BASE_URL}/api/admin/issuing/orders/${order_id}/picking-list?company_code=${company_code}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `PickingList-${order.order_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle download packing label
  const handleDownloadPackingLabel = () => {
    if (!company_code || !order_id) return;
    
    const url = `${BASE_URL}/api/admin/issuing/orders/${order_id}/packing-label?company_code=${company_code}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `PackingLabel-${order.order_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle opening stock information modal for individual item
  const handleOpenStockInfoModal = async (item) => {
    setSelectedItem(item);
    setShowIssuingModal(true);
    setModalLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/admin/issuing/available-stock?company_code=${company_code}&style_number=${item.style_number}&sku=${item.sku}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableStocks(data.data.available_stocks);
        setSelectedBatch(data.data.selected_stock); // Auto-select first (FIFO)
      } else {
        setError(data.message || 'Failed to load stock data');
        setAvailableStocks([]);
        setSelectedBatch(null);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError('Failed to load stock data');
      setAvailableStocks([]);
      setSelectedBatch(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setShowIssuingModal(false);
    setSelectedItem(null);
    setSelectedBatch(null);
    setAvailableStocks([]);
    setError('');
  };

  const handleBackToOrders = () => {
    navigate('/warehouse/issuing');
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
              <Row className='mt-2'>
                <Col sm={6}>
                  <strong>Phone:</strong><br />
                  {order.customer_phone}
                </Col>
              </Row>
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

        {/* Shipping Details */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Shipping Details</h5>
            </Card.Header>
            <Card.Body>
              {shippingAddress ? (
                <>
                <div className="mb-2">
                    <strong>Full Name:</strong><br />
                    {shippingAddress.shipping_first_name} {shippingAddress.shipping_last_name}
                  </div>
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
          <div className="d-flex gap-2">
            <Button 
              variant="success" 
              size="sm"
              onClick={handleIssueAllItems}
              disabled={
                orderItems.length === 0 || 
                orderItems.every(item => item.booking_status === 'Issued') ||
                orderItems.some(item => 
                  item.booking_status !== 'Issued' && 
                  stockData[item.sku] !== undefined && 
                  stockData[item.sku] < item.quantity
                )
              }
            >
              Issue All Items
            </Button>
            <ButtonGroup size="sm">
              <Button 
                variant="outline-primary"
                onClick={handleDownloadPickingList}
                disabled={orderItems.length === 0}
                title="Download Picking List"
              >
                <FaFileAlt className="me-1" />
                Picking List
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={handleDownloadPackingLabel}
                disabled={orderItems.length === 0}
                title="Download Packing Label"
              >
                <FaBoxOpen className="me-1" />
                Packing Label
              </Button>
            </ButtonGroup>
          </div>
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
                  <th>Sale Price</th>
                  <th>Total Price</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center">No order items found.</td>
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
                    <td>${parseFloat(item.sale_price || 0).toFixed(2)}</td>
                                        <td>${parseFloat(item.total_price || 0).toFixed(2)}</td>

                    <td>
                      <Badge bg={
                        stockData[item.sku] === undefined ? 'secondary' :
                        stockData[item.sku] >= item.quantity ? 'success' :
                        stockData[item.sku] > 0 ? 'warning' : 'danger'
                      }>
                        {stockData[item.sku] !== undefined ? stockData[item.sku] : 'Loading...'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={
                        item.booking_status === 'Issued' ? 'success' :
                        item.booking_status === 'Not Booked' ? 'secondary' : 'warning'
                      }>
                        {item.booking_status || 'Not Booked'}
                      </Badge>
                    </td>
                    <td>
                      {item.booking_status !== 'Issued' && (
                        <FaCog
                          className="action-icon me-2 text-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStockInfoModal(item);
                          }}
                          title="View Stock Information"
                          style={{ cursor: 'pointer' }}
                          size={16}
                        />
                      )}
                      {item.booking_status === 'Issued' && (
                        <FaCheck
                          className="action-icon me-2 text-success"
                          title="Item Issued"
                          size={16}
                        />
                      )}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Stock Information Modal */}
      <Modal show={showIssuingModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Stock Information - {selectedItem?.sku}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p className="mt-2">Loading stock information...</p>
            </div>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              
              {selectedItem && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Card>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <strong>Item Details:</strong><br />
                            SKU: {selectedItem.sku}<br />
                            Style: {selectedItem.style_name || 'N/A'}<br />
                            Color: {selectedItem.color_name || 'N/A'}<br />
                            Size: {selectedItem.size_name || 'N/A'}
                          </Col>
                          <Col md={6}>
                            <strong>Order Information:</strong><br />
                            Required Quantity: {selectedItem.quantity}<br />
                            Status: <Badge bg={
                              selectedItem.booking_status === 'Issued' ? 'success' :
                              selectedItem.booking_status === 'Not Booked' ? 'secondary' : 'warning'
                            }>
                              {selectedItem.booking_status || 'Not Booked'}
                            </Badge>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Available Stock Selection */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Available Stock - Select Batch for Issuing</h6>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Batch Number</th>
                          <th>Lot Number</th>
                          <th>Unit Price</th>
                                                    <th>Location</th>

                          <th>Available Qty</th>
                          <th>Received Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableStocks.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center">No stock available for this item</td>
                          </tr>
                        ) : availableStocks.map((stock, idx) => (
                          <tr 
                            key={idx} 
                            className={selectedBatch?.batch_number === stock.batch_number && 
                                      selectedBatch?.lot_no === stock.lot_no && 
                                      selectedBatch?.unit_price === stock.unit_price ? 'table-primary' : ''}
                          >
                            <td>
                              <Form.Check
                                type="radio"
                                name="selectedStock"
                                checked={selectedBatch?.batch_number === stock.batch_number && 
                                        selectedBatch?.lot_no === stock.lot_no &&
                                        selectedBatch?.unit_price === stock.unit_price}
                                onChange={() => setSelectedBatch(stock)}
                              />
                            </td>
                            <td>{stock.batch_number}</td>
                            <td>{stock.lot_no}</td>
                            <td>${parseFloat(stock.unit_price).toFixed(2)}</td>
                             <td>
                              {stock.location_name || 'N/A'}
                            </td>
                            <td>
                              <Badge bg={stock.main_stock_qty >= (selectedItem?.quantity || 0) ? 'success' : 'warning'}>
                                {stock.main_stock_qty}
                              </Badge>
                            </td>
                           
                            <td>{new Date(stock.created_at).toLocaleDateString()}</td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

            
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
