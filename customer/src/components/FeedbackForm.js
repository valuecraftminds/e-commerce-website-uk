import { useState } from "react";
import axios from "axios";

import { useNotifyModal } from "../context/NotifyModalProvider";
import '../styles/FeedbackForm.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

// Single item feedback form component
function SingleItemFeedback({ item, customer_id, onSubmissionComplete }) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const { showNotify } = useNotifyModal();

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
    
    const reviewData = {
      company_code: COMPANY_CODE,
      order_id: item.order_id,
      style_id: item.style_id,
      style_number: item.style_number,
      customer_id,
      review,
      rating,
      sku: item.sku
    };

    try {
      const res = await axios.post(`${BASE_URL}/api/customer/feedback/reviews`, reviewData, getAxiosConfig());
      
      // Show success notification
      showNotify({
        title: "Review Submitted Successfully!",
        message: `Thank you for your feedback on ${item.style_name || item.style_number}.`,
        type: "success",
        customButtons: [
          {
            label: "Done",
            onClick: () => {}
          }
        ]
      });
      
      setReview("");
      setRating(0);
      
      // Notify parent component
      if (onSubmissionComplete) {
        onSubmissionComplete(item.style_number);
      }
    } catch (err) {
      console.error('Error submitting review:', err.response?.data || err);
      // Show error notification
      showNotify({
        title: "Error Submitting Review",
        message: "Failed to submit review. Please try again.",
        type: "error",
        customButtons: [
          {
            label: "Try Again",
            onClick: () => {}
          }
        ]
      });
    }
  };

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <h4>Leave your feedback for {item.style_name}</h4>
      {item.style_name && <p className="item-name">{item.sku}</p>}
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
      />
      <button type="submit">Submit</button>
    </form>
  );
}

// Main feedback form component that handles multiple items
function FeedbackForm({ items, customer_id, onSubmissionComplete }) {
  const [completedReviews, setCompletedReviews] = useState([]);

  const handleSubmissionComplete = (styleId) => {
    setCompletedReviews(prev => [...prev, styleId]);
    
    // Call the parent callback if provided
    if (onSubmissionComplete) {
      onSubmissionComplete(styleId);
    }
  };

  // Handle single item case
  if (!Array.isArray(items)) {
    const singleItem = {
      style_id: items?.style_id,
      style_number: items?.style_number,
      style_name: items?.style_name,
      order_id: items?.order_id,
      sku: items?.sku
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
          key={item.style_number || index}
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
