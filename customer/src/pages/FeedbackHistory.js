import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import '../styles/FeedbackHistory.css';
import Spinner from '../components/Spinner';
import StarRating from "../components/StarRating";
import { useNotifyModal } from "../context/NotifyModalProvider";
import Pagination from '../components/Pagination';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const FeedbackHistory = () => {
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [starFilter, setStarFilter] = useState('all');
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalRecords: 0,
    limit: 5,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const navigate = useNavigate();
  const { showNotify } = useNotifyModal();

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

  const handleRedirect = (style_number) => {
    navigate(`/product/${style_number}`);
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
        setFilteredFeedback(response.data.feedback);
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


  // Delete a review
  const handleDeleteReview = async (reviewId) => {
    showNotify({
      title: "Remove Review",
      message: "Are you sure you want to remove this review? This action cannot be undone.",
      type: "warning",
      customButtons: [
        {
          label: "Remove",
          onClick: async () => {
            try {
              setLoading(true);
              await axios.delete(
                `${BASE_URL}/api/customer/feedback/remove/${reviewId}`,
                getAxiosConfig()
              );
              // Refresh the feedback list after deletion
              await fetchFeedbackHistory(currentPage);
              setError("");
            } catch (err) {
              console.error('Error deleting review:', err);
              setError('Failed to delete the review. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          label: "Cancel"
        }
      ]
    });
  };

  // Filter feedback based on star rating
  useEffect(() => {
    if (starFilter === 'all') {
      setFilteredFeedback(feedbackHistory);
    } else {
      const filtered = feedbackHistory.filter(item => item.rating === parseInt(starFilter));
      setFilteredFeedback(filtered);
    }
  }, [starFilter, feedbackHistory]);

  // Handle star filter change
  const handleStarFilterChange = (event) => {
    setStarFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filtering
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
        <p>View all your reviews and ratings</p>
        
        {pagination.totalRecords > 0 && (
          <div className="feedback-controls-row">
            <div className="feedback-stats">
              <div className="feedback-stat-item">
                <span className="feedback-stat-number">{pagination.totalRecords}</span>
                <span className="feedback-stat-label">Total Reviews</span>
              </div>
            </div>
            
            <div className="feedback-filter-section">
              <div className="feedback-filter-group">
                <label htmlFor="star-filter" className="feedback-filter-label">
                  Filter by Rating:
                </label>
                <select 
                  id="star-filter"
                  value={starFilter} 
                  onChange={handleStarFilterChange}
                  className="feedback-filter-select"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {pagination.totalRecords === 0 && (
          <div className="feedback-filter-section">
            <div className="feedback-filter-group">
              <label htmlFor="star-filter" className="feedback-filter-label">
                Filter by Rating:
              </label>
              <select 
                id="star-filter"
                value={starFilter} 
                onChange={handleStarFilterChange}
                className="feedback-filter-select"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
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
      ) : !error && filteredFeedback.length === 0 && starFilter !== 'all' ? (
        <div className="feedback-empty-state">
          <div className="feedback-empty-icon">⭐</div>
          <h3>No Reviews Found</h3>
          <p>No reviews found with {starFilter} star{starFilter === '1' ? '' : 's'} rating.</p>
          <p>Try selecting a different rating filter.</p>
        </div>
      ) : (
        <>
          <div className="feedback-list">
            {filteredFeedback.map((item) => (
              <div key={item.review_id} className="feedback-item">
                <div className="feedback-header">
                  <div className="feedback-product-info">
                    <h3 className="feedback-product-name">{item.name || 'Product'}</h3>
                    <span className="review-date">{formatDate(item.created_at)}</span>
                  </div>
                  <div className="feedback-rating-display">
                    <div className="feedback-stars">
                      <StarRating rating={item.rating} size="large" showValue={false} />
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
                        onClick={() => handleRedirect(item.style_number)}
                      />
                    )}
                  </div>
                  {item.review && item.review.trim() && (
                    <div className="feedback-review-text">
                      <p>{item.review}</p>
                    </div>
                  )}
                </div>

                <div className="feedback-footer">
                  <div className="feedback-meta">
                    <span className="feedback-review-id">Review #{item.review_id}</span>
                  </div>
                  <div>
                    <button 
                      className="feedback-remove-btn"
                      onClick={() => handleDeleteReview(item.review_id)}  
                    >
                      Remove Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

            <Pagination
              pagination={{
                currentPage: pagination.currentPage || currentPage,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalRecords, // map to expected prop
                itemsPerPage: pagination.limit, // map to expected prop
                hasNextPage: pagination.hasNextPage,
                hasPreviousPage: pagination.hasPreviousPage
              }}
              onPageChange={handlePageChange}
            />
        </>
      )}
    </div>
  );
};

export default FeedbackHistory;
                     