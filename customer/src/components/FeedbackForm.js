// import { useState } from "react";
// import axios from "axios";

// import { useNotifyModal } from "../context/NotifyModalProvider";
// import '../styles/FeedbackForm.css';

// const BASE_URL = process.env.REACT_APP_API_URL;
// const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

// // Single item feedback form component
// function SingleItemFeedback({ item, customer_id, onSubmissionComplete }) {
//   const [review, setReview] = useState("");
//   const [rating, setRating] = useState(0);
//   const { showNotify } = useNotifyModal();

//   // Get auth token from logged in user
//   const getAuthToken = () => {
//     const token = localStorage.getItem('authToken');
//     return token;
//   };

//   // Get axios config with auth token
//   const getAxiosConfig = () => {
//     const token = getAuthToken();
//     const config = {
//       params: { company_code: COMPANY_CODE },
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     };
    
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     return config;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     const reviewData = {
//       company_code: COMPANY_CODE,
//       order_id: item.order_id,
//       style_id: item.style_id,
//       style_number: item.style_number,
//       customer_id,
//       review,
//       rating,
//       sku: item.sku
//     };

//     try {
//       await axios.post(`${BASE_URL}/api/customer/feedback/reviews`, reviewData, getAxiosConfig());
      
//       // Show success notification
//       showNotify({
//         title: "Review Submitted Successfully!",
//         message: `Thank you for your feedback on ${item.style_name || item.style_number}.`,
//         type: "success",
//         customButtons: [
//           {
//             label: "Done",
//             onClick: () => {}
//           }
//         ]
//       });
      
//       setReview("");
//       setRating(0);
      
//       // Notify parent component
//       if (onSubmissionComplete) {
//         onSubmissionComplete(item.style_number);
//       }
//     } catch (err) {
//       console.error('Error submitting review:', err.response?.data || err);
//       // Show error notification
//       showNotify({
//         title: "Error Submitting Review",
//         message: "Failed to submit review. Please try again.",
//         type: "error",
//         customButtons: [
//           {
//             label: "Try Again",
//             onClick: () => {}
//           }
//         ]
//       });
//     }
//   };

//   return (
//     <form className="feedback-form">
//       <h4>Leave your feedback for {item.style_name}</h4>
//       <hr />
      
//       <div className="star-rating">
//         {[5, 4, 3, 2, 1].map((star) => (
//           <span
//             key={star}
//             className={`feedback_star ${star <= rating ? 'filled' : 'empty'}`}
//             onClick={() => setRating(star)}
//           >
//             ★
//           </span>
//         ))}
//       </div>

//       <textarea
//         value={review}
//         onChange={(e) => setReview(e.target.value)}
//         maxLength={255}
//         placeholder="Write your review here..."
//       />
//       <button 
//         onClick={handleSubmit}
//         className="submit-review-btn"
//       >
//       Submit Your Review</button>
//     </form>
//   );
// }

// // Main feedback form component that handles multiple items
// function FeedbackForm({ items, customer_id, onSubmissionComplete, onClose }) {
//   const [completedReviews, setCompletedReviews] = useState([]);

//   const handleSubmissionComplete = (styleId) => {
//     setCompletedReviews(prev => [...prev, styleId]);
    
//     // Call the parent callback if provided
//     if (onSubmissionComplete) {
//       onSubmissionComplete(styleId);
//     }
//   };

//   // Handle single item case
//   if (!Array.isArray(items)) {
//     const singleItem = {
//       style_id: items?.style_id,
//       style_number: items?.style_number,
//       style_name: items?.style_name,
//       order_id: items?.order_id,
//       sku: items?.sku
//     };
//     return (
//       <div className="feedback-container">
//         {onClose && (
//           <div className="feedback-header">
//             <h5 className="feedback-title">Add Review</h5>
//             <button type="button" className="close-btn" onClick={onClose}>
//               ✕
//             </button>
//           </div>
//         )}
//         <SingleItemFeedback 
//           item={singleItem} 
//           customer_id={customer_id}
//           onSubmissionComplete={handleSubmissionComplete}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="feedback-container">
//       {onClose && (
//         <div className="feedback-header">
//           <h5 className="feedback-title">Order Feedback</h5>
//           <button type="button" className="close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>
//       )}
//       <p>Please review each item in your order:</p>
      
//       {items.map((item, index) => (
//         <SingleItemFeedback
//           key={item.style_number || index}
//           item={item}
//           customer_id={customer_id}
//           onSubmissionComplete={handleSubmissionComplete}
//         />
//       ))}
      
//       {completedReviews.length === items.length && items.length > 0 && (
//         <div className="all-reviews-complete">
//           <h4>🎉 Thank you for reviewing all items!</h4>
//           <p>Your feedback helps us improve our products and service.</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FeedbackForm;

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import PropTypes from "prop-types";
import axios from "axios";

import { useNotifyModal } from "../context/NotifyModalProvider";
import "../styles/FeedbackForm.css";

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

/* ============================
   Base Modal (portal)
============================ */
function BaseModal({ isOpen, onClose, title, children, closeOnBackdrop = true }) {
  const containerRef = useRef(null);

  // Ensure a modal container div exists for this instance
  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
    containerRef.current.className = "modal-root-container"; // style in your CSS if you want
  }

  useEffect(() => {
    if (isOpen) {
      document.body.appendChild(containerRef.current);
      // Prevent background scroll while open
      const { overflow } = document.body.style;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        if (containerRef.current.parentNode) {
          containerRef.current.parentNode.removeChild(containerRef.current);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Feedback dialog"}
      className="modal-backdrop" // add styling in FeedbackForm.css
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target.classList.contains("modal-backdrop")) {
          onClose?.();
        }
      }}
    >
      <div className="modal-panel" role="document">
        {/* <div className="feedback-header">
          <h5 className="feedback-title">{title}</h5>
          <button type="button" className="close-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div> */}
        <div className="modal-content">{children}</div>
      </div>
    </div>,
    containerRef.current
  );
}

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  closeOnBackdrop: PropTypes.bool,
};

