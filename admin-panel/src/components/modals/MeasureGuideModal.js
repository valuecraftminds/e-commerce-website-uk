import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
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
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
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