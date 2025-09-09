import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {useReactTable, createColumnHelper, getCoreRowModel, flexRender, getFilteredRowModel } from "@tanstack/react-table";
import { PiPackage, PiArrowUp, PiArrowDown } from "react-icons/pi";

import { AuthContext } from '../context/AuthContext';
import '../styles/StockManagement.css';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const columnHelper = createColumnHelper();

export default function StockManagement() {
    const { userData } = useContext(AuthContext);
    const [stockSummary, setStockSummary] = useState(null);
    const [issuedStock, setIssuedStock] = useState(null);
    const [grnStock, setGrnStock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('stock-summary');
    
    // Search states
    const [stockSummarySearch, setStockSummarySearch] = useState('');
    const [issuedStockSearch, setIssuedStockSearch] = useState('');
    const [grnStockSearch, setGrnStockSearch] = useState('');

    // Pagination states
    const [stockSummaryPage, setStockSummaryPage] = useState(1);
    const [issuedStockPage, setIssuedStockPage] = useState(1);
    const [grnStockPage, setGrnStockPage] = useState(1);
    
    // Pagination metadata
    const [stockSummaryPagination, setStockSummaryPagination] = useState(null);
    const [issuedStockPagination, setIssuedStockPagination] = useState(null);
    const [grnStockPagination, setGrnStockPagination] = useState(null);

    // stock summary
    const pageSize = 10; 
    const columns = [
        columnHelper.display({
            id: 'index',
            header: '#',
            cell: info => (stockSummaryPage - 1) * pageSize + info.row.index + 1
        }),
        columnHelper.accessor('style_number', {
            header: 'Style Number',
            cell: info => info.getValue()
        }),
         columnHelper.accessor('style_name', {
            header: 'Style Name',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('stock_qty', {
            header: 'Stock Quantity',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('updated_at', {
            header: 'Last Updated',
            cell: info => new Date(info.getValue()).toLocaleDateString()
        })
    ];

    // issued stock
    const issuedStockColumns = [
        columnHelper.display({
            id: 'index',
            header: '#',
            cell: info => (issuedStockPage - 1) * pageSize + info.row.index + 1
        }),
        columnHelper.accessor('style_number', {
            header: 'Style Number',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('style_name', {
            header: 'Style Name',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('batch_number', {
            header: 'Batch Number',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('lot_no', {
            header: 'Lot Number',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('issuing_qty', {
            header: 'Issued Quantity',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('issued_at', {
            header: 'Issued Date',
            cell: info => new Date(info.getValue()).toLocaleDateString()
        })
    ];

    // GRN stock
    const grnStockColumns = [
        columnHelper.display({
            id: 'index',
            header: '#',
            cell: info => (grnStockPage - 1) * pageSize + info.row.index + 1
        }),
        columnHelper.accessor('grn_id', {
            header: 'GRN ID',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('style_number', {
            header: 'Style Number',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('style_name', {
            header: 'Style Name',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('batch_number', {
            header: 'Batch Number',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('lot_no', {
            header: 'Lot Number',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('stock_qty', {
            header: 'Received Quantity',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('location_name', {
            header: 'Location',
            cell: info => info.getValue() || 'N/A'
        }),
        columnHelper.accessor('created_at', {
            header: 'Received Date',
            cell: info => new Date(info.getValue()).toLocaleDateString()
        })
    ];

    const table = useReactTable({
        data: stockSummary || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: 'includesString',
        state: {
            globalFilter: stockSummarySearch,
        },
        onGlobalFilterChange: setStockSummarySearch,
    });

    const issuedStockTable = useReactTable({
        data: issuedStock || [],
        columns: issuedStockColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: 'includesString',
        state: {
            globalFilter: issuedStockSearch,
        },
        onGlobalFilterChange: setIssuedStockSearch,
    });

    const grnStockTable = useReactTable({
        data: grnStock || [],
        columns: grnStockColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: 'includesString',
        state: {
            globalFilter: grnStockSearch,
        },
        onGlobalFilterChange: setGrnStockSearch,
    });

    // map backend pagination to Pagination component format
    const mapPagination = (backend) => {
        if (!backend) return null;
        return {
            currentPage: backend.currentPage || backend.current_page || 1,
            totalPages: backend.totalPages || backend.total_pages || 1,
            totalItems: backend.totalRecords || backend.total_items || backend.total || 0,
            itemsPerPage: backend.limit || backend.itemsPerPage || 10,
            hasNextPage: backend.hasNext !== undefined ? backend.hasNext : backend.has_next,
            hasPreviousPage: backend.hasPrev !== undefined ? backend.hasPrev : backend.has_previous,
        };
    };

    // fetch main stock summary
    const fetchStockSummary = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BASE_URL}/api/admin/stock/main-stock-summary`, {
                params: { 
                    company_code: userData?.company_code,
                    page: page,
                    limit: 10
                }
            });
            setStockSummary(response.data.data);
            setStockSummaryPagination(mapPagination(response.data.pagination));
        } catch (err) {
            setError('Failed to fetch stock summary');
            console.error('Error fetching stock summary:', err);
        } finally {
            setLoading(false);
        }
    };

    // fetch issued stock data
    const fetchIssuedStock = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BASE_URL}/api/admin/stock/issued-stock`, {
                params: { 
                    company_code: userData?.company_code,
                    page: page,
                    limit: 10
                }
            });
            setIssuedStock(response.data.data);
            setIssuedStockPagination(mapPagination(response.data.pagination));
        } catch (err) {
            setError('Failed to fetch issued stock');
            console.error('Error fetching issued stock:', err);
        } finally {
            setLoading(false);
        }
    };

    // fetch GRN stock data
    const fetchGrnStock = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BASE_URL}/api/admin/stock/grn-stock`, {
                params: { 
                    company_code: userData?.company_code,
                    page: page,
                    limit: 10
                }
            });
            setGrnStock(response.data.data);
            setGrnStockPagination(mapPagination(response.data.pagination));
        } catch (err) {
            setError('Failed to fetch GRN stock');
            console.error('Error fetching GRN stock:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle tab change and fetch appropriate data
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (tabId === 'stock-summary') {
            fetchStockSummary(stockSummaryPage);
        } else if (tabId === 'issued-stock') {
            fetchIssuedStock(issuedStockPage);
        } else if (tabId === 'grn-stock') {
            fetchGrnStock(grnStockPage);
        }
    };

    // Pagination handlers
    const handleStockSummaryPageChange = (newPage) => {
        setStockSummaryPage(newPage);
        fetchStockSummary(newPage);
    };

    const handleIssuedStockPageChange = (newPage) => {
        setIssuedStockPage(newPage);
        fetchIssuedStock(newPage);
    };

    const handleGrnStockPageChange = (newPage) => {
        setGrnStockPage(newPage);
        fetchGrnStock(newPage);
    };

    useEffect(() => {
        if (!userData?.company_code) return;
        fetchStockSummary();
    }, [userData?.company_code]);

    if (loading) return <Spinner />;
    if (error) return <div>Error: {error}</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'stock-summary':
                return (
                    <div className="stock-summary-table">
                        <div className="table-header">
                            <h2>Stock Summary</h2>
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search stock summary..."
                                    value={stockSummarySearch}
                                    onChange={(e) => setStockSummarySearch(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>
                        {stockSummary && (
                            <>
                                <table>
                                    <thead>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <th key={header.id}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.map(row => (
                                            <tr key={row.id}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination 
                                    pagination={stockSummaryPagination} 
                                    onPageChange={handleStockSummaryPageChange} 
                                />
                            </>
                        )}
                    </div>
                );
            case 'issued-stock':
                return (
                    <div className="issued-stock-table">
                        <div className="table-header">
                            <h2>Issued Stock</h2>
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search issued stock..."
                                    value={issuedStockSearch}
                                    onChange={(e) => setIssuedStockSearch(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>
                        {issuedStock && (
                            <>
                                <table>
                                    <thead>
                                        {issuedStockTable.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <th key={header.id}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {issuedStockTable.getRowModel().rows.map(row => (
                                            <tr key={row.id}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination 
                                    pagination={issuedStockPagination} 
                                    onPageChange={handleIssuedStockPageChange} 
                                />
                            </>
                        )}
                    </div>
                );
            case 'grn-stock':
                return (
                    <div className="grn-stock-table">
                        <div className="table-header">
                            <h2>GRN Stock</h2>
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search GRN stock..."
                                    value={grnStockSearch}
                                    onChange={(e) => setGrnStockSearch(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>
                        {grnStock && (
                            <>
                                <table>
                                    <thead>
                                        {grnStockTable.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <th key={header.id}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {grnStockTable.getRowModel().rows.map(row => (
                                            <tr key={row.id}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination 
                                    pagination={grnStockPagination} 
                                    onPageChange={handleGrnStockPageChange} 
                                />
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const tabItems = [
        { id: 'stock-summary', label: 'Stock Summary', icon: PiPackage },
        { id: 'grn-stock', label: 'GRN Stock', icon: PiArrowDown },
        { id: 'issued-stock', label: 'Issued Stock', icon: PiArrowUp }
        
    ];

    return (
        <div className="stock-management">
            {/* Navigation Tabs */}
            <div className="nav-tabs-custom">
                <ul className="nav nav-tabs border-0">
                    {tabItems.map((item) => (
                        <li className="nav-item" key={item.id}>
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
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}