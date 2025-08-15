import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PiPackage, PiTruckFill, PiProhibitFill, PiArrowCounterClockwiseBold } from "react-icons/pi";
import { AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineStar } from "react-icons/ai";

import '../styles/OrdersHistory.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function OrdersHistory() {
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState([]);
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
        // { id: 'cancelled', label: 'Cancelled', icon: PiProhibitFill},
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

            // Convert array of statuses to comma-separated string
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

    // Map tab to order status
    const getStatusByTab = (tab) => {
        const statusMap = {
            'pending': ['pending'],
            'shipped': ['shipped'],
            'delivered': ['delivered'],
            'reviewed': ['completed'],
            // 'cancelled': ['cancelled'],
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle tab change
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        
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

    // Render order item
    const renderOrderItem = (order) => (
        <div key={order.order_id} className="order-item mb-3 p-3 border rounded">
            <div className="row">
                <div className="col-md-8">
                    <h6 className="mb-1">Order #{order.order_number}</h6>
                    <p className="mb-1 text-muted">
                        <small>Placed on {formatDate(order.created_at)}</small>
                    </p>
                    {order.order_notes && (
                        <p className="mb-1 text-muted">
                            <small>Notes: {order.order_notes}</small>
                        </p>
                    )}
                    <span className={`badge ${getStatusBadgeClass(order.order_status)}`}>
                        {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                </div>
                <div className="col-md-4 text-md-end">
                    <h6 className="mb-1">{formatCurrency(order.total_amount)}</h6>
                    <p className="mb-1 text-muted">
                        <small>{order.total_items} item{order.total_items !== 1 ? 's' : ''}</small>
                    </p>
                    <p className="mb-0 text-muted">
                        <small>Shipping: {formatCurrency(order.shipping_fee)}</small>
                    </p>
                </div>
            </div>
        </div>
    );

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'pending': 'bg-warning',
            'shipped': 'bg-primary',
            'delivered': 'bg-success',
            'reviewed': 'bg-success',
            // 'cancelled': 'bg-danger',
            'returned': 'bg-secondary'
        };
        return statusClasses[status] || 'bg-secondary';
    };

    return (
        <div className='orders-history'>
            {/* Navigation Tabs */}
            <div className="nav-tabs-custom">
                <ul className="nav nav-tabs border-0">
                    {sidebarItems.map((item) => (
                        <li className="nav-item" key={item.id}>
                            <button
                                className={`nav-link d-flex align-items-center ${activeTab === item.id ? 'active' : ''}`}
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
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {!loading && !error && orders.length === 0 && (
                        <div className="text-center py-5">
                            <PiPackage size={48} className="text-muted mb-3" />
                            <h5>No orders found</h5>
                            <p className="text-muted">You haven't placed any orders yet.</p>
                        </div>
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <div className="orders-list">
                            {orders.map(renderOrderItem)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}