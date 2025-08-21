import { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Modal, Spinner } from 'react-bootstrap';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import { AuthContext } from '../context/AuthContext';
import '../styles/Category.css';
import { FaPlus } from 'react-icons/fa';


    
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    main_category_name: '',
    parent_id: '',
    subcategories: [''] // Array of subcategory names
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const { userData } = useContext(AuthContext);
  const [license, setLicense] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  

  const company_code = userData?.company_code;


  const fetchCategories = useCallback(async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/categories/get-categories?company_code=${company_code}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        showMessage('error', 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('error', 'Error fetching categories');
    } finally {
      setFetchLoading(false);
    }
  }, [company_code]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/license/get-license/${company_code}`);
        const data = await response.json();
        if (data.success) {
          setLicense(data.license);
        }
      } catch (error) {
        console.error('Error fetching license:', error);
      }
    };

    if (company_code) {
      fetchLicense();
    }
  }, [company_code]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.main_category_name.trim()) {
      errors.main_category_name = 'Main category name is required';
    } else if (formData.main_category_name.trim().length < 2) {
      errors.main_category_name = 'Category name must be at least 2 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (editingCategory) {
        // Handle editing existing category
        const url = `${BASE_URL}/api/admin/categories/update-categories/${editingCategory.category_id}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category_name: formData.main_category_name.trim(),
            parent_id: formData.parent_id || null,
            company_code
          }),
        });

        const data = await response.json();
        if (data.success) {
          showMessage('success', data.message);
          resetForm();
          fetchCategories();
        } else {
          showMessage('error', data.message);
        }
      } else {
        // Check if this is adding subcategories to existing parent
        if (formData.parent_id) {
          // Adding subcategories to existing main category
          const validSubcategories = formData.subcategories.filter(sub => sub.trim());
          
          if (validSubcategories.length > 0) {
            const subPromises = validSubcategories.map(subcategory => 
              fetch(`${BASE_URL}/api/admin/categories/add-categories`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  category_name: subcategory.trim(),
                  parent_id: formData.parent_id,
                  company_code
                }),
              })
            );

            const subResponses = await Promise.all(subPromises);
            const subResults = await Promise.all(subResponses.map(res => res.json()));
            
            const successfulSubs = subResults.filter(result => result.success);
            const failedSubs = subResults.filter(result => !result.success);

            if (successfulSubs.length === validSubcategories.length) {
              showMessage('success', `Successfully added ${successfulSubs.length} subcategories`);
            } else if (successfulSubs.length > 0) {
              showMessage('success', `Added ${successfulSubs.length} subcategories. ${failedSubs.length} failed.`);
            } else {
              showMessage('error', 'Failed to add subcategories');
            }
            
            resetForm();
            fetchCategories();
          } else {
            showMessage('error', 'Please enter at least one subcategory name');
          }
        } else {
          // Creating new main category with optional subcategories
          const validSubcategories = formData.subcategories.filter(sub => sub.trim());
          
          // Create main category first
          const mainResponse = await fetch(`${BASE_URL}/api/admin/categories/add-categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category_name: formData.main_category_name.trim(),
              parent_id: null,
              company_code
            }),
          });

          const mainData = await mainResponse.json();
          
          if (mainData.success) {
            // Get the newly created category ID - handle different response structures
            const newMainCategoryId = mainData.category_id || mainData.category?.category_id || mainData.data?.category_id;
            
            if (!newMainCategoryId) {
              showMessage('error', 'Failed to get new category ID');
              return;
            }
            
            if (validSubcategories.length > 0) {
              // Create subcategories under the new main category
              const subPromises = validSubcategories.map(subcategory => 
                fetch(`${BASE_URL}/api/admin/categories/add-categories`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    category_name: subcategory.trim(),
                    parent_id: newMainCategoryId,
                    company_code
                  }),
                })
              );

              const subResponses = await Promise.all(subPromises);
              const subResults = await Promise.all(subResponses.map(res => res.json()));
              
              const successfulSubs = subResults.filter(result => result.success);
              const failedSubs = subResults.filter(result => !result.success);

              if (successfulSubs.length === validSubcategories.length) {
                showMessage('success', `Successfully created main category with ${successfulSubs.length} subcategories`);
              } else if (successfulSubs.length > 0) {
                showMessage('success', `Created main category with ${successfulSubs.length} subcategories. ${failedSubs.length} subcategories failed.`);
              } else {
                showMessage('error', 'Main category created but failed to create subcategories');
              }
            } else {
              showMessage('success', 'Main category created successfully');
            }
            
            resetForm();
            fetchCategories();
          } else {
            showMessage('error', mainData.message || 'Failed to create main category');
          }
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showMessage('error', 'Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      main_category_name: category.category_name,
      parent_id: category.parent_id || '',
      subcategories: ['']
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    const category = findCategoryById(categoryId);
    const hasSubcategories = category && category.subcategories && category.subcategories.length > 0;
    
    const confirmMessage = hasSubcategories
      ? `This category has ${category.subcategories.length} subcategories. Are you sure you want to delete it? All subcategories will also be deleted.`
      : 'Are you sure you want to delete this category?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/admin/categories/delete-categories/${categoryId}?company_code=${company_code}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchCategories();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage('error', 'Error deleting category');
    }
  };

  const resetForm = () => {
    setFormData({ 
      main_category_name: '',
      parent_id: '',
      subcategories: ['']
    });
    setEditingCategory(null);
    setFormErrors({});
    setShowModal(false);
  };

  const getMainCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  const getSubcategories = (mainCategoryId) => {
    const mainCat = categories.find(cat => cat.category_id === mainCategoryId);
    return mainCat && mainCat.subcategories ? mainCat.subcategories : [];
  };

  const findCategoryById = (id) => {
    for (const category of categories) {
      if (category.category_id === id) return category;
      if (category.subcategories) {
        const found = category.subcategories.find(sub => sub.category_id === id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAddSubcategory = (parentCategory) => {
    setFormData({
      main_category_name: parentCategory.category_name,
      parent_id: parentCategory.category_id,
      subcategories: ['']
    });
    setEditingCategory(null);
    setFormErrors({});
    setShowModal(true);
  };

  const addSubcategoryField = () => {
    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, '']
    });
  };

  const removeSubcategoryField = (index) => {
    if (formData.subcategories.length > 1) {
      const newSubcategories = formData.subcategories.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        subcategories: newSubcategories
      });
    }
  };

  const updateSubcategory = (index, value) => {
    const newSubcategories = [...formData.subcategories];
    newSubcategories[index] = value;
    setFormData({
      ...formData,
      subcategories: newSubcategories
    });
  };

  const handleAddCategoryClick = () => {
    if (!license) {
      setErrorMsg('Unable to verify category limit. Please try again.');
      return;
    }

    const mainCategoriesCount = getMainCategories().length;
    if (mainCategoriesCount >= license.category_count) {
      setErrorMsg(`Category limit (${license.category_count}) reached. Please upgrade your license to add more categories.`);
      return;
    }

    setShowModal(true);
    setErrorMsg('');
  };

  if (fetchLoading) {
    return (
      <Container fluid className="category-container d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading categories...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="category-container">
        <div className="category-header-section">
          <h1 className="category-main-title">Category Management</h1>
          <p className="category-subtitle">Organize your products with categories and subcategories</p>
        </div>

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg('')} className="custom-alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorMsg}
        </Alert>
      )}

      {message.text && (
        <Alert variant={message.type === 'success' ? 'success' : 'danger'} dismissible onClose={() => setMessage({ type: '', text: '' })} className="custom-alert">
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
          {message.text}
        </Alert>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <i className="bi bi-diagram-3"></i>
            </div>
            <h3>No categories found</h3>
            <p>Start organizing your products by creating your first category</p>
            <Button 
              variant="primary" 
              onClick={handleAddCategoryClick} 
              className="btn-custom-primary"
              size="lg"
            >
              <i className="bi bi-plus me-2"></i>
              Create Your First Category
            </Button>
          </div>
        </div>
      ) : (
        <div className="category-main-layout">
          <div className="main-category-bar">
            {getMainCategories().map((cat) => (
              <div
                key={cat.category_id}
                className={`main-category-item${selectedMainCategory === cat.category_id ? ' active' : ''}`}
                onClick={() => setSelectedMainCategory(cat.category_id)}
              >
                {cat.category_name}
                <span className="main-category-actions">
                  <PencilSquare
                    className="category-action-icon"
                    title="Edit"
                    onClick={e => { e.stopPropagation(); handleEdit(cat); }}
                  />
                  <Trash
                    className="category-action-icon"
                    title="Delete"
                    onClick={e => { e.stopPropagation(); handleDelete(cat.category_id); }}
                  />
                </span>
              </div>
            ))}
            <Button 
              variant="link"
              onClick={handleAddCategoryClick}
              className="add-category-btn"
            >
            <FaPlus size={14} style={{ marginRight: '8px' }} />
              Add Category
            </Button>
          </div>
          
          <div className="subcategories-container">
            {selectedMainCategory ? (
              getSubcategories(selectedMainCategory).length > 0 ? (
                <>
                  {getSubcategories(selectedMainCategory).map((subcat) => (
                    <div key={subcat.category_id} className="subcategory-item">
                      <span>{subcat.category_name}</span>
                      <span className="subcategory-actions-inline">
                        <PencilSquare
                          className="category-action-icon"
                          title="Edit"
                          onClick={() => handleEdit(subcat)}
                        />
                        <Trash
                          className="category-action-icon"
                          title="Delete"
                          onClick={() => handleDelete(subcat.category_id)}
                        />
                      </span>
                    </div>
                  ))}
                  <div className="add-subcategory-btn-row">
                    <Button 
                      variant="link"
                      onClick={() => handleAddSubcategory(findCategoryById(selectedMainCategory))}
                      className="add-category-btn"
                      size="sm"
                    >
            <FaPlus size={14} style={{ marginRight: '8px' }} />
                      Add Subcategory
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="no-subcategories-vertical">No subcategories found for this category.</div>
                  <div className="add-subcategory-btn-row">
                    <Button 
                      variant="outline-primary"
                      onClick={() => handleAddSubcategory(findCategoryById(selectedMainCategory))}
                      className="add-subcategory-btn"
                      size="sm"
                    >
                      <i className="bi bi-plus me-1"></i>
                      Add Subcategory
                    </Button>
                  </div>
                </>
              )
            ) : (
              <div className="no-main-category-selected">Select a main category to view subcategories.</div>
            )}
          </div>
        </div>
      )}

  <Modal show={showModal} onHide={resetForm} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory
              ? editingCategory.parent_id
                ? 'Edit Subcategory'
                : 'Edit Category'
              : formData.parent_id
                ? 'Add Subcategories'
                : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formData.parent_id && !editingCategory ? (
              // Adding subcategories to existing category
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Main Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.main_category_name}
                    disabled
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    Adding subcategories to this main category
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label>Subcategory Name(s)</Form.Label>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      type="button"
                      onClick={addSubcategoryField}
                    >
                      Add More
                    </Button>
                  </div>
                  {formData.subcategories.map((subcategory, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        value={subcategory}
                        onChange={(e) => updateSubcategory(index, e.target.value)}
                        placeholder={`Subcategory Name ${index + 1}`}
                      />
                      {formData.subcategories.length > 1 && (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          type="button"
                          onClick={() => removeSubcategoryField(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </Form.Group>
              </>
            ) : (
              // Creating new category or editing existing
              <>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {editingCategory && editingCategory.parent_id ? 'Subcategory Name' : 'Category Name'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.main_category_name}
                    onChange={(e) => {
                      setFormData({...formData, main_category_name: e.target.value});
                      if (formErrors.main_category_name) {
                        setFormErrors({...formErrors, main_category_name: ''});
                      }
                    }}
                    required
                    placeholder={editingCategory && editingCategory.parent_id ? 'Enter subcategory name' : 'Enter category name'}
                    isInvalid={!!formErrors.main_category_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.main_category_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                editingCategory 
                  ? 'Update Category' 
                  : formData.parent_id 
                    ? 'Add Subcategories'
                    : 'Add Category'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}