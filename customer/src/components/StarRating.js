import React from 'react';

import '../styles/StarRating.css';

/**
  @param {number} rating - The rating value (0-5)
  @param {number} maxStars - Maximum number of stars (default: 5)
  @param {string} size - Size of stars: 'small', 'medium', 'large' (default: 'medium')
  @param {boolean} showValue - Whether to show the numeric rating value (default: false)
  @param {string} className - Additional CSS classes
 */
const StarRating = ({ 
  rating = 0, 
  maxStars = 5, 
  size = 'medium', 
  showValue = false, 
  className = '' 
}) => {
  // Ensure rating is within valid range
  const normalizedRating = Math.max(0, Math.min(maxStars, rating));

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    stars.push(
      <span
        key={i}
        className={`star ${i <= normalizedRating ? 'filled' : ''}`}
      >
        ★
      </span>
    );
  }

  return (
    <div className={`stars-container ${size} ${className}`}>
      {stars}
      {showValue && (
        <span className="rating-value">
          {normalizedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
