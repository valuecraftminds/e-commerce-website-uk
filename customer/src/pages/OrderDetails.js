import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { BsCart3, BsGeoAlt } from "react-icons/bs";
import { useParams, useNavigate } from 'react-router-dom';

import '../styles/OrderDetails.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
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
            'returned': 'bg-secondary'
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

    return (
        <div className="order-details">
            {/* Header */}
            <div className="order-header mb-4">
                <button 
                    className="btn btn-link text-decoration-none p-0 me-3"
                    onClick={handleBacktoOrders}
                >
                    <AiOutlineArrowLeft size={20} className="me-2" />
                </button>
                <div>
                    <h4 className="mb-1">Order #{orderDetails.order_number}</h4>
                    <div className="d-flex align-items-center gap-3">
                        <span className={`badge ${getStatusBadgeClass(orderDetails.order_status)}`}>
                            {orderDetails.order_status.charAt(0).toUpperCase() + orderDetails.order_status.slice(1)}
                        </span>
                    </div>
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
                                                        {item.style?.style_code && (
                                                            <span className="meta-item">Style: {item.style.style_code}</span>
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
                                                        <span className="value">{formatCurrency(item.unit_price)}</span>
                                                    </div>
                                                    {item.variant?.offer_price && item.variant.offer_price < item.variant.price && (
                                                        <div className="pricing-row offer">
                                                            <span className="label">Offer:</span>
                                                            <span className="value">{formatCurrency(item.variant.offer_price)}</span>
                                                        </div>
                                                    )}
                                                    <div className="pricing-row total">
                                                        <span className="label">Total:</span>
                                                        <span className="value">{formatCurrency(item.total_price)}</span>
                                                    </div>
                                                </div>
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
                                <span className="summary-value">{formatCurrency(orderDetails.subtotal || orderDetails.total_amount - (orderDetails.tax_amount || 0) - (orderDetails.shipping_fee || 0))}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Tax:</span>
                                <span className="summary-value">{formatCurrency(orderDetails.tax_amount || 0)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Shipping:</span>
                                <span className="summary-value">{formatCurrency(orderDetails.shipping_fee || 0)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Total Items:</span>
                                <span className="summary-value">{orderDetails.total_items}</span>
                            </div>
                            <hr className="summary-divider" />
                            <div className="summary-row total">
                                <span className="summary-label">Total Amount:</span>
                                <span className="summary-value">{formatCurrency(orderDetails.total_amount)}</span>
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
        </div>
    );
}