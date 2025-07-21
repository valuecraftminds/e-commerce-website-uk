import React, { useCallback, useEffect, useState } from 'react';
import { Accordion, Alert, Badge, Button, Card, Container, Form, Modal, Spinner } from 'react-bootstrap';
import '../styles/Category.css';
    
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
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);

  const fetchCategories = useCallback(async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/get-categories`);
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
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
        const url = `${BASE_URL}/api/update-categories/${editingCategory.category_id}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category_name: formData.main_category_name.trim(),
            parent_id: formData.parent_id || null
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
              fetch(`${BASE_URL}/api/add-categories`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  category_name: subcategory.trim(),
                  parent_id: formData.parent_id
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
          
          if (validSubcategories.length === 0) {
            // Create main category only
            const response = await fetch(`${BASE_URL}/api/add-categories`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                category_name: formData.main_category_name.trim(),
                parent_id: null
              }),
            });

            const data = await response.json();
            if (data.success) {
              showMessage('success', 'Main category created successfully');
              resetForm();
              fetchCategories();
            } else {
              showMessage('error', data.message);
            }
          } else {
            // Create main category first, then subcategories
            const mainResponse = await fetch(`${BASE_URL}/api/add-categories`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                category_name: formData.main_category_name.trim(),
                parent_id: null
              }),
            });

            const mainData = await mainResponse.json();
            
            if (mainData.success) {
              // Get the newly created main category ID
              const newMainCategoryId = mainData.category.category_id;
              
              // Create subcategories under the new main category
              const subPromises = validSubcategories.map(subcategory => 
                fetch(`${BASE_URL}/api/add-categories`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    category_name: subcategory.trim(),
                    parent_id: newMainCategoryId
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
              
              resetForm();
              fetchCategories();
            } else {
              showMessage('error', mainData.message);
            }
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
      const response = await fetch(`${BASE_URL}/api/delete-categories/${categoryId}`, {
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="category-main-title">Category Management</h1>
            <p className="category-subtitle">Organize your products with categories and subcategories</p>
          </div>
          <Button 
            variant="primary"
            onClick={() => setShowModal(true)}
            className="btn-custom-primary"
            size="lg"
          >
            <i className="bi bi-plus me-2"></i>
            Add Category
          </Button>
        </div>

        <div className="category-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{getMainCategories().length}</div>
              <div className="stat-label">Main Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {categories.reduce((total, cat) => total + (cat.subcategories?.length || 0), 0)}
              </div>
              <div className="stat-label">Subcategories</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{categories.length}</div>
              <div className="stat-label">Total Categories</div>
            </div>
          </div>
        </div>
      </div>

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
              onClick={() => setShowModal(true)} 
              className="btn-custom-primary"
              size="lg"
            >
              <i className="bi bi-plus me-2"></i>
              Create Your First Category
            </Button>
          </div>
        </div>
      ) : (
        <div className="category-accordion-container">
          <Card className="accordion-wrapper-card">
            <Card.Body className="p-0">
              <Accordion 
                activeKey={activeAccordionKey} 
                onSelect={(key) => setActiveAccordionKey(key)}
                className="category-accordion"
              >
                {getMainCategories().map((category, index) => (
                  <Accordion.Item 
                    eventKey={category.category_id.toString()} 
                    key={category.category_id}
                    className="category-accordion-item"
                  >
                    <Accordion.Header className="category-accordion-header">
                      <div className="accordion-header-content">
                        <div className="category-icon-section">
                          <i className="bi bi-folder category-folder-icon"></i>
                        </div>
                        <div className="category-header-info">
                          <h5 className="category-header-title">{category.category_name}</h5>
                          <div className="category-header-badges">
                            <Badge bg="primary" className="me-2">Main Category</Badge>
                            {category.subcategories && category.subcategories.length > 0 && (
                              <Badge bg="secondary">
                                {category.subcategories.length} Subcategories
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="category-header-actions" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="me-2 action-btn-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSubcategory(category);
                            }}
                            title="Add Subcategory"
                          >
                            <i className="bi bi-plus"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            className="me-2 action-btn-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(category);
                            }}
                            title="Edit Category"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="action-btn-header"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(category.category_id);
                            }}
                            title="Delete Category"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </Accordion.Header>
                    
                    <Accordion.Body className="category-accordion-body">
                      {category.subcategories && category.subcategories.length > 0 ? (
                        <div className="subcategories-list">
                          {category.subcategories.map((subcategory, subIndex) => (
                            <div key={subcategory.category_id} className="subcategory-card">
                              <div className="subcategory-content">
                                <div className="subcategory-info">
                                  <div className="subcategory-icon">
                                    <i className="bi bi-folder2-open"></i>
                                  </div>
                                  <div className="subcategory-details">
                                    <h6 className="subcategory-title">{subcategory.category_name}</h6>
                                    <Badge bg="warning" text="dark" className="subcategory-badge">
                                      Subcategory
                                    </Badge>
                                  </div>
                                </div>
                                <div className="subcategory-actions">
                                  <Button 
                                    variant="outline-warning" 
                                    size="sm" 
                                    className="me-2 subcategory-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(subcategory);
                                    }}
                                    title="Edit Subcategory"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    className="subcategory-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(subcategory.category_id);
                                    }}
                                    title="Delete Subcategory"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-subcategories">
                          <div className="no-subcategories-content">
                            <i className="bi bi-info-circle me-2"></i>
                            <span>No subcategories found for this category.</span>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="ms-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSubcategory(category);
                              }}
                            >
                              <i className="bi bi-plus me-1"></i>
                              Add First Subcategory
                            </Button>
                          </div>
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>
        </div>
      )}

      <Modal show={showModal} onHide={resetForm} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory 
              ? `Edit ${editingCategory.parent_id ? 'Subcategory' : 'Category'}` 
              : formData.parent_id 
                ? 'Add Subcategories'
                : 'Add New Category'
            }
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formData.parent_id && !editingCategory ? (
              // Adding subcategories to existing category
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Parent Category</Form.Label>
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
                    <Form.Label>New Subcategories</Form.Label>
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
                        placeholder={`Subcategory ${index + 1}`}
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
                  <Form.Label>Main Category Name</Form.Label>
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
                    placeholder="Enter main category name"
                    isInvalid={!!formErrors.main_category_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.main_category_name}
                  </Form.Control.Feedback>
                </Form.Group>

                {!editingCategory && (
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label>Subcategories (Optional)</Form.Label>
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
                          placeholder={`Subcategory ${index + 1}`}
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
                    
                    <Form.Text className="text-muted">
                      Leave empty to create only a main category
                    </Form.Text>
                  </Form.Group>
                )}

                {editingCategory && editingCategory.parent_id && (
                  <Form.Group className="mb-3">
                    <Form.Label>Parent Category (Optional)</Form.Label>
                    <Form.Select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                      disabled={editingCategory && editingCategory.parent_id}
                    >
                      <option value="">None (Main Category)</option>
                      {getMainCategories()
                        .filter(cat => !editingCategory || cat.category_id !== editingCategory.category_id)
                        .map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
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