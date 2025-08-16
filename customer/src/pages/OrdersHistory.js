import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { PiPackage, PiTruckFill, PiArrowCounterClockwiseBold } from "react-icons/pi";
import { AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineStar } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';

import '../styles/OrdersHistory.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function OrdersHistory() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState([]);
    const [, setSelectedOrderId] = useState(null);
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
    
    const sidebarItems = [
        { id: 'all', label: 'All Orders', icon: PiPackage },
        { id: 'pending', label: 'Pending', icon: AiOutlineClockCircle },
        { id: 'shipped', label: 'Shipped', icon: PiTruckFill },
        { id: 'delivered', label: 'Delivered', icon: AiOutlineCheckCircle },
        { id: 'reviewed', label: 'Reviewed', icon: AiOutlineStar },
        { id: 'returned', label: 'Returned', icon: PiArrowCounterClockwiseBold }
    ];

    // Fetch all orders
    const fetchAllOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const config = getAxiosConfig();
            const response = await axios.get(`${BASE_URL}/api/customer/orders/all-orders`, config);

            if (response.data && response.data.success) {
                setOrders(response.data.data || []);
            } else {
                setError('Failed to fetch orders');
                setOrders([]);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch orders by status
    const fetchOrdersByStatus = async (statuses) => {
        try {
            setLoading(true);
            setError(null);

            const statusParam = Array.isArray(statuses) ? statuses.join(',') : statuses;

            const config = getAxiosConfig();
            const response = await axios.get(`${BASE_URL}/api/customer/orders/orders-by-status`, {
                params: { 
                    company_code: COMPANY_CODE,
                    status: statusParam
                },
                headers: config.headers
            });

            if (response.data && response.data.success) {
                setOrders(response.data.data || []);
            } else {
                setError('Failed to fetch orders');
                setOrders([]);
            }
        } catch (err) {
            console.error('Error fetching orders by status:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle order click
    const handleOrderClick = (orderId) => {
        navigate(`/orders/${orderId}`);
    };

    // Map tab to order status
    const getStatusByTab = (tab) => {
        const statusMap = {
            'pending': ['pending'],
            'shipped': ['shipped'],
            'delivered': ['delivered'],
            'reviewed': ['completed'],
            'returned': ['returned'],
        };
        return statusMap[tab] || null;
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
            day: 'numeric'
        });
    };

    // Get status display text
    const getStatusDisplayText = (status) => {
        const statusMap = {
            'pending': 'Order placed',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'completed': 'Delivered',
            'returned': 'Returned'
        };
        return statusMap[status] || status;
    };

    // Get image URL from item
    const getItemImageUrl = (item) => {
        // Try different possible image paths
        const imagePath = item.style?.image || item.image_url || item.image;
        if (imagePath) {
            // Construct the full URL
            return `${BASE_URL}/uploads/styles/${imagePath}`;
        }
        return '/placeholder-image.png';
    };

    // Handle tab change
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSelectedOrderId(null);
        
        if (tabId === 'all') {
            fetchAllOrders();
        } else {
            const statuses = getStatusByTab(tabId);
            if (statuses) {
                fetchOrdersByStatus(statuses);
            }
        }
    };

    useEffect(() => {
        fetchAllOrders();
    }, []);

    // Render order card
    const renderOrderCard = (order) => (
        <div key={order.order_id} className="order-card">
            {/* Header */}
            <div className="order-card-header">
                <div className="order-status-info">
                    <span className="order-status-text">
                       Order placed on {formatDate(order.created_at)}
                    </span>
                </div>
                <div className="order-details-link">
                    <button 
                        className="view-details-btn"
                        onClick={() => handleOrderClick(order.order_id)}
                    >
                        View order details &gt;
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="order-card-content">
                {/* Product Images */}
                <div className="order-products">
                    {order.items && order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="oh-product-image-container">
                            <img 
                                src={getItemImageUrl(item)} 
                                alt={item.product_name || 'Product'}
                                className="oh-product-image"
                                onError={(e) => {
                                    e.target.src = '/placeholder-image.png';
                                }}
                            />
                        </div>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                        // Fallback for orders without item details
                        <div className="product-image-container">
                            <div className="product-image-placeholder">
                                <PiPackage size={40} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="order-card-footer">
                <div className="order-summary">
                    <span className="order-items-count">
                        {order.total_items} item{order.total_items !== 1 ? 's' : ''}: 
                    </span>
                    <span className="order-total">{formatCurrency(order.total_amount)}</span>
                    <span className="order-id">Order ID: {order.order_number}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className='orders-history'>
            {/* Navigation Tabs */}
            <div className="nav-tabs-custom">
                <ul className="nav nav-tabs border-0">
                    {sidebarItems.map((item) => (
                        <li className="nav-item orders-history-header" key={item.id}>
                            <button
                                className={`nav-link d-flex tab-title ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => handleTabChange(item.id)}
                            >
                                {item.icon && <item.icon size={18} className="me-2" />}
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Content */}
            <div className="tab-content">
                <div className="tab-pane active">
                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-5">
                            <PiPackage size={48} className="text-muted mb-3" />
                            <h5>No orders found</h5>
                            <p className="text-muted">
                                You haven't any orders yet.
                            </p>
                        </div>
                    )}

                    {!loading && !error && orders.length === 0 && (
                        <div className="text-center py-5">
                            <PiPackage size={48} className="text-muted mb-3" />
                            <h5>No orders found</h5>
                            <p className="text-muted">
                                You haven't any {activeTab.toLowerCase()} orders yet.
                            </p>
                        </div>
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <div className="orders-list">
                            {orders.map(renderOrderCard)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}