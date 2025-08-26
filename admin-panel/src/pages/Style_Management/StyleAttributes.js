import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash, FaSave } from 'react-icons/fa';
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
            Style Number: {style.style_number}
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
  const [existingVariants, setExistingVariants] = React.useState([]);
  const [variantInputs, setVariantInputs] = React.useState({});
  const [editInputs, setEditInputs] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Fetch existing variants on mount or when styleNumber changes
  React.useEffect(() => {
    if (!styleNumber) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/admin/styles/get-style-variants/${styleNumber}?company_code=${company_code}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExistingVariants(data.variants || []);
          // Initialize editInputs with current prices
          const editObj = {};
          (data.variants || []).forEach(v => {
            editObj[v.variant_id] = {
              unit_price: v.unit_price,
              sale_price: v.sale_price
            };
          });
          setEditInputs(editObj);
        } else {
          setError(data.message || 'Failed to fetch variants');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch variants');
        setLoading(false);
      });
  }, [BASE_URL, styleNumber]);

  // Generate all possible combinations
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

  // Map of existing SKUs for quick lookup
  const existingSkuMap = React.useMemo(() => {
    const map = {};
    existingVariants.forEach(v => { map[v.sku] = v; });
    return map;
  }, [existingVariants]);

  // Only show new combinations (not already in DB) for adding
  const newCombinations = React.useMemo(() => {
    return combinations.filter(combo => {
      const sku = generateSku(style.style_number, combo[0], combo[1], combo[2], combo[3]);
      return !existingSkuMap[sku];
    });
  }, [combinations, existingSkuMap, style]);

  // Handle input change for new variants
  const handleInputChange = (idx, field, value) => {
    setVariantInputs(inputs => ({
      ...inputs,
      [idx]: {
        ...inputs[idx],
        [field]: value
      }
    }));
  };

  // Save all new variants
  const handleSaveAll = async () => {
    setSaving(true);
    setError('');
    try {
      // Prepare payloads for new variants
      const payloads = newCombinations.map((combo, idx) => {
        const [color, size, fit, material] = combo;
        const input = variantInputs[idx] || {};
        return {
          company_code,
          style_number: style.style_number,
          sku: generateSku(style.style_number, color, size, fit, material),
          color_id: color.color_id,
          size_id: size.size_id,
          fit_id: fit.fit_id,
          material_id: material.material_id,
          unit_price: input.unit_price || '',
          sale_price: input.sale_price || ''
        };
      });
      // Save each variant (could be optimized to batch if backend supports)
      for (let i = 0; i < payloads.length; i++) {
        // If not provided, save as zero
        if (!payloads[i].unit_price) payloads[i].unit_price = 0;
        if (!payloads[i].sale_price) payloads[i].sale_price = 0;
        const res = await fetch(`${BASE_URL}/api/admin/styles/add-style-variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloads[i])
        });
        const data = await res.json();
        if (!data.success) {
          if (data.message && data.message.toLowerCase().includes('variant already exists')) {
            setError('One or more variants already exist. Please refresh the page.');
          } else {
            setError(data.message || 'Failed to add variant');
          }
          setSaving(false);
          return;
        }
      }
      setVariantInputs({});
      if (onSuccess) onSuccess();
      // Refetch variants
      setLoading(true);
      fetch(`${BASE_URL}/api/admin/styles/get-style-variants/${styleNumber}?company_code=${company_code}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExistingVariants(data.variants || []);
            // Update editInputs as well
            const editObj = {};
            (data.variants || []).forEach(v => {
              editObj[v.variant_id] = {
                unit_price: v.unit_price,
                sale_price: v.sale_price
              };
            });
            setEditInputs(editObj);
          }
          setLoading(false);
        });
    } catch (err) {
      setError('Failed to save variants');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  // Save a single new variant by index
  const handleSaveSingle = async (idx) => {
    setSaving(true);
    setError('');
    try {
      const combo = newCombinations[idx];
      const [color, size, fit, material] = combo;
      const input = variantInputs[idx] || {};
      const payload = {
        company_code,
        style_number: style.style_number,
        sku: generateSku(style.style_number, color, size, fit, material),
        color_id: color.color_id,
        size_id: size.size_id,
        fit_id: fit.fit_id,
        material_id: material.material_id,
        unit_price: input.unit_price || 0,
        sale_price: input.sale_price || 0
      };
      const res = await fetch(`${BASE_URL}/api/admin/styles/add-style-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        if (data.message && data.message.toLowerCase().includes('variant already exists')) {
          setError('Variant already exists. Please refresh the page.');
        } else {
          setError(data.message || 'Failed to add variant');
        }
        setSaving(false);
        return;
      }
      // Remove the input for this row
      setVariantInputs(inputs => {
        const newInputs = { ...inputs };
        delete newInputs[idx];
        return newInputs;
      });
      if (onSuccess) onSuccess();
      // Refetch variants
      setLoading(true);
      fetch(`${BASE_URL}/api/admin/styles/get-style-variants/${styleNumber}?company_code=${company_code}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExistingVariants(data.variants || []);
            // Update editInputs as well
            const editObj = {};
            (data.variants || []).forEach(v => {
              editObj[v.variant_id] = {
                unit_price: v.unit_price,
                sale_price: v.sale_price
              };
            });
            setEditInputs(editObj);
          }
          setLoading(false);
        });
    } catch (err) {
      setError('Failed to save variant');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  // Handle input change for existing variants
  const handleEditInputChange = (variant_id, field, value) => {
    setEditInputs(inputs => ({
      ...inputs,
      [variant_id]: {
        ...inputs[variant_id],
        [field]: value
      }
    }));
  };

  // Save price update for a single existing variant
  const handleSaveEdit = async (variant) => {
    setSaving(true);
    setError('');
    try {
      const input = editInputs[variant.variant_id] || {};
      const payload = {
        color_id: variant.color_id,
        size_id: variant.size_id,
        fit_id: variant.fit_id,
        material_id: variant.material_id,
        unit_price: input.unit_price,
        sale_price: input.sale_price,
        sku: variant.sku
      };
      const res = await fetch(`${BASE_URL}/api/admin/styles/update-style-variants/${variant.variant_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to update variant');
        setSaving(false);
        return;
      }
      if (onSuccess) onSuccess();
      // Refetch variants
      setLoading(true);
      fetch(`${BASE_URL}/api/admin/styles/get-style-variants/${styleNumber}?company_code=${company_code}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExistingVariants(data.variants || []);
            // Update editInputs as well
            const editObj = {};
            (data.variants || []).forEach(v => {
              editObj[v.variant_id] = {
                unit_price: v.unit_price,
                sale_price: v.sale_price
              };
            });
            setEditInputs(editObj);
          }
          setLoading(false);
        });
    } catch (err) {
      setError('Failed to update variant');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  if (!style) return <div className="p-4">Loading style...</div>;
  if (loading) return <div className="p-4">Loading variants...</div>;

  return (
    <div className="p-3">
      <h5>Style Variants (SKU)</h5>
      {error && <div className="alert alert-danger">{error}</div>}
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Existing variants */}
          {existingVariants.map((variant, idx) => {
            const input = editInputs[variant.variant_id] || {};
            return (
              <tr key={variant.variant_id || variant.sku} style={{ background: '#f8f9fa' }}>
                <td>{idx + 1}</td>
                <td>{variant.sku}</td>
                <td>{variant.color_name}</td>
                <td>{variant.size_name}</td>
                <td>{variant.fit_name}</td>
                <td>{variant.material_name}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={input.unit_price ?? ''}
                    onChange={e => handleEditInputChange(variant.variant_id, 'unit_price', e.target.value)}
                    placeholder="Unit Price"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={input.sale_price ?? ''}
                    onChange={e => handleEditInputChange(variant.variant_id, 'sale_price', e.target.value)}
                    placeholder="Sale Price"
                  />
                </td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    className="px-2 py-0"
                    style={{ fontSize: '0.9rem', lineHeight: 1 }}
                    onClick={() => handleSaveEdit(variant)}
                    disabled={saving}
                  >
                    <FaSave className=" m-1" />
                  </Button>
                </td>
              </tr>
            );
          })}
          {/* New variants to be added */}
          {newCombinations.length > 0 && <tr><td colSpan={9} className="table-secondary text-center">Add New Variants</td></tr>}
          {newCombinations.map((combo, idx) => {
            const [color, size, fit, material] = combo;
            const sku = generateSku(style.style_number, color, size, fit, material);
            const input = variantInputs[idx] || {};
            return (
              <tr key={sku} style={{ background: '#fffbe6' }}>
                <td>{existingVariants.length + idx + 1}</td>
                <td>{sku}</td>
                <td>{color.color_name}</td>
                <td>{size.size_name}</td>
                <td>{fit.fit_name}</td>
                <td>{material.material_name}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={input.unit_price || ''}
                    onChange={e => handleInputChange(idx, 'unit_price', e.target.value)}
                    placeholder="Unit Price"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={input.sale_price || ''}
                    onChange={e => handleInputChange(idx, 'sale_price', e.target.value)}
                    placeholder="Sale Price"
                  />
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    className="px-2 py-0 me-1"
                    style={{ fontSize: '0.9rem', lineHeight: 1 }}
                    onClick={() => handleSaveSingle(idx)}
                    disabled={saving}
                  >
                    <FaSave className="m-1" />
                    
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {newCombinations.length > 0 && (
        <Button
          variant="primary"
          className="mt-2"
          onClick={handleSaveAll}
          disabled={saving || newCombinations.length === 0}
        >
          {saving ? 'Saving...' : 'Save All New Variants'}
        </Button>
      )}
      {(!styleColors.length || !styleSizes.length || !styleMaterials.length || !styleFits.length) && (
        <div className="alert alert-warning mt-3">Assign at least one color, size, fit, and material to generate variants.</div>
      )}
    </div>
  );
}


