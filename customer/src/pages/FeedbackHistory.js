import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import '../styles/FeedbackHistory.css';
import Spinner from '../components/Spinner';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const FeedbackHistory = () => {
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalRecords: 0,
    limit: 5,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const navigate = useNavigate();

  // Get auth token from logged in user
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    return token;
  };

  // Get axios config with auth token
  const getAxiosConfig = useCallback((page = 1, limit = 5) => {
    const token = getAuthToken();
    const config = {
      params: { 
        company_code: COMPANY_CODE,
        page: page,
        limit: limit
      },
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  }, []);

  const handleRedirect = (style_id) => {
    navigate(`/product/${style_id}`);
  };

  // Fetch feedback history
  const fetchFeedbackHistory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/customer/feedback/history`,
        getAxiosConfig(page, pagination.limit)
      );
      
      if (response.data && response.data.feedback) {
        setFeedbackHistory(response.data.feedback);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching feedback history:', err);
      setError('Failed to load feedback history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAxiosConfig, pagination.limit]);

  useEffect(() => {
    fetchFeedbackHistory(1);
  }, [fetchFeedbackHistory]);

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : 'empty'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchFeedbackHistory(page);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const { totalPages } = pagination;
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="feedback-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-history">
      <div className="feedback-history-header">
        <h1>My Feedback History</h1>
        <p>View all your product reviews and feedback</p>
        
        {pagination.totalRecords > 0 && (
          <div className="feedback-stats">
            <div className="feedback-stat-item">
              <span className="feedback-stat-number">{pagination.totalRecords}</span>
              <span className="feedback-stat-label">Total Reviews</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="feedback-error-message">
          <p>{error}</p>
          <button onClick={() => fetchFeedbackHistory(currentPage)} className="feedback-retry-btn">
            Try Again
          </button>
        </div>
      )}

      {!error && pagination.totalRecords === 0 ? (
        <div className="feedback-empty-state">
          <div className="feedback-empty-icon">📝</div>
          <h3>No Feedback History</h3>
          <p>You haven't left any product reviews yet.</p>
          <p>Start shopping and share your experience with others!</p>
        </div>
      ) : (
        <>
          <div className="feedback-list">
            {feedbackHistory.map((item) => (
              <div key={item.review_id} className="feedback-item">
                <div className="feedback-header">
                  <div className="feedback-product-info">
                    <h3 className="feedback-product-name">{item.name || 'Product'}</h3>
                    <span className="review-date">{formatDate(item.created_at)}</span>
                  </div>
                  <div className="feedback-rating-display">
                    <div className="feedback-stars">
                      {renderStars(item.rating)}
                    </div>
                    <span className="feedback-rating-number">({item.rating}/5)</span>
                  </div>
                </div>
                
                <div className="feedback-content">
                  <div className="feedback-product-image-container">
                    {item.image && (
                      <img 
                        src={`${BASE_URL}/uploads/styles/${item.image}`}
                        alt={item.name || 'Product'}
                        className="feedback-product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => handleRedirect(item.style_id)}
                      />
                    )}
                  </div>
                  <div className="feedback-review-text">
                    <p>{item.review}</p>
                  </div>
                </div>

                <div className="feedback-footer">
                  <div className="feedback-meta">
                    <span className="feedback-review-id">Review #{item.review_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="feedback-pagination">
              <div className="feedback-pagination-info">
                <p>
                  Showing page {currentPage} of {pagination.totalPages} 
                  ({pagination.totalRecords} total reviews)
                </p>
              </div>
              
              <div className="feedback-pagination-controls">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="feedback-pagination-btn feedback-pagination-prev"
                >
                  Previous
                </button>
                
                <div className="feedback-pagination-numbers">
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`feedback-pagination-btn feedback-pagination-number ${
                        pageNum === currentPage ? 'active' : ''
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="feedback-pagination-btn feedback-pagination-next"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackHistory;
                     