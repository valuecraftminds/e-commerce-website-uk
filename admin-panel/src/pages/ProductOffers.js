import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { useReactTable, createColumnHelper, getCoreRowModel, flexRender, getFilteredRowModel } from "@tanstack/react-table";

import Spinner from '../components/Spinner';
import { AuthContext } from '../context/AuthContext';
import AddOfferModal from '../components/modals/AddOffersModal';
import '../styles/ProductOffers.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const columnHelper = createColumnHelper();

export default function ProductOffers() {
    const { userData } = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sortOption, setSortOption] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false
    });

    // Filter and sort data based on sort option
    const filteredAndSortedData = useMemo(() => {
        let filtered = [...data];
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        switch (sortOption) {
            case 'active_offers':
                filtered = filtered.filter(item => {
                    const hasOffer = item.offer_price && Number(item.offer_price) > 0;
                    const startDate = item.offer_start_date ? new Date(item.offer_start_date) : null;
                    const endDate = item.offer_end_date ? new Date(item.offer_end_date) : null;
                    
                    if (!hasOffer) return false;
                    
                    const isActive = (!startDate || startDate <= currentDate) && 
                                   (!endDate || endDate >= currentDate);
                    return isActive;
                });
                // Sort by offer price descending
                filtered.sort((a, b) => (Number(b.offer_price) || 0) - (Number(a.offer_price) || 0));
                break;
                
            case 'upcoming_offers':
                filtered = filtered.filter(item => {
                    const hasOffer = item.offer_price && Number(item.offer_price) > 0;
                    const startDate = item.offer_start_date ? new Date(item.offer_start_date) : null;
                    
                    return hasOffer && startDate && startDate > currentDate;
                });
                // Sort by start date ascending
                filtered.sort((a, b) => new Date(a.offer_start_date) - new Date(b.offer_start_date));
                break;

            case 'expired_offers':
                filtered = filtered.filter(item => {
                    const hasOffer = item.offer_price && Number(item.offer_price) > 0;
                    const endDate = item.offer_end_date ? new Date(item.offer_end_date) : null;
                    
                    return hasOffer && endDate && endDate < currentDate;
                });
                // Sort by end date descending (most recently expired first)
                filtered.sort((a, b) => new Date(b.offer_end_date) - new Date(a.offer_end_date));
                break;
                
            default: 
                // Show all products without any filtering
                break;
        }

        return filtered;
    }, [data, sortOption]);

    // Define table columns
    const columns = useMemo(
        () => [
            columnHelper.accessor('style_number', {
                header: 'Style Number',
                cell: info => info.getValue(),
            }),
            columnHelper.accessor('sku', {
                header: 'SKU',
                cell: info => info.getValue(),
            }),
            columnHelper.accessor('style_name', {
                header: 'Style Name',
                cell: info => info.getValue(),
            }),
            columnHelper.accessor('batch_number', {
                header: 'Batch Number',
                cell: info => info.getValue(),
            }),
            columnHelper.accessor('lot_no', {
                header: 'Lot Number',
                cell: info => info.getValue(),
            }),
            columnHelper.accessor('unit_price', {
                header: 'Unit Price',
                cell: info => `$${info.getValue() || 0}`,
            }),
            columnHelper.accessor('sale_price', {
                header: 'Sale Price',
                cell: info => `$${info.getValue() || 0}`,
            }),
            columnHelper.accessor('main_stock_qty', {
                header: 'Stock Quantity',
                cell: info => info.getValue(),
            }),
            columnHelper.accessor('created_at', {
                header: 'Stock Received Date',
                cell: info => new Date(info.getValue()).toLocaleDateString(),
            }),
            columnHelper.accessor('offer_price', {
                header: 'Offer Price',
                cell: info => {
                  const val = info.getValue();
                  return val && Number(val) !== 0 ? `$${val}` : '-';
                },
            }),
            columnHelper.accessor('offer_start_date', {
                header: 'Offer Start Date',
                cell: info => {
                  const val = info.getValue();
                  return val ? new Date(val).toLocaleDateString() : '-';
                },
            }),
            columnHelper.accessor('offer_end_date', {
                header: 'Offer End Date',
                cell: info => {
                  const val = info.getValue();
                  if (!val) return '-';
                  const endDate = new Date(val);
                  const currentDate = new Date();
                  currentDate.setHours(0, 0, 0, 0);
                  const isExpired = endDate < currentDate;
                  
                  return (
                    <span className={isExpired ? 'pf-expired-date' : ''}>
                      {endDate.toLocaleDateString()}
                    </span>
                  );
                },
            }),
        ],
        []
    );

    // Fetch product data from backend
    const fetchProducts = async (page = 1) => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/admin/offers/product-details`, {
          params: { 
            company_code: userData?.company_code,
            page: page,
            limit: 10
          }
        });
        setData(response.data.products || []);
        setPagination(response.data.pagination || {});
      } catch (error) {
        console.error('Error fetching products:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchProducts(newPage);
        }
    };

    const table = useReactTable({
        data: filteredAndSortedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    // Handle row click to open modal with product details
    const handleRowClick = (product, event) => {
        // Prevent row click if clicking on interactive elements
        if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
            return;
        }
        
        console.log('Row clicked, product:', product); // Debug log
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // Handle modal close and refresh data
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        // Optionally refresh data after modal closes
        fetchProducts(pagination.currentPage);
    };

    if (loading) {
        return (
            <div className="pf-product-offers-container">
                <h1 className="pf-product-offers-header">Product Offers</h1>
                <div className="pf-loading-container">
                   <Spinner />
                </div>
            </div>
        );
    }

    return (
        <div className="pf-product-offers-container">
            <h1 className="pf-product-offers-header">Product Offers</h1>

            {/* Filter Controls */}
            <div className="pf-controls-container">
                <div className="pf-search-container">
                    <input
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        className="pf-search-input"
                        placeholder="Search products..."
                    />
                </div>

                <div className="pf-sort-container">
                    <select
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                        className="pf-sort-select"
                    >
                        <option value="all">All Products</option>
                        <option value="active_offers">Active Offers Only</option>
                        <option value="upcoming_offers">Upcoming Offers Only</option>
                        <option value="expired_offers">Expired Offers Only</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="pf-table-container">
                <div className="pf-table-wrapper">
                    <table className="pf-products-table">
                        <thead className="pf-table-header">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="pf-table-body">
                            {table.getRowModel().rows.map(row => (
                                <tr 
                                    key={row.id} 
                                    className="pf-table-row pf-clickable-row"
                                    onClick={(event) => handleRowClick(row.original, event)}
                                    title="Click to add/edit offer"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <td
                                            key={cell.id}
                                            className={`pf-table-cell ${
                                                index === 0 ? 'pf-index-cell' :
                                                cell.column.id === 'style_number' ? 'pf-style-number-cell' :
                                                cell.column.id === 'unit_price' || cell.column.id === 'sale_price' ? 'pf-price-cell' :
                                                cell.column.id === 'offer_price' ? 'pf-offer-price-cell' :
                                                cell.column.id === 'main_stock_qty' ? 'pf-stock-cell' :
                                                cell.column.id === 'created_at' || cell.column.id === 'offer_start_date' || cell.column.id === 'offer_end_date' ? 'pf-date-cell' :
                                                ''
                                            }`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* No data message */}
            {filteredAndSortedData.length === 0 && !loading && (
                <div className="pf-no-data-message">
                    {sortOption === 'active_offers' ? 'No active offers found.' :
                     sortOption === 'upcoming_offers' ? 'No upcoming offers found.' :
                     sortOption === 'expired_offers' ? 'No expired offers found.' :
                     'No products found.'}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pf-pagination-container">
                    <div className="pf-pagination-info">
                        Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
                    </div>
                    
                    <div className="pf-pagination-controls">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={!pagination.hasPreviousPage}
                            className="pf-pagination-btn pf-pagination-first"
                        >
                            First
                        </button>
                        
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage}
                            className="pf-pagination-btn pf-pagination-prev"
                        >
                            Previous
                        </button>

                        <div className="pf-pagination-pages">
                            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = index + 1;
                                } else if (pagination.currentPage <= 3) {
                                    pageNum = index + 1;
                                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + index;
                                } else {
                                    pageNum = pagination.currentPage - 2 + index;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`pf-pagination-btn ${
                                            pageNum === pagination.currentPage ? 'pf-pagination-active' : ''
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="pf-pagination-btn pf-pagination-next"
                        >
                            Next
                        </button>
                        
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={!pagination.hasNextPage}
                            className="pf-pagination-btn pf-pagination-last"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}

            {/* AddOffer Modal */}
            <AddOfferModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                product={selectedProduct}
                onOfferUpdated={() => fetchProducts(pagination.currentPage)}
            />
        </div>
    );
}