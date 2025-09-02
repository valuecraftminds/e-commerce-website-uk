import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {useReactTable, createColumnHelper, getCoreRowModel, flexRender, getFilteredRowModel, globalFilterFn } from "@tanstack/react-table";
import { PiPackage, PiArrowUp, PiArrowDown } from "react-icons/pi";

import { AuthContext } from '../context/AuthContext';
import '../styles/StockManagement.css';

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

    // stock summary
    const columns = [
        columnHelper.accessor('stock_summary_id', {
            header: 'ID',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('style_number', {
            header: 'Style Number',
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
        columnHelper.accessor('id', {
            header: 'Issuing ID',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('style_number', {
            header: 'Style Number',
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
        })
    ];

    // GRN stock
    const grnStockColumns = [
        columnHelper.accessor('id', {
            header: 'GRN ID',
            cell: info => info.getValue()
        }),
        columnHelper.accessor('style_number', {
            header: 'Style Number',
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

    // fetch main stock summary
    const fetchStockSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BASE_URL}/api/admin/stock/main-stock-summary`, {
                params: { company_code: userData?.company_code }
            });
            setStockSummary(response.data.data);
        } catch (err) {
            setError('Failed to fetch stock summary');
            console.error('Error fetching stock summary:', err);
        } finally {
            setLoading(false);
        }
    };

    // fetch issued stock data
    const fetchIssuedStock = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BASE_URL}/api/admin/stock/issued-stock`, {
                params: { company_code: userData?.company_code }
            });
            setIssuedStock(response.data.data);
        } catch (err) {
            setError('Failed to fetch issued stock');
            console.error('Error fetching issued stock:', err);
        } finally {
            setLoading(false);
        }
    };

    // fetch GRN stock data
    const fetchGrnStock = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${BASE_URL}/api/admin/stock/grn-stock`, {
                params: { company_code: userData?.company_code }
            });
            setGrnStock(response.data.data);
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
        if (tabId === 'stock-summary' && !stockSummary) {
            fetchStockSummary();
        } else if (tabId === 'issued-stock' && !issuedStock) {
            fetchIssuedStock();
        } else if (tabId === 'grn-stock' && !grnStock) {
            fetchGrnStock();
        }
    };

    useEffect(() => {
        if (!userData?.company_code) return;
        fetchStockSummary();
    }, [userData?.company_code]);

    if (loading) return <div>Loading stock summary...</div>;
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
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const tabItems = [
        { id: 'stock-summary', label: 'Stock Summary', icon: PiPackage },
        { id: 'issued-stock', label: 'Issued Stock', icon: PiArrowUp },
        { id: 'grn-stock', label: 'GRN Stock', icon: PiArrowDown }
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