/* ============================
   Utilities for axios config
============================ */
const getAuthToken = () => localStorage.getItem("authToken");

const useAxiosConfig = () =>
  useMemo(() => {
    const token = getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return { params: { company_code: COMPANY_CODE }, headers };
  }, []);

/* ============================
   Single Item Feedback
============================ */
function SingleItemFeedback({ item, customer_id, onSubmissionComplete }) {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { showNotify } = useNotifyModal();
  const axiosConfig = useAxiosConfig();

  const remaining = 255 - review.length;
  // Only rating is required, review is optional
  const isValid = rating > 0 && review.length <= 255;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isValid || submitting) return;

      const reviewData = {
        company_code: COMPANY_CODE,
        order_id: item?.order_id,
        style_id: item?.style_id,
        style_number: item?.style_number,
        customer_id,
        review: review.trim(), // will be empty string if not provided
        rating,
        sku: item?.sku,
      };

      try {
        setSubmitting(true);
        if (!BASE_URL) throw new Error("Missing REACT_APP_API_URL");
        const url = `${BASE_URL.replace(/\/$/, "")}/api/customer/feedback/reviews`;

        await axios.post(url, reviewData, axiosConfig);

        showNotify({
          title: "Review Submitted Successfully!",
          message: `Thank you for your feedback on ${item?.style_name || item?.style_number || "this item"}.`,
          type: "success",
          customButtons: [{ label: "Done", onClick: () => {} }],
        });

        setReview("");
        setRating(0);
        onSubmissionComplete?.(item?.style_number || item?.style_id);
      } catch (err) {
        console.error("Error submitting review:", err?.response?.data || err);
        showNotify({
          title: "Error Submitting Review",
          message: err?.response?.data?.message || "Failed to submit review. Please try again.",
          type: "error",
          customButtons: [{ label: "Try Again", onClick: () => {} }],
        });
      } finally {
        setSubmitting(false);
      }
    },
    [axiosConfig, customer_id, isValid, item, rating, review, showNotify, submitting]
  );

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <h4>Leave your feedback for {item?.style_name || item?.style_number}</h4>
      <hr />

      <div className="star-rating" aria-label="Rating">
        {[5, 4, 3, 2, 1].map((star) => (
          <span
            key={star}
            role="button"
            tabIndex={0}
            className={`feedback_star ${star <= rating ? "filled" : "empty"}`}
            onClick={() => setRating(star)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setRating(star);
            }}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
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
        aria-label="Your review"
      />
      <div className="feedback-hints">
        <small>{remaining} characters left</small>
      </div>

      <button type="submit" className="submit-review-btn" disabled={!isValid || submitting}>
        {submitting ? "Submitting..." : "Submit Your Review"}
      </button>
    </form>
  );
}

