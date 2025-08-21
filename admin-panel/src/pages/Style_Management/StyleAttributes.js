import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Style.css';


import ColorManagement from './ColorManagement';
import SizeManagement from './SizeManagement';
import MaterialManagement from './MaterialManagement';
import FitManagement from './FitManagement';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function StyleAttributes() { 
 const { styleCode } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);

  const [style, setStyle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [allColors, setAllColors] = useState([]);
  const [allSizes, setAllSizes] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [allFits, setAllFits] = useState([]);

  const [styleColors, setStyleColors] = useState([]);
  const [styleSizes, setStyleSizes] = useState([]);
  const [styleMaterials, setStyleMaterials] = useState([]);
  const [styleFits, setStyleFits] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // New: Show management form states
  const [showColorForm, setShowColorForm] = useState(false);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showFitForm, setShowFitForm] = useState(false);

  const [activeTab, setActiveTab] = useState('colors');
  const company_code = userData?.company_code;

  // Fetch style details
  const fetchStyleDetails = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-style/${styleCode}?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setStyle(data.style);
      } else {
        setError('Style not found');
      }
    } catch (err) {
      setError('Error fetching style details');
    }
  }, [styleCode, company_code]);

  // Fetch all available attributes
  const fetchAllAttributes = useCallback(async () => {
    try {
      const [colorsRes, sizesRes, materialsRes, fitsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/colors/get-colors?company_code=${company_code}`),
        fetch(`${BASE_URL}/api/admin/sizes/get-sizes?company_code=${company_code}`),
        fetch(`${BASE_URL}/api/admin/materials/get-materials?company_code=${company_code}`),
        fetch(`${BASE_URL}/api/admin/fits/get-fits?company_code=${company_code}`)
      ]);

      const [colorsData, sizesData, materialsData, fitsData] = await Promise.all([
        colorsRes.json(),
        sizesRes.json(),
        materialsRes.json(),
        fitsRes.json()
      ]);

      if (colorsData.success) setAllColors(colorsData.colors);
      if (sizesData.success) setAllSizes(sizesData.sizes);
      if (materialsData.success) setAllMaterials(materialsData.materials);
      if (fitsData.success) setAllFits(fitsData.fits);
    } catch (err) {
      setError('Error fetching attributes');
    }
  }, [company_code]);

  // Fetch style-specific attributes
  const fetchStyleAttributes = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-style-attributes/${styleCode}?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setStyleColors(data.colors || []);
        setStyleSizes(data.sizes || []);
        setStyleMaterials(data.materials || []);
        setStyleFits(data.fits || []);
      }
    } catch (err) {
      setError('Error fetching style attributes');
    }
  }, [styleCode, company_code]);

  useEffect(() => {
    fetchStyleDetails();
    fetchAllAttributes();
    fetchStyleAttributes();
  }, [fetchStyleDetails, fetchAllAttributes, fetchStyleAttributes]);

  const handleOpenModal = (type) => {
    setModalType(type);
    setSelectedItems([]);
    setShowModal(true);
  };

  const handleAttributeToggle = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSaveAttributes = async () => {
    if (selectedItems.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/add-style-attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          style_code: styleCode,
          company_code,
          type: modalType,
          attribute_ids: selectedItems
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`${modalType} added successfully!`);
        setShowModal(false);
        fetchStyleAttributes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || `Error adding ${modalType}`);
      }
    } catch (err) {
      setError(`Error adding ${modalType}`);
    }
    setLoading(false);
  };

  const handleRemoveAttribute = async (type, attributeId) => {
    if (window.confirm(`Are you sure you want to remove this ${type.slice(0, -1)}?`)) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/styles/remove-style-attribute`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            style_code: styleCode,
            company_code,
            type,
            attribute_id: attributeId
          })
        });

        const data = await response.json();
        if (data.success) {
          setSuccess(`${type.slice(0, -1)} removed successfully!`);
          fetchStyleAttributes();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(data.message || `Error removing ${type.slice(0, -1)}`);
        }
      } catch (err) {
        setError(`Error removing ${type.slice(0, -1)}`);
      }
    }
  };

  const getAvailableItems = () => {
    let allItems = [];
    let styleItems = [];

    switch (modalType) {
      case 'colors':
        allItems = allColors;
        styleItems = styleColors;
        break;
      case 'sizes':
        allItems = allSizes;
        styleItems = styleSizes;
        break;
      case 'materials':
        allItems = allMaterials;
        styleItems = styleMaterials;
        break;
      case 'fits':
        allItems = allFits;
        styleItems = styleFits;
        break;
      default:
        return [];
    }

    const styleItemIds = styleItems.map(item => {
      switch (modalType) {
        case 'colors': return item.color_id;
        case 'sizes': return item.size_id;
        case 'materials': return item.material_id;
        case 'fits': return item.fit_id;
        default: return null;
      }
    });

    return allItems.filter(item => {
      const itemId = modalType === 'colors' ? item.color_id :
                    modalType === 'sizes' ? item.size_id :
                    modalType === 'materials' ? item.material_id :
                    item.fit_id;
      return !styleItemIds.includes(itemId);
    });
  };

  // Render two-column layout: left = Add New, right = Add Existing (table + assign)
  const renderAttributeSection = (title, items, type) => (
    <Row className="mb-4">
      {/* Left: Add New */}
      <Col md={6}>
        
          
          <Card.Body>
            {type === 'colors' && (
              <ColorManagement
                embedded
                styleCode={styleCode}
                companyCode={company_code}
                onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
                onCancel={() => {}}
              />
            )}
            {type === 'sizes' && (
              <SizeManagement
                embedded
                styleCode={styleCode}
                companyCode={company_code}
                onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
                onCancel={() => {}}
              />
            )}
            {type === 'materials' && (
              <MaterialManagement
                embedded
                styleCode={styleCode}
                companyCode={company_code}
                onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
                onCancel={() => {}}
              />
            )}
            {type === 'fits' && (
              <FitManagement
                embedded
                styleCode={styleCode}
                companyCode={company_code}
                onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
                onCancel={() => {}}
              />
            )}
          </Card.Body>
      </Col>
      {/* Right: Add Existing */}
      <Col md={6}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{title} Assigned</h5>
            <Button 
              variant="primary" 
              className='add-style-btn'
              size="sm" 
              onClick={() => handleOpenModal(type)}
            >
              <FaPlus className="me-2" />
              Add Existing {title.slice(0, -1)}
            </Button>
          </Card.Header>
          <Card.Body>
            {items.length === 0 ? (
              <p className="text-muted text-center">No {title.toLowerCase()} added yet.</p>
            ) : (
              <Table responsive striped size="sm" className="table-organized">
                <thead>
                  <tr style={{ verticalAlign: 'middle' }}>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ minWidth: '120px' }}>Name</th>
                    {type === 'colors' && <th style={{ minWidth: '80px' }}>Code</th>}
                    {(type === 'materials' || type === 'fits') && <th style={{ minWidth: '120px' }}>Description</th>}
                    <th style={{ width: '70px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ verticalAlign: 'middle', height: '36px' }}>
                      <td>{index + 1}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {type === 'colors' ? item.color_name :
                         type === 'sizes' ? item.size_name :
                         type === 'materials' ? item.material_name :
                         item.fit_name}
                      </td>
                      {type === 'colors' && <td style={{ fontFamily: 'monospace' }}>{item.color_code}</td>}
                      {(type === 'materials' || type === 'fits') && <td>{item.description || '-'}</td>}
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          className="py-0 px-2"
                          style={{ fontSize: '0.9rem', lineHeight: 1 }}
                          onClick={() => handleRemoveAttribute(type, 
                            type === 'colors' ? item.color_id :
                            type === 'sizes' ? item.size_id :
                            type === 'materials' ? item.material_id :
                            item.fit_id
                          )}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2 p-4">
        <div>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/style')}
            className="me-3"
          >
            <FaArrowLeft className="me-2" />
            Back
          </Button>
          <h2 className="d-inline">
            Manage Attributes - {style?.name || 'Loading...'}
          </h2>
        </div>
        {style && (
          <Badge bg="info" className="fs-6">
            Style Code: {style.style_code}
          </Badge>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs for Attributes */}
      <Tabs
        id="style-attributes-tabs"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        justify
      >
        <Tab eventKey="colors" title="Colors">
          {renderAttributeSection('Colors', styleColors, 'colors')}
        </Tab>
        <Tab eventKey="sizes" title="Sizes">
          {renderAttributeSection('Sizes', styleSizes, 'sizes')}
        </Tab>
        <Tab eventKey="materials" title="Materials">
          {renderAttributeSection('Materials', styleMaterials, 'materials')}
        </Tab>
        <Tab eventKey="fits" title="Fits">
          {renderAttributeSection('Fits', styleFits, 'fits')}
        </Tab>
      </Tabs>

      {/* Selection Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Add {modalType.charAt(0).toUpperCase() + modalType.slice(1, -1)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {getAvailableItems().length === 0 ? (
            <p className="text-center text-muted">
              All available {modalType} have already been added to this style.
            </p>
          ) : (
            <div>
              <p>Select {modalType} to add to this style:</p>
              <Table responsive striped size="sm" className="table-organized">
                <thead>
                  <tr style={{ verticalAlign: 'middle' }}>
                    <th style={{ width: '60px' }}>Select</th>
                    <th style={{ minWidth: '120px' }}>Name</th>
                    {modalType === 'colors' && <th style={{ minWidth: '80px' }}>Code</th>}
                    {modalType === 'sizes' && <th style={{ minWidth: '60px' }}>Order</th>}
                    {(modalType === 'materials' || modalType === 'fits') && <th style={{ minWidth: '120px' }}>Description</th>}
                  </tr>
                </thead>
                <tbody>
                  {getAvailableItems().map((item) => {
                    const itemId = modalType === 'colors' ? item.color_id :
                                  modalType === 'sizes' ? item.size_id :
                                  modalType === 'materials' ? item.material_id :
                                  item.fit_id;
                    return (
                      <tr key={itemId} style={{ verticalAlign: 'middle', height: '34px' }}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedItems.includes(itemId)}
                            onChange={() => handleAttributeToggle(itemId)}
                            style={{ marginTop: 0, marginBottom: 0 }}
                          />
                        </td>
                        <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {modalType === 'colors' ? item.color_name :
                           modalType === 'sizes' ? item.size_name :
                           modalType === 'materials' ? item.material_name :
                           item.fit_name}
                        </td>
                        {modalType === 'colors' && <td style={{ fontFamily: 'monospace' }}>{item.color_code}</td>}
                        {modalType === 'sizes' && <td>{item.order || '-'}</td>}
                        {(modalType === 'materials' || modalType === 'fits') && <td>{item.description || '-'}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveAttributes}
            disabled={selectedItems.length === 0 || loading}
          >
            {loading ? 'Adding...' : `Add Selected ${modalType}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};


