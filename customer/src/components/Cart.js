import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';


import CheckoutModal from '../components/CheckoutModal';
import { useNotifyModal} from "../context/NotifyModalProvider";

import '../styles/Cart.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    summary, 
    loading, 
    error, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    clearError,
    formatPrice
  } = useCart();
  
  const { userData, isLoggedIn } = useContext(AuthContext);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  const {showNotify} = useNotifyModal();

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
    showNotify({
        title: 'Clear Cart',
        message: 'Are you sure you want to clear your entire cart?',
        type: 'warning',
        customButtons: [
            {
                label: 'Yes',
                variant: 'danger',
                onClick: async () => {
                    try {
                        const result = await clearCart();
                        if (!result.success) {
                            showNotify({
                                title: 'Error',
                                message: 'Failed to clear cart.',
                                type: 'error'
                            });
                        }
                    } catch (error) {
                        console.error('Error clearing cart:', error);
                        showNotify({
                            title: 'Error',
                            message: 'An unexpected error occurred while clearing the cart.',
                            type: 'error'
                        });
                    }
                }
            },
            {
                label: 'Cancel',
                variant: 'secondary',
                onClick: () => {}
            }
        ],
    })
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setShowCheckoutModal(true);
  };

  // Helper function to format individual item prices
  const formatItemPrice = (price) => {
    return formatPrice(price);
  };

  // Helper function to format total price for an item
  const formatItemTotal = (price, quantity) => {
    return formatPrice(price * quantity);
  };

  // handle click on image
  const handleRedirect = (styleId) => {
    navigate(`/product/${styleId}`);
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

  console.log('Cart data:', cart);

return (
  <div className="cart-container">
    <Container className="my-5">
      <Row>
        <Col>
          <div className="cart-header">
            <h2>🛒 Shopping Cart</h2>
            {isLoggedIn && userData?.name && (
              <div className="customer-welcome">
                <p className="mb-2">Welcome back, <strong>{userData.name}</strong>! 👋</p>
              </div>
            )}
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
                      className={`cart-item-square ${removingItems.has(item.cart_id) ? 'removing' : ''}`}
                    >
                      <Card.Body className="cart-item-square-body">
                        <Row className="h-100">
                          {/* Product Image */}
                          <Col md={3} className="d-flex align-items-center justify-content-center">
                            <div className="square-image-container">
                              <img
                                src={`${BASE_URL}/uploads/styles/${item.image}`}
                                alt={item.style_name}
                                className="cart-item-square-image"
                                onClick={() => handleRedirect(item.style_id)}
                              />
                            </div>
                          </Col> 
                          
                          {/* Product Details */}
                          <Col md={5} className="d-flex flex-column justify-content-center">
                            <h5 className="mb-2">{item.product_name}</h5>

                            <div className="product-details">
                              <small className="text-muted d-block mb-1 product-color-name">
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
                                <small className="text-muted d-block mb-1 product-sku">
                                  <strong>SKU:</strong> {item.sku}
                                </small>
                              )}
                              {item.material_name && (
                                <small className="text-muted d-block product-material">
                                  <strong>Material:</strong> {item.material_name}
                                </small>
                              )}
                            </div>
                          </Col>
                          
                          {/* Price */}
                          <Col md={3} className="d-flex flex-column justify-content-center align-items-center">
                            {/* Unit Price */}
                            <div className="price-section mb-3">
                              <small className="text-muted d-block text-center mb-1">Unit Price</small>
                              <div className="price-display-vertical">
                                {formatItemPrice(item.price)}
                              </div>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="quantity-section mb-3">
                              <small className="text-muted d-block text-center mb-1">Quantity</small>
                              <div className={`quantity-controls-vertical ${updatingItems.has(item.cart_id) ? 'quantity-updating' : ''}`}>
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
                                  readOnly
                                  min="1"
                                  max={item.stock_quantity}
                                  value={item.quantity}
                                  className="quantity-input-vertical"
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
                                <small className="text-primary d-block text-center mt-1">
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Updating...
                                </small>
                              )}
                            </div>
                            
                            {/* Total Price */}
                            <div className="total-section mb-2">
                              <small className="text-muted d-block text-center mb-1">Total</small>
                              <div className="total-price-vertical">
                                {formatItemTotal(item.price, item.quantity)}
                              </div>
                            </div>
                          </Col>
                          </Row>
                          
                          {/* Delete Button */}
                          <Col md={1} className="d-flex">
                            <Button
                              className="cart-bin-square"
                              size="sm"
                              onClick={() => handleRemoveItem(item.cart_id)}
                              disabled={
                                updatingItems.has(item.cart_id) ||
                                removingItems.has(item.cart_id)
                              }
                            >
                              {removingItems.has(item.cart_id) ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                '🗑️'
                              )}
                            </Button>
                          </Col>
                       
                        
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
                                <small>This item is currently out of stock</small>
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
                        <span className="fw-bold">{summary.currency_symbol}{summary.total_amount}</span>
                      </div>
                      {isLoggedIn && (
                        <div className="d-flex justify-content-between mb-3">
                          <span>💸 Discount:</span>
                          <span className="fw-bold">
                            {summary.discount_amount > 0 ? 
                              `-${summary.currency_symbol}${summary.discount_amount.toFixed(2)}` : 
                              '00.00'}
                          </span>
                        </div>
                      )}
                      
                      <hr style={{borderColor: 'rgba(255,255,255,0.3)'}} />
                      <div className="d-flex justify-content-between mb-4">
                        <strong style={{fontSize: '1.3rem'}}>💰 Subtotal:</strong>
                        <strong style={{fontSize: '1.3rem'}}>{summary.currency_symbol}{summary.total_amount}</strong>
                      </div>
                      
                      <div className="d-grid gap-3">
                        <Button 
                          variant="primary" 
                          size="lg"
                          // disabled={cart.length === 0 || cart.some(item => item.stock_quantity === 0)}
                          disabled={cart.length ===0}
                          onClick={() => handleBuyNow()}
                        >
                          🚀 Proceed to Checkout
                        </Button>
                        <CheckoutModal 
                          show={showCheckoutModal} 
                          isDirectBuy={false}
                          onHide={() => setShowCheckoutModal(false)}  
                        />

                        <Link to="/" className="d-grid">
                          <Button variant="outline-secondary" size="lg">
                            🛍️ Continue Shopping
                          </Button>
                        </Link>
                      </div>
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