SingleItemFeedback.propTypes = {
  item: PropTypes.shape({
    style_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    style_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    style_name: PropTypes.string,
    order_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sku: PropTypes.string,
  }),
  customer_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSubmissionComplete: PropTypes.func,
};

/* ============================
   Feedback Form (multi/single)
============================ */
function FeedbackForm({ items, customer_id, onSubmissionComplete, onClose }) {
  const [completedReviews, setCompletedReviews] = useState([]);

  const handleSubmissionComplete = (styleId) => {
    setCompletedReviews((prev) => (prev.includes(styleId) ? prev : [...prev, styleId]));
    onSubmissionComplete?.(styleId);
  };

  // Single item case
  if (!Array.isArray(items)) {
    const singleItem = {
      style_id: items?.style_id,
      style_number: items?.style_number,
      style_name: items?.style_name,
      order_id: items?.order_id,
      sku: items?.sku,
    };
    return (
      <div className="feedback-container">
        {/* {onClose && (
          <div className="feedback-header">
            <h5 className="feedback-title">Add Review</h5>
            <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )} */}
        <SingleItemFeedback
          item={singleItem}
          customer_id={customer_id}
          onSubmissionComplete={handleSubmissionComplete}
        />
      </div>
    );
  }

  // Multiple items
  return (
    <div className="feedback-container">
      {/* {onClose && (
        <div className="feedback-header">
          <h5 className="feedback-title">Order Feedback</h5>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      )} */}
      <p>Please review each item in your order:</p>

      {items.map((item, index) => (
        <SingleItemFeedback
          key={item?.style_number || index}
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

FeedbackForm.propTypes = {
  items: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object]),
  customer_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSubmissionComplete: PropTypes.func,
  onClose: PropTypes.func,
};

/* ============================
   Feedback Modal (Declarative)
============================ */
export default function FeedbackModal({
  isOpen,
  onClose,
  items,
  customer_id,
  onSubmissionComplete,
  autoCloseOnComplete = false,
}) {
  // Close automatically when all reviewed (only meaningful for arrays)
  const [completedCount, setCompletedCount] = useState(0);
  const total = Array.isArray(items) ? items.length : 1;

  const handleComplete = (styleId) => {
    setCompletedCount((n) => Math.min(total, n + 1));
    onSubmissionComplete?.(styleId);
  };

  useEffect(() => {
    if (autoCloseOnComplete && total > 0 && completedCount >= total) {
      onClose?.();
    }
  }, [autoCloseOnComplete, completedCount, total, onClose]);

  return (
    <BaseModal
      isOpen={!!isOpen}
      onClose={onClose}
      // title={Array.isArray(items) ? "Order Feedback" : "Add Review"}
    >
      <FeedbackForm
        items={items}
        customer_id={customer_id}
        onSubmissionComplete={handleComplete}
        onClose={onClose}
      />
    </BaseModal>
  );
}

FeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  items: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object]),
  customer_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSubmissionComplete: PropTypes.func,
  autoCloseOnComplete: PropTypes.bool,
};

/* ==========================================
   Imperative API: openFeedbackModal({...})
   Usage:
     import { openFeedbackModal } from "./FeedbackFormModal";

     await openFeedbackModal({
       items,
       customer_id,
       autoCloseOnComplete: true
     });
========================================== */
export function openFeedbackModal({
  items,
  customer_id,
  onSubmissionComplete,
  autoCloseOnComplete = false,
} = {}) {
  const mount = document.createElement("div");
  mount.className = "modal-imperative-mount"; // style if desired
  document.body.appendChild(mount);

  const root = createRoot(mount);

  function cleanup() {
    setTimeout(() => {
      try {
        root.unmount();
      } catch {}
      if (mount.parentNode) mount.parentNode.removeChild(mount);
    }, 0);
  }

  return new Promise((resolve) => {
    const handleClose = () => {
      resolve({ closed: true });
      cleanup();
    };

    const handleComplete = (styleId) => {
      onSubmissionComplete?.(styleId);
      if (autoCloseOnComplete) {
        resolve({ completed: true, styleId });
        cleanup();
      }
    };

    root.render(
      <FeedbackModal
        isOpen
        onClose={handleClose}
        items={items}
        customer_id={customer_id}
        onSubmissionComplete={handleComplete}
        autoCloseOnComplete={autoCloseOnComplete}
      />
    );
  });
}
