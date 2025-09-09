import React from 'react';

// Props: pagination (object), onPageChange (function)
export default function Pagination({
    pagination = {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false
    },
    onPageChange
}) {
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
            onPageChange && onPageChange(newPage);
        }
    };

    if (pagination.totalPages <= 1) return null;

    // Calculate page numbers to show (max 5)
    let startPage = 1;
    let endPage = pagination.totalPages;
    if (pagination.totalPages > 5) {
        if (pagination.currentPage <= 3) {
            startPage = 1;
            endPage = 5;
        } else if (pagination.currentPage >= pagination.totalPages - 2) {
            startPage = pagination.totalPages - 4;
            endPage = pagination.totalPages;
        } else {
            startPage = pagination.currentPage - 2;
            endPage = pagination.currentPage + 2;
        }
    }
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pf-pagination-container">
            <div className="pf-pagination-info">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
                {' to '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                {' of '}
                {pagination.totalItems} entries
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
                    {pageNumbers.map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`pf-pagination-btn ${
                                pageNum === pagination.currentPage ? 'pf-pagination-active' : ''
                            }`}
                            disabled={pageNum === pagination.currentPage}
                        >
                            {pageNum}
                        </button>
                    ))}
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
    );
}