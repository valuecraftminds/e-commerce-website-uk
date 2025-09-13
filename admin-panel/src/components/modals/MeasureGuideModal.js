import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import ImagePreviewModal from './ImagePreviewModal';
import '../../styles/MeasureGuideModal.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MeasureGuideModal = ({ 
  show, 
  onHide, 
  onSave, 
  title = "Add Measure Guide",
  companyCode,
  styleNumber
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    style_number: styleNumber || '',
    image: null
  });
  const [existingGuide, setExistingGuide] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [allMeasureGuides, setAllMeasureGuides] = useState([]);

  // Fetch all measure guides when modal opens
  useEffect(() => {
    const fetchAllGuides = async () => {
      if (show && companyCode) {
        try {
          const response = await fetch(`${BASE_URL}/api/admin/measure-guides?company_code=${companyCode}`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          if (data.success) {
            setAllMeasureGuides(data.measure_guides || []);
          } else {
            setAllMeasureGuides([]);
          }
        } catch (err) {
          setAllMeasureGuides([]);
        }
      } else {
        setAllMeasureGuides([]);
      }
    };
    fetchAllGuides();
  }, [show, companyCode]);

  // Delete measure guide handler
  const handleDeleteGuide = async (guideId, event) => {
    // Prevent event bubbling to avoid triggering the guide item click
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this measure guide?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${BASE_URL}/api/admin/measure-guides/${guideId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Measure guide deleted successfully!');
        // Refresh guides list
        setAllMeasureGuides(prev => prev.filter(g => g.id !== guideId));
        // If deleted guide is the one currently shown as existing, clear it
        if (existingGuide && existingGuide.id === guideId) {
          setExistingGuide(null);
        }
        // Remove success label after 1.5s
        setTimeout(() => setSuccess(''), 1500);
      } else {
        setError(data.message || 'Failed to delete measure guide');
      }
    } catch (err) {
      setError('Error deleting measure guide: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle guide item click to show image
  const handleGuideItemClick = (guide) => {
    console.log('Guide clicked:', guide);
    // Check for both possible image URL properties from backend
    const imageUrl = guide.image_url || guide.full_image_url;
    console.log('Image URL:', imageUrl);
    
    if (imageUrl) {
      // If it's a relative path, make it absolute
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
      setPreviewImage(fullImageUrl);
    } else {
      console.log('No image URL found for guide');
    }
  };

  // Fetch main categories when modal opens
  useEffect(() => {
    if (show && companyCode) {
      fetchMainCategories();
    }
  }, [show, companyCode]);

  // Fetch main categories from backend
  const fetchMainCategories = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/categories/get-categories?company_code=${companyCode}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      setError('Error fetching categories: ' + err.message);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show) {
      setError('');
      setSuccess('');
      setFormData({
        image: null,
        styleNumber: styleNumber || ''
      });
      setPreviewImage(null); // Reset preview image when modal opens
    }
  }, [show, styleNumber]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleSave = async () => {
    // Validate required fields
      if (!formData.image) {
      setError('Please select an image');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('company_code', companyCode);
      formDataToSend.append('style_number', formData.styleNumber);
      formDataToSend.append('image', formData.image);

      const response = await fetch(`${BASE_URL}/api/admin/measure-guides`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Measure guide added successfully!');
        // Refresh the guides list
        const updatedResponse = await fetch(`${BASE_URL}/api/admin/measure-guides?company_code=${companyCode}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        const updatedData = await updatedResponse.json();
        if (updatedData.success) {
          setAllMeasureGuides(updatedData.measure_guides || []);
        }
        
        if (onSave) {
          onSave('Measure guide added successfully!');
        }
        setTimeout(() => {
          onHide();
        }, 1500);
      } else {
        setError(data.message || 'Failed to save measure guide');
      }
    } catch (err) {
      setError('Error saving measure guide: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      backdrop="static"
      className='measure-guide-modal'
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {/* Display all existing measure guides */}
        {allMeasureGuides.length > 0 && (
          <div className="mb-4">
            <h5>Existing Measure Guides</h5>
            <div className="existing-measure-guides">
              {allMeasureGuides.map((guide) => {
                const imageUrl = guide?.full_image_url || guide?.image_url || guide?.image_path;
                let displayImageUrl = '';
                if (guide?.full_image_url) {
                  displayImageUrl = guide.full_image_url;
                } else if (guide?.image_path) {
                  displayImageUrl = `${BASE_URL}/uploads/measure-guides/${guide.image_path}`;
                } else if (guide?.image_url) {
                  displayImageUrl = guide.image_url.startsWith('http') ? guide.image_url : `${BASE_URL}${guide.image_url}`;
                }

                return (
                  <div
                    key={guide.measure_guide_id || guide.id}
                    className='existing-guide-items'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGuideItemClick(guide);
                    }}
                    title="Click to view full image"
                  >
                    {displayImageUrl && (
                      <img
                        src={displayImageUrl}
                        className='mg-image'
                        onError={(e) => {
                          console.error('Image failed to load:', displayImageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className='style'>
                      {guide.style_name}
                    </div>

                    <button
                      type="button"
                      className='mg-remove-btn'
                      title="Delete measure guide"
                      disabled={loading}
                      onClick={(event) => {
                        console.log('Delete button clicked');
                        handleDeleteGuide(guide.id || guide.measure_guide_id, event);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        <ImagePreviewModal 
          show={!!previewImage}
          onHide={() => setPreviewImage(null)}
          previewImage={previewImage}
          setError={setError}
        />
        
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Measure Guide Image *</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              required
            />
            <Form.Text className="text-muted">
              Upload an image showing how to take measurements for this category
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Measure Guide'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MeasureGuideModal;