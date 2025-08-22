import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import DeleteModal from '../../components/modals/DeleteModal';
import '../../styles/Style.css';


import ColorManagement from './ColorManagement';
import SizeManagement from './SizeManagement';
import MaterialManagement from './MaterialManagement';
import FitManagement from './FitManagement';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function StyleAttributes() {
  const params = useParams();
  const styleNumber = Object.values(params)[0];

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

  // Delete modal state for each attribute type
  const [deleteModalInfo, setDeleteModalInfo] = useState({ type: '', id: null });

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
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-style/${styleNumber}?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setStyle(data.style);
      } else {
        setError('Style not found');
      }
    } catch (err) {
      setError('Error fetching style details');
    }
  }, [styleNumber, company_code]);

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
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-style-attributes/${styleNumber}?company_code=${company_code}`);
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
  }, [styleNumber, company_code]);

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
          style_number: styleNumber,
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


  // Use DeleteModal for all attribute types
  const handleRemoveAttribute = (type, attributeId) => {
    setDeleteModalInfo({ type, id: attributeId });
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
              styleNumber={styleNumber}
              companyCode={company_code}
              onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
              onCancel={() => {}}
            />
          )}
          {type === 'sizes' && (
            <SizeManagement
              embedded
              styleNumber={styleNumber}
              companyCode={company_code}
              onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
              onCancel={() => {}}
            />
          )}
          {type === 'materials' && (
            <MaterialManagement
              embedded
              styleNumber={styleNumber}
              companyCode={company_code}
              onSuccess={() => { fetchAllAttributes(); fetchStyleAttributes(); }}
              onCancel={() => {}}
            />
          )}
          {type === 'fits' && (
            <FitManagement
              embedded
              styleNumber={styleNumber}
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
            <h5 className="mb-0">Assigned {title}</h5>
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
                        {type === 'colors' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            className="py-0 px-2"
                            style={{ fontSize: '0.9rem', lineHeight: 1 }}
                            onClick={() => handleRemoveAttribute(type, item.color_id)}
                          >
                            <FaTrash />
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            className="py-0 px-2"
                            style={{ fontSize: '0.9rem', lineHeight: 1 }}
                            onClick={() => handleRemoveAttribute(type, 
                              type === 'sizes' ? item.size_id :
                              type === 'materials' ? item.material_id :
                              item.fit_id
                            )}
                          >
                            <FaTrash />
                          </Button>
                        )}
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
      {/* DeleteModal for all attribute types (must be outside renderAttributeSection) */}
      <DeleteModal
        id={deleteModalInfo.id}
        show={!!deleteModalInfo.id}
        onHide={() => setDeleteModalInfo({ type: '', id: null })}
        deleteUrl={() => `${BASE_URL}/api/admin/styles/remove-style-attribute`}
        entityLabel={
          deleteModalInfo.type === 'colors' ? 'color from style' :
          deleteModalInfo.type === 'sizes' ? 'size from style' :
          deleteModalInfo.type === 'materials' ? 'material from style' :
          deleteModalInfo.type === 'fits' ? 'fit from style' :
          'attribute from style'
        }
        modalTitle={
          deleteModalInfo.type === 'colors' ? 'Remove Color from Style' :
          deleteModalInfo.type === 'sizes' ? 'Remove Size from Style' :
          deleteModalInfo.type === 'materials' ? 'Remove Material from Style' :
          deleteModalInfo.type === 'fits' ? 'Remove Fit from Style' :
          'Remove Attribute from Style'
        }
        confirmMessage={
          deleteModalInfo.type === 'colors' ? 'Are you sure you want to remove this color from the style?' :
          deleteModalInfo.type === 'sizes' ? 'Are you sure you want to remove this size from the style?' :
          deleteModalInfo.type === 'materials' ? 'Are you sure you want to remove this material from the style?' :
          deleteModalInfo.type === 'fits' ? 'Are you sure you want to remove this fit from the style?' :
          'Are you sure you want to remove this attribute from the style?'
        }
        requestOptions={{
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style_number: styleNumber,
            company_code,
            type: deleteModalInfo.type,
            attribute_id: deleteModalInfo.id
          })
        }}
        onDeleteSuccess={() => {
          setSuccess(
            deleteModalInfo.type === 'colors' ? 'Color removed successfully!' :
            deleteModalInfo.type === 'sizes' ? 'Size removed successfully!' :
            deleteModalInfo.type === 'materials' ? 'Material removed successfully!' :
            deleteModalInfo.type === 'fits' ? 'Fit removed successfully!' :
            'Attribute removed successfully!'
          );
          fetchStyleAttributes();
          setTimeout(() => setSuccess(''), 3000);
        }}
      />
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
            Style Code: {style.style_number}
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
<Tab eventKey="sku" title="SKU">
  {/* SKU Tab: Generate all possible combinations of assigned attributes */}
  <SkuVariantGenerator
    style={style}
    styleColors={styleColors}
    styleSizes={styleSizes}
    styleMaterials={styleMaterials}
    styleFits={styleFits}
    company_code={company_code}
    styleNumber={styleNumber}
    BASE_URL={BASE_URL}
    onSuccess={() => {
      setSuccess('Variants added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }}
    onError={setError}
  />
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
}

// Helper to generate cartesian product of arrays
function cartesianProduct(arrays) {
  return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
}

function SkuVariantGenerator({ style, styleColors, styleSizes, styleMaterials, styleFits, company_code, styleNumber, BASE_URL, onSuccess, onError }) {
  const [variantInputs, setVariantInputs] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  // Generate all combinations
  const combinations = React.useMemo(() => {
    if (!styleColors.length || !styleSizes.length || !styleMaterials.length || !styleFits.length) return [];
    return cartesianProduct([
      styleColors,
      styleSizes,
      styleFits,
      styleMaterials
    ]);
  }, [styleColors, styleSizes, styleMaterials, styleFits]);

  // Generate SKU string (same as backend logic, now includes material)
  function generateSku(style_number, color, size, fit, material) {
    return `${style_number}-${(color.color_name||'').substring(0,3).toUpperCase()}-${size.size_name}-${(fit.fit_name||'').substring(0,3).toUpperCase()}-${(material.material_name||'').substring(0,3).toUpperCase()}`;
  }

  // Handle input change
  const handleInputChange = (idx, field, value) => {
    setVariantInputs(inputs => ({
      ...inputs,
      [idx]: {
        ...inputs[idx],
        [field]: value
      }
    }));
  };

  // Save all variants
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const results = await Promise.all(combinations.map(async (combo, idx) => {
        const [color, size, fit, material] = combo;
        const input = variantInputs[idx] || {};
        if (!input.unit_price || !input.sale_price) return null;
        const res = await fetch(`${BASE_URL}/api/admin/styles/add-style-variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_code,
            style_number: styleNumber,
            color_id: color.color_id,
            size_id: size.size_id,
            fit_id: fit.fit_id,
            material_id: material.material_id,
            unit_price: input.unit_price,
            sale_price: input.sale_price
          })
        });
        return res.json();
      }));
      if (results.some(r => r && !r.success)) {
        onError('Some variants failed to save.');
      } else {
        onSuccess();
      }
    } catch (err) {
      onError('Error saving variants');
    }
    setSaving(false);
  };

  if (!style) return <div className="p-4">Loading style...</div>;

  return (
    <div className="p-3">
      <h5>Generate All Possible Variants (SKU)</h5>
      {(!styleColors.length || !styleSizes.length || !styleMaterials.length || !styleFits.length) ? (
        <div className="alert alert-warning mt-3">Assign at least one color, size, fit, and material to generate variants.</div>
      ) : (
        <>
          <Table responsive bordered size="sm" className="variants-table mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Color</th>
                <th>Size</th>
                <th>Fit</th>
                <th>Material</th>
                <th>Unit Price</th>
                <th>Sale Price</th>
              </tr>
            </thead>
            <tbody>
              {combinations.map((combo, idx) => {
                const [color, size, fit, material] = combo;
                const sku = generateSku(style.style_number, color, size, fit, material);
                const input = variantInputs[idx] || {};
                return (
                  <tr key={sku}>
                    <td>{idx + 1}</td>
                    <td>{sku}</td>
                    <td>{color.color_name}</td>
                    <td>{size.size_name}</td>
                    <td>{fit.fit_name}</td>
                    <td>{material.material_name}</td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        value={input.unit_price || ''}
                        onChange={e => handleInputChange(idx, 'unit_price', e.target.value)}
                        size="sm"
                        style={{ width: 90 }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        value={input.sale_price || ''}
                        onChange={e => handleInputChange(idx, 'sale_price', e.target.value)}
                        size="sm"
                        style={{ width: 90 }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Button
            variant="primary"
            className="mt-2"
            onClick={handleSaveAll}
            disabled={saving || combinations.length === 0}
          >
            {saving ? 'Saving...' : 'Save All Variants'}
          </Button>
        </>
      )}
    </div>
  );
}


