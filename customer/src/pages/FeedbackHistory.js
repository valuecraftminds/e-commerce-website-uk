import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FeedbackHistory.css';
import { useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const FeedbackHistory = () => {
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, rating, product
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

    const handleRedirect = (style_id) => {
        navigate(`/product/${style_id}`);
    };

  // Fetch feedback history
  const fetchFeedbackHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/customer/feedback/history`,
        getAxiosConfig()
      );
      
      if (response.data && response.data.feedback) {
        setFeedbackHistory(response.data.feedback);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching feedback history:', err);
      setError('Failed to load feedback history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);

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

  // Filter and sort feedback
  const getFilteredAndSortedFeedback = () => {
    let filtered = feedbackHistory;

    // Filter by rating
    if (filterRating !== 'all') {
      filtered = filtered.filter(item => item.rating === parseInt(filterRating));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.style_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.review?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'product':
          return (a.style_name || '').localeCompare(b.style_name || '');
        case 'date':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  const filteredFeedback = getFilteredAndSortedFeedback();

  // Calculate statistics
  const totalReviews = feedbackHistory.length;
  const averageRating = totalReviews > 0 
    ? (feedbackHistory.reduce((sum, item) => sum + item.rating, 0) / totalReviews).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="feedback-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your feedback history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-history">
      <div className="feedback-history-header">
        <h1>My Feedback History</h1>
        <p>View all your product reviews and feedback</p>
        
        {totalReviews > 0 && (
          <div className="feedback-stats">
            <div className="feedback-stat-item">
              <span className="feedback-stat-number">{totalReviews}</span>
              <span className="feedback-stat-label">Total Reviews</span>
            </div>
            {/* <div className="feedback-stat-item">
              <span className="feedback-stat-number">{averageRating}</span>
              <span className="feedback-stat-label">Avg Rating</span>
            </div> */}
          </div>
        )}
      </div>

      {error && (
        <div className="feedback-error-message">
          <p>{error}</p>
          <button onClick={fetchFeedbackHistory} className="feedback-retry-btn">
            Try Again
          </button>
        </div>
      )}

      {!error && feedbackHistory.length === 0 ? (
        <div className="feedback-empty-state">
          <div className="feedback-empty-icon">📝</div>
          <h3>No Feedback History</h3>
          <p>You haven't left any product reviews yet.</p>
          <p>Start shopping and share your experience with others!</p>
        </div>
      ) : (
        <>
          <div className="feedback-controls">
            <div className="feedback-search-box">
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="feedback-search-input"
              />
              <span className="feedback-search-icon">🔍</span>
            </div>

            <div className="feedback-filter-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="feedback-sort-select"
              >
                <option value="date">Sort by Date</option>
                <option value="rating">Sort by Rating</option>
              </select>

              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
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

          <div className="feedback-list">
            {filteredFeedback.length === 0 ? (
              <div className="feedback-no-results">
                <p>No reviews match your current filters.</p>
              </div>
            ) : (
              filteredFeedback.map((item) => (
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
              ))
            )}
          </div>

          {filteredFeedback.length > 0 && (
            <div className="feedback-results-summary">
              <p>
                Showing {filteredFeedback.length} of {totalReviews} reviews
                {searchTerm && ` for "${searchTerm}"`}
                {filterRating !== 'all' && ` with ${filterRating} star${filterRating !== '1' ? 's' : ''}`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackHistory;
