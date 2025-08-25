import { useState } from "react";
import axios from "axios";

import '../styles/FeedbackForm.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

// Single item feedback form component
function SingleItemFeedback({ item, customer_id, onSubmissionComplete }) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/api/customer/feedback/reviews`, {
        company_code: COMPANY_CODE,
        style_id: item.style_id,
        style_number: item.style_number,
        customer_id,
        review,
        rating,
      }, getAxiosConfig());
      
      setMessage(res.data.message);
      setReview("");
      setRating(0);
      setIsSubmitted(true);
      
      // Notify parent component
      if (onSubmissionComplete) {
        onSubmissionComplete(item.style_id);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting review");
    }
  };

  if (isSubmitted) {
    return (
      <div className="feedback-form submitted">
        <h4>Review for {item.style_number}</h4>
        <p className="feedback-message success"> Review submitted successfully!</p>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <h4>Leave your feedback {item.style_number}</h4>
      {item.style_name && <p className="item-name">{item.style_name}</p>}
      <hr />
      
      <div className="star-rating">
        {[5, 4, 3, 2, 1].map((star) => (
          <span
            key={star}
            className={`feedback_star ${star <= rating ? 'filled' : 'empty'}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={255}
        placeholder="Write your review here..."
        required
      />
      <button type="submit">Submit</button>
      {message && <p className={`feedback-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
    </form>
  );
}

// Main feedback form component that handles multiple items
function FeedbackForm({ items, customer_id }) {
  const [completedReviews, setCompletedReviews] = useState([]);

  const handleSubmissionComplete = (styleId) => {
    setCompletedReviews(prev => [...prev, styleId]);
  };

  // Handle single item case (backward compatibility)
  if (!Array.isArray(items)) {
    const singleItem = {
      style_id: items?.style_id,
      style_number: items?.style_number,
      style_name: items?.style_name
    };
    return (
      <div className="feedback-container">
        <SingleItemFeedback 
          item={singleItem} 
          customer_id={customer_id}
          onSubmissionComplete={handleSubmissionComplete}
        />
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <h3>Order Feedback</h3>
      <p>Please review each item in your order:</p>
      
      {items.map((item, index) => (
        <SingleItemFeedback
          key={item.style_id || index}
          item={item}
          customer_id={customer_id}
          onSubmissionComplete={handleSubmissionComplete}
        />
      ))}
      
      {completedReviews.length === items.length && items.length > 0 && (
        <div className="all-reviews-complete">
          <h4>🎉 Thank you for reviewing all items!</h4>
          <p>Your feedback helps us improve our products and service.</p>
        </div>
      )}
    </div>
  );
}

export default FeedbackForm;
