import React, { useState, useEffect,useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../styles/FooterManagement.css';
import { AuthContext } from '../../context/AuthContext';


const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function AddFooter() {
  const [footerSections, setFooterSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFooterId, setSelectedFooterId] = useState(null);

  // Form states
  const [sectionForm, setSectionForm] = useState({
    section_title: '',
    section_order: 1,
    is_active: true
  });

  const [itemForm, setItemForm] = useState({
    item_title: '',
    item_url: '',
    item_order: 1,
    is_external_link: false,
    is_active: true
  });

  const { userData } = useContext(AuthContext);
    const company_code = userData?.company_code;

  // Fetch footer sections
  const fetchFooterSections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/admin/footer/sections`, {
        params: { company_code: company_code }
      });
      
      if (response.data.success) {
        setFooterSections(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching footer sections:', err);
      setError('Failed to fetch footer sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterSections();
  }, []);

  // Handle section submission
  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSection 
        ? `${BASE_URL}/api/admin/footer/sections/${editingSection.footer_id}`
        : `${BASE_URL}/api/admin/footer/sections`;
      
      const method = editingSection ? 'put' : 'post';
      const data = editingSection 
        ? sectionForm 
        : { ...sectionForm, company_code: company_code };

      const response = await axios[method](url, data);

      if (response.data.success) {
        setSuccess(editingSection ? 'Section updated successfully' : 'Section created successfully');
        setShowSectionModal(false);
        resetSectionForm();
        fetchFooterSections();
      }
    } catch (err) {
      console.error('Error saving section:', err);
      setError('Failed to save section');
    }
  };

  // Handle item submission
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `${BASE_URL}/api/admin/footer/items/${editingItem.item_id}`
        : `${BASE_URL}/api/admin/footer/items`;
      
      const method = editingItem ? 'put' : 'post';
      const data = editingItem 
        ? itemForm 
        : { ...itemForm, footer_id: selectedFooterId };

      const response = await axios[method](url, data);

      if (response.data.success) {
        setSuccess(editingItem ? 'Item updated successfully' : 'Item created successfully');
        setShowItemModal(false);
        resetItemForm();
        fetchFooterSections();
      }
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item');
    }
  };

  // Delete section
  const deleteSection = async (footerId) => {
    if (!window.confirm('Are you sure you want to delete this section? This will also delete all items in this section.')) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/admin/footer/sections/${footerId}`);
      
      if (response.data.success) {
        setSuccess('Section deleted successfully');
        fetchFooterSections();
      }
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Failed to delete section');
    }
  };

  // Delete item
  const deleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/admin/footer/items/${itemId}`);
      
      if (response.data.success) {
        setSuccess('Item deleted successfully');
        fetchFooterSections();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  // Reset forms
  const resetSectionForm = () => {
    setSectionForm({
      section_title: '',
      section_order: 1,
      is_active: true
    });
    setEditingSection(null);
  };

  const resetItemForm = () => {
    setItemForm({
      item_title: '',
      item_url: '',
      item_order: 1,
      is_external_link: false,
      is_active: true
    });
    setEditingItem(null);
    setSelectedFooterId(null);
  };

  // Edit handlers
  const editSection = (section) => {
    setEditingSection(section);
    setSectionForm({
      section_title: section.section_title,
      section_order: section.section_order,
      is_active: section.section_active
    });
    setShowSectionModal(true);
  };

  const editItem = (item) => {
    setEditingItem(item);
    setItemForm({
      item_title: item.item_title,
      item_url: item.item_url,
      item_order: item.item_order,
      is_external_link: item.is_external_link,
      is_active: item.item_active
    });
    setShowItemModal(true);
  };

  const addItem = (footerId) => {
    setSelectedFooterId(footerId);
    setShowItemModal(true);
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Footer Management</h4>
              <Button variant="primary" onClick={() => setShowSectionModal(true)}>
                <FaPlus /> Add Section
              </Button>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}

              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <div>
                  {footerSections.map((section) => (
                    <Card key={section.footer_id} className="mb-3">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-0">
                            {section.section_title}
                            <Badge 
                              variant={section.section_active ? 'success' : 'secondary'} 
                              className="ms-2"
                            >
                              {section.section_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </h5>
                          <small className="text-muted">Order: {section.section_order}</small>
                        </div>
                        <div>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="me-2"
                            onClick={() => addItem(section.footer_id)}
                          >
                            <FaPlus /> Add Item
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => editSection(section)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => deleteSection(section.footer_id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {section.items && section.items.length > 0 ? (
                          <Table responsive size="sm">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>URL</th>
                                <th>Order</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.items.map((item) => (
                                <tr key={item.item_id}>
                                  <td>{item.item_title}</td>
                                  <td>
                                    <code>{item.item_url || 'N/A'}</code>
                                  </td>
                                  <td>{item.item_order}</td>
                                  <td>
                                    <Badge variant={item.is_external_link ? 'warning' : 'info'}>
                                      {item.is_external_link ? 'External' : 'Internal'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge variant={item.item_active ? 'success' : 'secondary'}>
                                      {item.item_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="me-2"
                                      onClick={() => editItem(item)}
                                    >
                                      <FaEdit />
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => deleteItem(item.item_id)}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <p className="text-muted mb-0">No items in this section</p>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                  
                  {footerSections.length === 0 && (
                    <div className="text-center text-muted">
                      <p>No footer sections found. Create your first section to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Section Modal */}
      <Modal show={showSectionModal} onHide={() => { setShowSectionModal(false); resetSectionForm(); }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingSection ? 'Edit Section' : 'Add Section'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSectionSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Section Title *</Form.Label>
              <Form.Control
                type="text"
                value={sectionForm.section_title}
                onChange={(e) => setSectionForm({...sectionForm, section_title: e.target.value})}
                required
                placeholder="e.g., Corporate Info, Customer Service"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Order</Form.Label>
              <Form.Control
                type="number"
                value={sectionForm.section_order}
                onChange={(e) => setSectionForm({...sectionForm, section_order: parseInt(e.target.value)})}
                min="1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={sectionForm.is_active}
                onChange={(e) => setSectionForm({...sectionForm, is_active: e.target.checked})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowSectionModal(false); resetSectionForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSection ? 'Update' : 'Create'} Section
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Item Modal */}
      <Modal show={showItemModal} onHide={() => { setShowItemModal(false); resetItemForm(); }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Item' : 'Add Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleItemSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Item Title *</Form.Label>
              <Form.Control
                type="text"
                value={itemForm.item_title}
                onChange={(e) => setItemForm({...itemForm, item_title: e.target.value})}
                required
                placeholder="e.g., About Us, FAQ, Facebook"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                type="text"
                value={itemForm.item_url}
                onChange={(e) => setItemForm({...itemForm, item_url: e.target.value})}
                placeholder="e.g., /about, https://facebook.com"
              />
              <Form.Text className="text-muted">
                Use relative paths for internal links (/about) or full URLs for external links
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Order</Form.Label>
              <Form.Control
                type="number"
                value={itemForm.item_order}
                onChange={(e) => setItemForm({...itemForm, item_order: parseInt(e.target.value)})}
                min="1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="External Link"
                checked={itemForm.is_external_link}
                onChange={(e) => setItemForm({...itemForm, is_external_link: e.target.checked})}
              />
              <Form.Text className="text-muted">
                Check this if the link goes to an external website
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={itemForm.is_active}
                onChange={(e) => setItemForm({...itemForm, is_active: e.target.checked})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowItemModal(false); resetItemForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItem ? 'Update' : 'Create'} Item
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
