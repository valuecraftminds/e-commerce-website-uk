import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaFileAlt } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/FooterManagement.css';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Quill editor configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    [{ 'align': [] }],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'blockquote', 'code-block',
  'link', 'image', 'align', 'color', 'background'
];

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
    is_active: true
  });

  const [itemForm, setItemForm] = useState({
    item_title: '',
    item_url: '',
    is_external_link: false,
    is_active: true,
    // New fields for internal pages
    page_title: '',
    page_description: '',
    page_content: ''
  });

  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;

  // Fetch footer sections
  const fetchFooterSections = async () => {
    if (!company_code) return;
    
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
    if (company_code) {
      fetchFooterSections();
    }
  }, [company_code]);

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

  // Handle item submission with enhanced logic
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `${BASE_URL}/api/admin/footer/items/${editingItem.item_id}`
        : `${BASE_URL}/api/admin/footer/items`;
      
      const method = editingItem ? 'put' : 'post';
      
      // Prepare data based on link type
      let data = { ...itemForm };
      
      if (!editingItem) {
        data.footer_id = selectedFooterId;
      }

      // For internal links, ensure page content is provided
      if (!itemForm.is_external_link) {
        if (!itemForm.page_title || !itemForm.page_content) {
          setError('Page title and content are required for internal links');
          return;
        }
        // Clear URL for internal links (will be generated from title)
        data.item_url = '';
      } else {
        // For external links, ensure URL is provided and clear page content
        if (!itemForm.item_url) {
          setError('URL is required for external links');
          return;
        }
        data.page_title = '';
        data.page_content = '';
      }

      const response = await axios[method](url, data);

      if (response.data.success) {
        setSuccess(editingItem ? 'Item updated successfully' : 'Item created successfully');
        setShowItemModal(false);
        resetItemForm();
        fetchFooterSections();
      }
    } catch (err) {
      console.error('Error saving item:', err);
      setError(err.response?.data?.message || 'Failed to save item');
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
      is_active: true
    });
    setEditingSection(null);
  };

  const resetItemForm = () => {
    setItemForm({
      item_title: '',
      item_url: '',
      is_external_link: false,
      is_active: true,
      page_title: '',
      page_description: '',
      page_content: ''
    });
    setEditingItem(null);
    setSelectedFooterId(null);
  };

  // Edit handlers
  const editSection = (section) => {
    setEditingSection(section);
    setSectionForm({
      section_title: section.section_title,
      is_active: section.section_active
    });
    setShowSectionModal(true);
  };

  const editItem = async (item) => {
    setEditingItem(item);
    
    // If it's an internal link, fetch page content
    if (!item.is_external_link) {
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/footer/page-edit/${item.item_id}`);
        if (response.data.success) {
          const pageData = response.data.data;
          setItemForm({
            item_title: item.item_title,
            item_url: item.item_url,
            is_external_link: item.is_external_link,
            is_active: item.item_active,
            page_title: pageData.page_title || '',
            page_description: pageData.page_description || '',
            page_content: pageData.page_content || ''
          });
        }
      } catch (err) {
        console.error('Error fetching page content:', err);
        setError('Failed to fetch page content');
      }
    } else {
      setItemForm({
        item_title: item.item_title,
        item_url: item.item_url,
        is_external_link: item.is_external_link,
        is_active: item.item_active,
        page_title: '',
        page_description: '',
        page_content: ''
      });
    }
    
    setShowItemModal(true);
  };

  const addItem = (footerId) => {
    setSelectedFooterId(footerId);
    setShowItemModal(true);
  };

  // Handle link type change
  const handleLinkTypeChange = (isExternal) => {
    setItemForm({
      ...itemForm,
      is_external_link: isExternal,
      // Clear fields based on type
      item_url: isExternal ? itemForm.item_url : '',
      page_title: isExternal ? '' : itemForm.page_title,
      page_content: isExternal ? '' : itemForm.page_content
    });
  };

  if (!company_code) {
    return (
      <Container fluid className="p-4">
        <Alert variant="warning">
          Please log in to access footer management.
        </Alert>
      </Container>
    );
  }

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
                                <th>URL/Page</th>
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
                                    <div className="d-flex align-items-center">
                                      {item.is_external_link ? (
                                        <FaExternalLinkAlt className="me-2 text-warning" />
                                      ) : (
                                        <FaFileAlt className="me-2 text-info" />
                                      )}
                                      <code>{item.item_url || 'Generated from title'}</code>
                                    </div>
                                  </td>
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

      {/* Enhanced Item Modal with Tabs */}
      <Modal 
        show={showItemModal} 
        onHide={() => { setShowItemModal(false); resetItemForm(); }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Item' : 'Add Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleItemSubmit}>
          <Modal.Body>
            <Tabs defaultActiveKey="basic" id="item-tabs">
              <Tab eventKey="basic" title="Basic Info">
                <div className="pt-3">
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
                    <Form.Label>Link Type *</Form.Label>
                    <div>
                      <Form.Check
                        type="radio"
                        id="internal-link"
                        name="linkType"
                        label="Internal Page (with content)"
                        checked={!itemForm.is_external_link}
                        onChange={() => handleLinkTypeChange(false)}
                      />
                      <Form.Check
                        type="radio"
                        id="external-link"
                        name="linkType"
                        label="External Link"
                        checked={itemForm.is_external_link}
                        onChange={() => handleLinkTypeChange(true)}
                      />
                    </div>
                  </Form.Group>

                  {itemForm.is_external_link && (
                    <Form.Group className="mb-3">
                      <Form.Label>External URL *</Form.Label>
                      <Form.Control
                        type="url"
                        value={itemForm.item_url}
                        onChange={(e) => setItemForm({...itemForm, item_url: e.target.value})}
                        placeholder="https://facebook.com/yourcompany"
                        required
                      />
                      <Form.Text className="text-muted">
                        Enter the full URL including https://
                      </Form.Text>
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Active"
                      checked={itemForm.is_active}
                      onChange={(e) => setItemForm({...itemForm, is_active: e.target.checked})}
                    />
                  </Form.Group>
                </div>
              </Tab>

              {!itemForm.is_external_link && (
                <Tab eventKey="content" title="Page Content">
                  <div className="pt-3">
                    <Form.Group className="mb-3">
                      <Form.Label>Page Title *</Form.Label>
                      <Form.Control
                        type="text"
                        value={itemForm.page_title}
                        onChange={(e) => setItemForm({...itemForm, page_title: e.target.value})}
                        placeholder="Title for the page"
                        required={!itemForm.is_external_link}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Page Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={itemForm.page_description}
                        onChange={(e) => setItemForm({...itemForm, page_description: e.target.value})}
                        placeholder="Brief description of the page"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Page Content *</Form.Label>
                      <ReactQuill
                        theme="snow"
                        value={itemForm.page_content}
                        onChange={(content) => setItemForm({...itemForm, page_content: content})}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write your page content here. Use the toolbar above for formatting."
                        style={{ 
                          height: '300px',
                          marginBottom: '50px'
                        }}
                      />
                      <Form.Text className="text-muted">
                        Use the rich text editor to format your content. You can add headings, lists, links, and more.
                      </Form.Text>
                    </Form.Group>
                  </div>
                </Tab>
              )}
            </Tabs>
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
