import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';

import { PiPackage, PiArrowCounterClockwiseBold } from "react-icons/pi";
import { AiOutlineClockCircle, AiOutlineCheckCircle } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';

import '../styles/OrdersHistory.css';
import { CountryContext } from "../context/CountryContext";

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function OrdersHistory() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState([]);
    const [, setSelectedOrderId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [downloadingInvoice, setDownloadingInvoice] = useState(null);
    const [exchangeRates, setExchangeRates] = useState({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const ordersPerPage = 5;

    const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
    const { country } = useContext(CountryContext);

    // Get auth token from logged in user
    const getAuthToken = () => {
        const token = localStorage.getItem('authToken');
        return token;
    };

    // Get axios config with auth token
    const getAxiosConfig = useCallback(() => {
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
    }, []);
    
    const sidebarItems = [
        { id: 'all', label: 'All Orders', icon: PiPackage },
        { id: 'pending', label: 'Pending', icon: AiOutlineClockCircle },
        // { id: 'shipped', label: 'Shipped', icon: PiTruckFill },
        { id: 'in-transit', label: 'In Transit', icon: AiOutlineClockCircle },
        { id: 'delivered', label: 'Delivered', icon: AiOutlineCheckCircle },
        // { id: 'reviewed', label: 'Reviewed', icon: AiOutlineStar },
        { id: 'cancelled', label: 'Cancelled', icon: PiArrowCounterClockwiseBold }
    ];

    // Fetch all orders
    const fetchAllOrders = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            
            const config = getAxiosConfig();
            config.params.page = page;
            config.params.limit = ordersPerPage;
            
            const response = await axios.get(`${BASE_URL}/api/customer/orders/all-orders`, config);

            if (response.data && response.data.success) {
                setOrders(response.data.data || []);
                
                // Update pagination state
                const pagination = response.data.pagination;
                if (pagination) {
                    setCurrentPage(pagination.currentPage);
                    setTotalPages(pagination.totalPages);
                    setTotalOrders(pagination.totalOrders);
                    setHasNextPage(pagination.hasNextPage);
                    setHasPreviousPage(pagination.hasPreviousPage);
                }
            } else {
                setError('Failed to fetch orders');
                setOrders([]);
                resetPagination();
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setOrders([]);
            resetPagination();
        } finally {
            setLoading(false);
        }
    }, [getAxiosConfig, ordersPerPage]);

    // Fetch orders by status
    const fetchOrdersByStatus = async (statuses, page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const statusParam = Array.isArray(statuses) ? statuses.join(',') : statuses;

            const config = getAxiosConfig();
            const response = await axios.get(`${BASE_URL}/api/customer/orders/orders-by-status`, {
                params: { 
                    company_code: COMPANY_CODE,
                    status: statusParam,
                    page: page,
                    limit: ordersPerPage
                },
                headers: config.headers
            });

            if (response.data && response.data.success) {
                setOrders(response.data.data || []);
                
                // Update pagination state
                const pagination = response.data.pagination;
                if (pagination) {
                    setCurrentPage(pagination.currentPage);
                    setTotalPages(pagination.totalPages);
                    setTotalOrders(pagination.totalOrders);
                    setHasNextPage(pagination.hasNextPage);
                    setHasPreviousPage(pagination.hasPreviousPage);
                }
            } else {
                setError('Failed to fetch orders');
                setOrders([]);
                resetPagination();
            }
        } catch (err) {
            console.error('Error fetching orders by status:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setOrders([]);
            resetPagination();
        } finally {
            setLoading(false);
        }
    };

    // Reset pagination state
    const resetPagination = () => {
        setCurrentPage(1);
        setTotalPages(0);
        setTotalOrders(0);
        setHasNextPage(false);
        setHasPreviousPage(false);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        
        setCurrentPage(newPage);
        
        if (activeTab === 'all') {
            fetchAllOrders(newPage);
        } else {
            const statuses = getStatusByTab(activeTab);
            if (statuses) {
                fetchOrdersByStatus(statuses, newPage);
            }
        }
    };

    // Handle order click
    const handleOrderClick = (orderId) => {
        navigate(`/orders/${orderId}`);
    };
  
    // Map tab to order status
    const getStatusByTab = (tab) => {
        const statusMap = {
            'pending': ['Pending'],
            'in-transit': ['In Transit'],
            'delivered': ['Delivered'],
            'cancelled': ['Cancelled']
         };
        return statusMap[tab] || null;
    };

    // Format currency
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
            day: 'numeric'
        });
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

    // Render pagination controls
    const renderPaginationControls = () => {
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="pagination-controls">
                <div className="pagination-info">
                    Showing {orders.length} of {totalOrders} orders
                </div>
                <div className="pagination-buttons">
                    <button 
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPreviousPage}
                    >
                        Previous
                    </button>
                    
                    {startPage > 1 && (
                        <>
                            <button 
                                className="pagination-btn page-number"
                                onClick={() => handlePageChange(1)}
                            >
                                1
                            </button>
                            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                        </>
                    )}
                    
                    {pageNumbers.map(pageNum => (
                        <button
                            key={pageNum}
                            className={`pagination-btn page-number ${pageNum === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                        >
                            {pageNum}
                        </button>
                    ))}
                    
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                            <button 
                                className="pagination-btn page-number"
                                onClick={() => handlePageChange(totalPages)}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                    
                    <button 
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    // Handle tab change
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSelectedOrderId(null);
        setCurrentPage(1); // Reset to first page when changing tabs
        resetPagination();
        
        if (tabId === 'all') {
            fetchAllOrders(1);
        } else {
            const statuses = getStatusByTab(tabId);
            if (statuses) {
                fetchOrdersByStatus(statuses, 1);
            }
        }
    };

    useEffect(() => {
        const fetchInitialOrders = async () => {
            await fetchAllOrders(1);
        };
        fetchInitialOrders();
    }, [fetchAllOrders]);

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
                    <span className="order-total">{formatPrice(order.total_amount)}</span>
                    <span className="order-id">Order ID: {order.order_number}</span>
                    {order.status && (
                        <span className={`order-status status-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    )}
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
                        <>
                            <div className="orders-list">
                                {orders.map(renderOrderCard)}
                            </div>
                            {renderPaginationControls()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}