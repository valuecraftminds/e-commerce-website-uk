import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { BsCart3, BsGeoAlt } from "react-icons/bs";
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';

import '../styles/OrderDetails.css';
import { CountryContext } from "../context/CountryContext";
import FeedbackForm from './FeedbackForm';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exchangeRates, setExchangeRates] = useState({});
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [reviewedItems, setReviewedItems] = useState(new Set()); // Track reviewed items
    
    const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
    const { country } = useContext(CountryContext);

    // Get auth token from logged in user
    const getAuthToken = () => {
        const token = localStorage.getItem('authToken');
        return token;
    };

    // Get axios config with auth token
    const getAxiosConfig = () => {
        const token = getAuthToken();
        const config = {
            params: { company_code: COMPANY_CODE },
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    };

    // Fetch order details
    const fetchOrderDetails = async (id) => {
        try {
            setLoading(true);
            setError(null);
            
            const config = getAxiosConfig();
            const response = await axios.get(`${BASE_URL}/api/customer/orders/order-details/${id}`, config);

            if (response.data && response.data.success) {
                setOrderDetails(response.data.data);
                // After setting order details, check for existing reviews
                checkExistingReviews(response.data.data);
            } else {
                setError(response.data?.message || 'Failed to fetch order details');
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError(err.response?.data?.message || 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    // Check if items in this order have been reviewed
    const checkExistingReviews = async (orderData) => {
        try {
            const config = getAxiosConfig();
            const response = await axios.get(`${BASE_URL}/api/customer/feedback/history`, config);
            
            if (response.data && response.data.feedback && Array.isArray(response.data.feedback)) {
                const reviewedStyleIds = new Set();
                
                // Find reviews that belong to this order
                response.data.feedback.forEach(review => {
                    if (review.order_id === orderData.order_id) {
                        reviewedStyleIds.add(review.style_id);
                    }
                });
                
                setReviewedItems(reviewedStyleIds);
                console.log('Reviewed items for this order:', Array.from(reviewedStyleIds));
            } else {
                // No reviews found, keep empty set
                setReviewedItems(new Set());
            }
        } catch (err) {
            console.error('Error checking existing reviews:', err);
            // Don't show error to user, just log it and keep empty set
            setReviewedItems(new Set());
        }
    };

    // Check if a specific item has been reviewed
    const isItemReviewed = (item) => {
        const styleId = item.style?.style_id || item.style_id;
        return reviewedItems.has(styleId);
    };

    // Fetch exchange rates
    useEffect(() => {
        const fetchExchangeRates = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/customer/currency/rates`); 
            if (response.data.success) {
            setExchangeRates(response.data.rates);
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            // Set default rates if API fails
            setExchangeRates({
            GBP: 0.75,
            LKR: 320
            });
        }
        };
        fetchExchangeRates();
    }, []);

    const getRate = () => {
        switch (country) {
        case 'US':
            return 1;
        case 'UK':
            return exchangeRates['GBP'] || 0.75;
        case 'SL':
            return exchangeRates['LKR'] || 320;
        default:
            return 1;
        }
    };

    const formatPrice = (minPrice) => {
        if (!minPrice) return "Price not defined";
        const symbol = currencySymbols[country] || '$';
        const rate = getRate();
        const convertedPrice = (minPrice * rate).toFixed(2);
        return `${symbol}${convertedPrice}`;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format shipping address
    const formatShippingAddress = (address) => {
        if (!address) return 'No shipping address available';
        
        const addressParts = [
            address.shipping_name,
            address.address_line_1,
            address.address_line_2,
            address.city,
            address.state,
            address.postal_code,
            address.country
        ].filter(part => part && part.trim() !== '');
        
        console.log('address', addressParts);
        return addressParts.join(', ');
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'pending': 'bg-warning',
            'shipped': 'bg-primary',
            'delivered': 'bg-success',
            'reviewed': 'bg-success',
            'returned': 'bg-secondary',
            'cancelled': 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    };

    const handleBacktoOrders = () => {
        navigate('/orders-history');
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails(orderId);
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading order details...</span>
                </div>
                <p className="mt-3 text-muted">Loading order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="order-details">
                <div className="d-flex align-items-center mb-4">
                    <button 
                        className="btn btn-link p-0 me-3"
                        onClick={handleBacktoOrders}
                    >
                        <AiOutlineArrowLeft size={48} className="me-2" />
                    </button>
                </div>
                <div className="alert alert-danger" role="alert">
                    <h6>Error loading order details</h6>
                    <p className="mb-0">{error}</p>
                </div>
            </div>
        );
    }

    // Get image URL from item
    const getItemImageUrl = (item) => {
        // Try different possible image paths based on your API structure
        const imagePath = item.style?.image || item.image_url || item.image;
        
        if (imagePath) {
            // Construct the full URL
            return `${BASE_URL}/uploads/styles/${imagePath}`;
        }
        
        return '/placeholder-image.png';
    };

    if (!orderDetails) {
        return null;
    }
    
    const handleConfirmDelivery = async () => {
        try {
            const response = await axios.post(
            `${BASE_URL}/api/customer/confirm-delivery/${orderDetails.order_id}`,
            {}, 
                getAxiosConfig()
            );

            alert('Delivery confirmed!');
            console.log('Response:', response.data);

        } catch (error) {
            console.error('Error confirming delivery:', error);
            alert('Failed to confirm delivery');
        }
    };

    // Cancel order function
    const handleCancelOrder = async () => {
        // Show confirmation dialog
        if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            return;
        }

        try {
            const config = getAxiosConfig();
            const response = await axios.post(
                `${BASE_URL}/api/customer/orders/cancel-order/${orderDetails.order_id}`,
                {},
                config
            );

            if (response.data.success) {
                alert('Order cancelled successfully!');
                // Update the order status in the local state
                setOrderDetails(prev => ({
                    ...prev,
                    order_status: 'cancelled'
                }));
            } else {
                alert(response.data.message || 'Failed to cancel order');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    // Handle opening feedback modal for specific item
    const handleAddReview = (item) => {
        const selectedItemData = {
            style_id: item.style?.style_id || item.style_id,
            style_number: item.style?.style_number || item.style_number,
            style_name: item.style?.name || item.name || 'Product',
            order_item_id: item.order_item_id,
            sku: item.variant?.sku || item.sku,
            order_id: orderDetails?.order_id // Add order_id to the selected item
        };
        
        console.log('Selected item data for review:', selectedItemData); // Debug log
        setSelectedItem(selectedItemData);
        setShowFeedbackModal(true);
    };

    // Handle closing feedback modal
    const handleCloseFeedbackModal = () => {
        setShowFeedbackModal(false);
        setSelectedItem(null);
    };

    // Handle feedback submission completion
    const handleFeedbackSubmissionComplete = (styleId) => {
        // Update the reviewed items set
        setReviewedItems(prev => new Set([...prev, styleId]));
        
        console.log(`Review submitted for style_id: ${styleId}`);
        setShowFeedbackModal(false);
        setSelectedItem(null);
        // Optionally show a success message
        alert('Review submitted successfully!');
    };

    return (
        <div className="order-details">
            {/* Header */}
            <div className="order-header mb-4 d-flex justify-content-between align-items-center">
                {/* Left side */}
                <div className="d-flex align-items-center">
                    <button 
                        className="btn btn-link text-decoration-none p-0 me-3"
                        onClick={handleBacktoOrders}
                    >
                        <AiOutlineArrowLeft size={20} className="me-2" />
                    </button>
                    <div>
                        <h4 className="mb-0">Order #{orderDetails.order_number}</h4>
                        <span className={`badge ${getStatusBadgeClass(orderDetails.order_status)}`}>
                            {orderDetails.order_status.charAt(0).toUpperCase() + orderDetails.order_status.slice(1)}
                        </span>
                    </div>
                </div>

                {/* Right side */}
                <div className="d-flex gap-2">
                    {/* Cancel Order Button - Only show for pending orders */}
                    {orderDetails.order_status === 'pending' && (
                        <Button 
                            variant="outline-danger"
                            className="cancel-order-btn"
                            onClick={handleCancelOrder}
                        >
                            Cancel Order
                        </Button>
                    )}
                    
                    {/* Confirm Delivery Button */}
                    <Button 
                        className='delivery-btn'
                        onClick={handleConfirmDelivery}
                    >
                        Confirm Delivery
                    </Button>
                </div>
            </div>

            {/* Shipping Address */}
            {orderDetails.address && (
            <div className="card mb-4">
                <div className="card-header">
                <h6 className="mb-0 d-flex align-items-center">
                    <BsGeoAlt className="me-2" />
                    Shipped to:
                </h6>
                </div>
                <div className="card-body">
                {orderDetails.address.full_name && (
                    <div className="shipping-name mb-2">
                    <strong>{orderDetails.address.full_name}</strong>
                    </div>
                )}
                <div className="shipping-address mb-2">
                    {formatShippingAddress(orderDetails.address)}
                </div>
                {orderDetails.address.phone && (
                    <div className="shipping-phone text-muted">
                    <small>Phone: {orderDetails.address.phone}</small>
                    </div>
                )}
                </div>
            </div>
            )}

            {/* Two Column Layout */}
            <div className="order-content-wrapper">
                {/* Left Side - Order Items */}
                <div className="order-items-section">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0 d-flex align-items-center">
                                <BsCart3 className="me-2" />
                                Order Items
                            </h6>
                        </div>
                        <div className="card-body">
                            {orderDetails.items && orderDetails.items.length > 0 ? (
                                <div className="order-items-list">
                                    {orderDetails.items.map((item) => (
                                        <div key={item.order_item_id} className="order-item-card">
                                            <div className="d-flex gap-3 p-3">
                                                {/* Product Image */}
                                                <div className="od-item-image-wrapper">
                                                    <img 
                                                        src={getItemImageUrl(item)} 
                                                        alt={item.product_name || 'Product'}
                                                        className="od-product-image"
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder-image.png';
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Product Details */}
                                                <div className="item-details">
                                                    <h6 className="item-name">{item.style?.name || 'Product Name'}</h6>
                                                    {item.style?.description && (
                                                        <p className="item-description">{item.style.description}</p>
                                                    )}
                                                    <div className="item-meta">
                                                        {item.variant?.sku && (
                                                            <span className="meta-item">SKU: {item.variant.sku}</span>
                                                        )}
                                                        {item.style?.style_number && (
                                                            <span className="meta-item">Style: {item.style.style_number}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Quantity and Price */}
                                                <div className="item-pricing">
                                                    <div className="pricing-row">
                                                        <span className="label">Qty:</span>
                                                        <span className="value">{item.quantity}</span>
                                                    </div>
                                                    <div className="pricing-row">
                                                        <span className="label">Unit:</span>
                                                        <span className="value">{formatPrice(item.unit_price)}</span>
                                                    </div>
                                                    {item.variant?.offer_price && item.variant.offer_price < item.variant.price && (
                                                        <div className="pricing-row offer">
                                                            <span className="label">Offer:</span>
                                                            <span className="value">{formatPrice(item.variant.offer_price)}</span>
                                                        </div>
                                                    )}
                                                    <div className="pricing-row total">
                                                        <span className="label">Total:</span>
                                                        <span className="value">{formatPrice(item.total_price)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Add Review Button */}
                                            <div className="pricing-row review-action">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    className="add-review-btn mt-2"
                                                    onClick={() => handleAddReview(item)}
                                                >
                                                    Add Review
                                                </Button>
                                                
                                                {/* Show review status */}
                                                {isItemReviewed(item) && (
                                                    <small className="text-success mt-1 d-block">
                                                        ✓ You've reviewed this item
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No items found for this order.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Order Summary & Notes */}
                <div className="order-summary-section">
                    {/* Order Summary */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h6 className="mb-0">Order Summary</h6>
                        </div>
                        <div className="card-body">
                            <div className="summary-row">
                                <span className="summary-label">Subtotal:</span>
                                <span className="summary-value">{formatPrice(orderDetails.subtotal || orderDetails.total_amount - (orderDetails.tax_amount || 0) - (orderDetails.shipping_fee || 0))}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Tax:</span>
                                <span className="summary-value">{formatPrice(orderDetails.tax_amount || 0)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Shipping:</span>
                                <span className="summary-value">{formatPrice(orderDetails.shipping_fee || 0)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Total Items:</span>
                                <span className="summary-value">{orderDetails.total_items}</span>
                            </div>
                            <hr className="summary-divider" />
                            <div className="summary-row total">
                                <span className="summary-label">Total Amount:</span>
                                <span className="summary-value">{formatPrice(orderDetails.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Notes */}
                    {orderDetails.order_notes && (
                        <div className="card">
                            <div className="card-header">
                                <h6 className="mb-0">Order Notes</h6>
                            </div>
                            <div className="card-body">
                                <p className="mb-0 notes-content">{orderDetails.order_notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            <Modal 
                show={showFeedbackModal} 
                onHide={handleCloseFeedbackModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedItem && (
                        <FeedbackForm 
                            items={selectedItem}
                            customer_id={orderDetails?.customer_id}
                            onSubmissionComplete={handleFeedbackSubmissionComplete}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}