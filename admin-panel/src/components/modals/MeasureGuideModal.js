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
  companyCode 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [formData, setFormData] = useState({
    main_category_id: '',
    sub_category_id: '',
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

      const data = await response.json();
      if (data.success) {
        // Filter only main categories (those without parent_id)
        const mainCats = data.categories.filter(cat => !cat.parent_id);
        setMainCategories(mainCats || []);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('Error fetching categories: ' + err.message);
    }
  };

  // Fetch subcategories when main category changes
  const fetchSubCategories = async (mainCategoryId) => {
    if (!mainCategoryId) {
      setSubCategories([]);
      return;
    }

    setLoadingSubcategories(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/categories/subcategories/${mainCategoryId}?company_code=${companyCode}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSubCategories(data.subcategories || []);
      } else {
        setError('Failed to fetch subcategories');
        setSubCategories([]);
      }
    } catch (err) {
      setError('Error fetching subcategories: ' + err.message);
      setSubCategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show) {
      setError('');
      setSuccess('');
      setSubCategories([]);
      setFormData({
        main_category_id: '',
        sub_category_id: '',
        image: null
      });
      setPreviewImage(null); // Reset preview image when modal opens
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If main category changes, fetch subcategories and reset subcategory selection
    if (name === 'main_category_id') {
      setFormData(prev => ({
        ...prev,
        sub_category_id: '' // Reset subcategory when main category changes
      }));
      fetchSubCategories(value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.main_category_id) {
      setError('Please select a main category');
      return;
    }

    if (!formData.sub_category_id) {
      setError('Please select a subcategory');
      return;
    }

    if (!formData.image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('company_code', companyCode);
      formDataToSend.append('main_category_id', formData.main_category_id);
      formDataToSend.append('sub_category_id', formData.sub_category_id);
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
          onSave(data);
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
                // Get the image URL (handle both possible property names)
                const imageUrl = guide.image_url || guide.full_image_url;
                const displayImageUrl = imageUrl && imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
                
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
                    {imageUrl && (
                      <img 
                        src={displayImageUrl} 
                        alt="Guide Thumbnail"
                        className='mg-image' 
                        onError={(e) => {
                          console.error('Image failed to load:', displayImageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className='main-cat' style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {guide.main_category_name || 'Main Category'}
                    </div>
                    <div className='sub-cat' style={{ color: '#666', fontSize: '14px' }}>
                      {guide.sub_category_name || 'Subcategory'}
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
            <Form.Label>Main Category *</Form.Label>
            <Form.Select
              name="main_category_id"
              value={formData.main_category_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a main category</option>
              {mainCategories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Subcategory *</Form.Label>
            <Form.Select
              name="sub_category_id"
              value={formData.sub_category_id}
              onChange={handleInputChange}
              required
              disabled={!formData.main_category_id || loadingSubcategories}
            >
              <option value="">
                {loadingSubcategories ? 'Loading subcategories...' : 'Select a subcategory'}
              </option>
              {subCategories.map((subcategory) => (
                <option key={subcategory.category_id} value={subcategory.category_id}>
                  {subcategory.category_name}
                </option>
              ))}
            </Form.Select>
            {!formData.main_category_id && (
              <Form.Text className="text-muted">
                Please select a main category first
              </Form.Text>
            )}
          </Form.Group>

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