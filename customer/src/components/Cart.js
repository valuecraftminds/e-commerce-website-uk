import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import '../styles/Cart.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Cart = () => {
  const { 
    cart, 
    summary, 
    loading, 
    error, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    clearError 
  } = useCart();
  
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

  const handleQuantityChange = async (cart_id, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(cart_id));
    
    try {
      const result = await updateQuantity(cart_id, newQuantity);
      if (!result.success) {
        console.error('Failed to update quantity:', result.message);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cart_id);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cart_id) => {
    setRemovingItems(prev => new Set(prev).add(cart_id));
    
    try {
      const result = await removeFromCart(cart_id);
      if (!result.success) {
        console.error('Failed to remove item:', result.message);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cart_id);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      try {
        const result = await clearCart();
        if (!result.success) {
          console.error('Failed to clear cart:', result.message);
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="cart-container">
        <Container className="my-5 text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 h5">Loading your cart...</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <Container className="my-5">
        <Row>
          <Col>
            <div className="cart-header">
              <h2>🛒 Shopping Cart</h2>
            </div>
            
            {error && (
              <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
                <strong>Error:</strong> {error}
              </Alert>
            )}

            {cart.length === 0 ? (
              <Card className="empty-cart-card">
                <Card.Body>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛍️</div>
                  <h4>Your cart is empty</h4>
                  <p>Discover amazing products and start shopping today!</p>
                  <Link to="/">
                    <Button variant="light" size="lg" className="fw-bold">
                      🌟 Start Shopping
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            ) : (
              <>
                <Row>
                  <Col lg={8}>
                    {cart.map((item) => (
                      <Card 
                        key={item.cart_id} 
                        className={`cart-item ${removingItems.has(item.cart_id) ? 'removing' : ''}`}
                      >
                        <Card.Body>
                          <Row className="align-items-center">
                            <Col md={2} className="text-center">
                              <img
                                src={`${BASE_URL}/admin/uploads/styles/${item.image}`}
                                alt={item.style_name}
                                className="cart-item-image"
                              />
                            </Col>
                            
                            <Col md={4}>
                              <h6 className="mb-2">
                                <Link 
                                  to={`/product/${item.style_id}`}
                                  className="text-decoration-none"
                                >
                                  {item.style_name}
                                </Link>
                              </h6>
                              <div className="product-details">
                                <small className="text-muted d-block">
                                  {item.color_name && (
                                    <span className="me-3">
                                      <strong>Color:</strong> {item.color_name}
                                    </span>
                                  )}
                                  {item.size_name && (
                                    <span>
                                      <strong>Size:</strong> {item.size_name}
                                    </span>
                                  )}
                                </small>
                                {item.sku && (
                                  <small className="text-muted d-block mt-1">
                                    <strong>SKU:</strong> {item.sku}
                                  </small>
                                )}
                                {item.material_name && (
                                  <small className="text-muted d-block">
                                    <strong>Material:</strong> {item.material_name}
                                  </small>
                                )}
                              </div>
                            </Col>
                            
                            <Col md={2}>
                              <div className="price-display">
                                ${parseFloat(item.price).toFixed(2)}
                              </div>
                            </Col>
                            
                            <Col md={2}>
                              <div className={`quantity-controls ${updatingItems.has(item.cart_id) ? 'quantity-updating' : ''}`}>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1)}
                                  disabled={
                                    item.quantity <= 1 || 
                                    updatingItems.has(item.cart_id) ||
                                    removingItems.has(item.cart_id)
                                  }
                                >
                                  −
                                </Button>
                                <Form.Control 
                                  // type="number"
                                  readOnly
                                  min="1"
                                  max={item.stock_quantity}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1;
                                    if (newQuantity <= item.stock_quantity && newQuantity >= 1) {
                                      handleQuantityChange(item.cart_id, newQuantity);
                                    }
                                  }}
                                  className="quantity-input mx-2"
                                  disabled={
                                    updatingItems.has(item.cart_id) ||
                                    removingItems.has(item.cart_id)
                                  }
                                />
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1)}
                                  disabled={
                                    item.quantity >= item.stock_quantity || 
                                    updatingItems.has(item.cart_id) ||
                                    removingItems.has(item.cart_id)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                              {updatingItems.has(item.cart_id) && (
                                <small className="text-primary d-block text-center mt-2">
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Updating...
                                </small>
                              )}
                            </Col>
                            
                            <Col md={2} className="text-center">
                              <div className="total-price">
                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveItem(item.cart_id)}
                                disabled={
                                  updatingItems.has(item.cart_id) ||
                                  removingItems.has(item.cart_id)
                                }
                                className="mt-2"
                              >
                                {removingItems.has(item.cart_id) ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  '🗑️'
                                )}
                              </Button>
                            </Col>
                          </Row>
                          
                          {/* Stock warnings */}
                          {item.stock_quantity < 5 && item.stock_quantity > 0 && (
                            <Row className="mt-3">
                              <Col>
                                <Alert variant="warning" className="mb-0 py-2">
                                  <small>
                                    ⚠️ Only {item.stock_quantity} items left in stock!
                                  </small>
                                </Alert>
                              </Col>
                            </Row>
                          )}
                          
                          {item.stock_quantity === 0 && (
                            <Row className="mt-3">
                              <Col>
                                <Alert variant="danger" className="mb-0 py-2">
                                  <small>❌ This item is currently out of stock</small>
                                </Alert>
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    ))}

                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline-danger" 
                        onClick={handleClearCart}
                        disabled={cart.length === 0}
                        size="lg"
                      >
                        🗑️ Clear Entire Cart
                      </Button>
                    </div>
                  </Col>

                  <Col lg={4}>
                    <Card className="cart-summary">
                      <Card.Header>
                        <h5 className="mb-0">📋 Order Summary</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between mb-3">
                          <span>Items ({summary.total_items}):</span>
                          <span className="fw-bold">${summary.total_amount}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                          <span>🚚 Shipping:</span>
                          <span className="text">Calculated at checkout</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                          <span>🧾 Tax:</span>
                          <span className="text">Calculated at checkout</span>
                        </div>
                        <hr style={{borderColor: 'rgba(255,255,255,0.3)'}} />
                        <div className="d-flex justify-content-between mb-4">
                          <strong style={{fontSize: '1.3rem'}}>💰 Total:</strong>
                          <strong style={{fontSize: '1.3rem'}}>${summary.total_amount}</strong>
                        </div>
                        
                        <div className="d-grid gap-3">
                          <Button 
                            variant="primary" 
                            size="lg"
                            disabled={cart.length === 0 || cart.some(item => item.stock_quantity === 0)}
                          >
                            🚀 Proceed to Checkout
                          </Button>
                          <Link to="/" className="d-grid">
                            <Button variant="outline-secondary" size="lg">
                              🛍️ Continue Shopping
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Cart items breakdown */}
                    <Card className="mt-4 cart-details">
                      <Card.Header>
                        <h6 className="mb-0">📦 Cart Details</h6>
                      </Card.Header>
                      <Card.Body>
                        {cart.map((item) => (
                          <div key={item.cart_id} className='cart-details-content' >
                            <span className="text-truncate me-2" style={{ maxWidth: '60%' }}>
                              <small className="fw-bold">{item.style_name}</small>
                              <small className="text-muted d-block">Qty: {item.quantity}</small>
                            </span>
                            <span className="fw-bold ">
                              ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;