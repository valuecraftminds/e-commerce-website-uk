import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import '../styles/SizeGuideModal.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const SizeGuideModal = ({ show, onHide, styleNumber }) => {
  const [sizeGuideContent, setSizeGuideContent] = useState('');
  const [processedContent, setProcessedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && styleNumber) {
      fetchSizeGuide();
    }
  }, [show, styleNumber]);

  // Process the HTML content to hide empty rows
  const processHtmlContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find the table in the content
    const table = tempDiv.querySelector('table');
    if (!table) return htmlContent; // Return original if no table found
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return htmlContent; // Return original if no tbody found
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 1) { // Skip if not enough cells
        // Check if all cells except the first one (measurement name) are empty
        let hasData = false;
        for (let i = 1; i < cells.length; i++) {
          const cellText = cells[i].textContent.trim();
          if (cellText && cellText !== '') {
            hasData = true;
            break;
          }
        }
        
        // Hide the row if no data found
        if (!hasData) {
          row.style.display = 'none';
        }
      }
    });
    
    return tempDiv.innerHTML;
  };

  useEffect(() => {
    if (sizeGuideContent) {
      const processed = processHtmlContent(sizeGuideContent);
      setProcessedContent(processed);
    }
  }, [sizeGuideContent]);

  const fetchSizeGuide = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${BASE_URL}/api/customer/size-guide/${styleNumber}`, {
        params: { company_code: COMPANY_CODE }
      });

      if (response.data.success && response.data.size_guide) {
        setSizeGuideContent(response.data.size_guide.size_guide_content);
      } else {
        setError('Size guide not available for this product');
      }
    } catch (err) {
      console.error('Error fetching size guide:', err);
      if (err.response?.status === 404) {
        setError('Size guide not available for this product');
      } else {
        setError('Failed to load size guide. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSizeGuideContent('');
    setProcessedContent('');
    setError('');
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="xl"
      centered
      className="size-guide-modal"
      scrollable={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Size Guide</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading size guide...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="alert alert-warning" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          </div>
        ) : processedContent ? (
          <div 
            className="size-guide-content"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        ) : sizeGuideContent ? (
          <div 
            className="size-guide-content"
            dangerouslySetInnerHTML={{ __html: sizeGuideContent }}
          />
        ) : (
          <div className="text-center py-4">
            <p>No size guide content available.</p>
          </div>
        )}
        <div className='alert alert-info mt-3' role='alert'>
          <i className="fas fa-info-circle me-2"></i>
          All sizes are in inches unless otherwise stated.
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SizeGuideModal;
