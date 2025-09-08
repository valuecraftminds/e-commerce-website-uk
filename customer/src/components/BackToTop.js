import React, { useState, useEffect } from 'react';
import { FaRegArrowAltCircleUp } from 'react-icons/fa';
import '../styles/BackToTop.css';

const BackToTop = ({ scrollThreshold = 400 }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Back to top visibility handler
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  // Back to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {showBackToTop && (
        <FaRegArrowAltCircleUp 
          className="back-to-top-btn" 
          onClick={scrollToTop} 
          aria-label="Back to top"
        />
      )}
    </>
  );
};

export default BackToTop;
