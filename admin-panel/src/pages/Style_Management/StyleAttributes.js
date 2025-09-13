import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Tabs, Tab, Accordion } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import DeleteModal from '../../components/modals/DeleteModal';
import '../../styles/Style.css';

import ColorManagement from './ColorManagement';
import SizeManagement from './SizeManagement';
import MaterialManagement from './MaterialManagement';
import FitManagement from './FitManagement';
import SizeGuideModal from '../../components/modals/SizeGuideModal';

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
  const [allSizeRanges, setAllSizeRanges] = useState([]);
  const [selectedSizeRangeId, setSelectedSizeRangeId] = useState('');
  const [rangeSizes, setRangeSizes] = useState([]);
  const [assignedSizeRanges, setAssignedSizeRanges] = useState([]); // [{range, sizes:[]}]
  const [assignedRangeSizes, setAssignedRangeSizes] = useState({}); // {rangeId: [sizes]}
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

  // Size Guide Modal state
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);

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
      const [colorsRes, sizeRangesRes, materialsRes, fitsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/colors/get-colors?company_code=${company_code}`),
        fetch(`${BASE_URL}/api/admin/sizes/get-size-ranges?company_code=${company_code}`),
        fetch(`${BASE_URL}/api/admin/materials/get-materials?company_code=${company_code}`),
        fetch(`${BASE_URL}/api/admin/fits/get-fits?company_code=${company_code}`)
      ]);

      const [colorsData, sizeRangesData, materialsData, fitsData] = await Promise.all([
        colorsRes.json(),
        sizeRangesRes.json(),
        materialsRes.json(),
        fitsRes.json()
      ]);

      if (colorsData.success) setAllColors(colorsData.colors);
      if (sizeRangesData.success) setAllSizeRanges(sizeRangesData.size_ranges);
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

        // For sizes, group by size_range_id
        if (data.sizes && data.sizes.length > 0) {
          const rangeMap = {};
          for (const sz of data.sizes) {
            if (!rangeMap[sz.size_range_id]) rangeMap[sz.size_range_id] = [];
            rangeMap[sz.size_range_id].push(sz);
          }
          setAssignedRangeSizes(rangeMap);
          // Build assignedSizeRanges as [{range, sizes:[]}] for accordion
          const assignedRanges = Object.keys(rangeMap).map(rangeId => {
            const range = allSizeRanges.find(r => String(r.size_range_id) === String(rangeId));
            return { range, sizes: rangeMap[rangeId] };
          }).filter(r => r.range);
          setAssignedSizeRanges(assignedRanges);
        } else {
          setAssignedRangeSizes({});
          setAssignedSizeRanges([]);
        }
      }
    } catch (err) {
      setError('Error fetching style attributes');
    }
  }, [styleNumber, company_code, allSizeRanges]);

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
      // For sizes, assign size range(s) to style
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

  // For sizes, only allow selecting a size range (not individual sizes)
  const getAvailableSizeRanges = () => {
    // Exclude already assigned ranges
    const assignedRangeIds = Object.keys(assignedRangeSizes || {});
    return allSizeRanges.filter(r => !assignedRangeIds.includes(String(r.size_range_id)));
  };

  // Remove assigned size range from style
  const handleRemoveSizeRange = (size_range_id) => {
    setDeleteModalInfo({ type: 'sizes', id: size_range_id });
  };

  // Size Guide Modal handlers
  const handleOpenSizeGuideModal = () => {
    setShowSizeGuideModal(true);
  };

  const handleCloseSizeGuideModal = () => {
    setShowSizeGuideModal(false);
  };

  const handleSizeGuideSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
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
      {/* Right: Assigned Size Ranges (Accordion) or Table for others */}
      <Col md={6}>
        {type === 'sizes' && (
          <div className="d-flex justify-content-end mb-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenSizeGuideModal}
            >
              <FaPlus size={14} className="me-2" />
              Add Size Guide
            </Button>
              {/* add how to measure guide */}
        <button
          className="btn btn-primary"
          // onClick={() => tableActions.handleMeasureGuide()}
        >
          Add Measure Guide
        </button>
            <Button 
              variant="primary" 
              className='add-style-btn'
              size="sm" 
              onClick={() => handleOpenModal(type)}
            >
               {/* Add Existing button for sizes is outside accordion */}
              <FaPlus size={16} className="me-2" />
              Add Existing Size Range
            </Button>
          </div>
        )}
        {type === 'sizes' ? (
          <Accordion defaultActiveKey={assignedSizeRanges.length ? String(assignedSizeRanges[0]?.range?.size_range_id) : undefined}>
            {assignedSizeRanges.length === 0 ? (
              <Card>
                <Card.Body className="text-center text-muted">No size ranges assigned yet.</Card.Body>
              </Card>
            ) : (
              assignedSizeRanges.map(({ range, sizes }) => (
                <Accordion.Item eventKey={String(range.size_range_id)} key={range.size_range_id}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <span>{range.range_name}</span>
                      <FaTrash 
                        size={16} 
                        className="action-icon text-danger ms-2" 
                        style={{ cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); handleRemoveSizeRange(range.size_range_id); }}
                        title="Remove Size Range"
                      />
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Table bordered size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Size Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map((sz, idx) => (
                          <tr key={sz.size_id}>
                            <td>{idx + 1}</td>
                            <td>{sz.size_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
              ))
            )}
          </Accordion>
        ) : (
          <Card className='assigned-attributes'>
            <Card.Header className="justify-content-between align-items-center">
              <h5 className="mb-0">Assigned {title}</h5>
              <Button 
                variant="primary" 
                className='add-style-btn'
                size="sm" 
                onClick={() => handleOpenModal(type)}
              >
                <FaPlus size={16} className="me-2" />
                Add Existing {title.slice(0, -1)}
              </Button>
            </Card.Header>
            <Card.Body>
              {items.length === 0 ? (
                <p className="text-muted text-center">No {title.toLowerCase()} added yet.</p>
              ) : (
                <Table responsive striped size="sm" className="table-organized">
                  <thead className='color-thead'>
                    <tr style={{ verticalAlign: 'middle' }}>
                      <th style={{ width: '40px'}}>#</th>
                      {type === 'colors' && <th style={{ width: '20%' }}>Preview</th>}
                      <th style={{ minWidth: '120px' }}>Name</th>
                      {type === 'colors' && <th style={{ minWidth: '40%' }}>Code</th>}
                      {(type === 'materials' || type === 'fits') && <th style={{ minWidth: '120px' }}>Description</th>}
                      <th style={{ width: '70px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} style={{ verticalAlign: 'middle', height: '36px' }}>
                        <td>{index + 1}</td>
                        {type === 'colors' && (
                          <td>
                            <span style={{
                              display: 'inline-block',
                              width: '100%',
                              height: 24,
                              border: '1px solid #ccc',
                              background: item.color_code || '#fff',
                              verticalAlign: 'middle'
                            }} title={item.color_code} />
                          </td>
                        )}
                        <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {type === 'colors' ? item.color_name :
                           type === 'materials' ? item.material_name :
                           item.fit_name}
                        </td>
                        {type === 'colors' && <td style={{ fontFamily: 'monospace' }}>{item.color_code}</td>}
                        {(type === 'materials' || type === 'fits') && <td>{item.description || '-'}</td>}
                        <td>
                          {type === 'colors' ? (
                            <FaTrash 
                              size={16} 
                              className="action-icon text-danger" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveAttribute(type, item.color_id)}
                              title="Remove Color"
                            />
                          ) : (
                            <FaTrash 
                              size={16} 
                              className="action-icon text-danger" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveAttribute(type, 
                                type === 'materials' ? item.material_id :
                                item.fit_id
                              )}
                              title={`Remove ${type === 'materials' ? 'Material' : 'Fit'}`}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        )}
       
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
            <FaArrowLeft size={16} className="me-2" />
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
    assignedRangeSizes={assignedRangeSizes}
  />
</Tab>
</Tabs>

      {/* Selection Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'sizes' ? 'Add Size Range' : `Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1, -1)}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalType === 'sizes' ? (
            <Form.Group>
              <Form.Label>Select Size Range</Form.Label>
              <Form.Select
                value={selectedSizeRangeId}
                onChange={e => setSelectedSizeRangeId(e.target.value)}
              >
                <option value="">-- Select Size Range --</option>
                {getAvailableSizeRanges().map(range => (
                  <option key={range.size_range_id} value={range.size_range_id}>{range.range_name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          ) : (
            <div>
              <p>Select {modalType} to add to this style:</p>
              {/* <Table responsive striped size="sm" className="table-organized"> */}
              <div className="table-responsive">
                <Table striped size="sm" className="table-organized">
                <thead className='color-thead'>
                  <tr style={{ verticalAlign: 'middle' }}>
                    <th style={{ width: '60px' }}>Select</th>
                    <th style={{ minWidth: '120px' }}>Name</th>
                    {modalType === 'colors' && <th style={{ minWidth: '80px' }}>Code</th>}
                    {(modalType === 'materials' || modalType === 'fits') && <th style={{ minWidth: '120px' }}>Description</th>}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let allItems = [];
                    let styleItems = [];
                    switch (modalType) {
                      case 'colors':
                        allItems = allColors;
                        styleItems = styleColors;
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
                        return null;
                    }
                    const styleItemIds = styleItems.map(item => {
                      switch (modalType) {
                        case 'colors': return item.color_id;
                        case 'materials': return item.material_id;
                        case 'fits': return item.fit_id;
                        default: return null;
                      }
                    });
                    return allItems.filter(item => {
                      const itemId = modalType === 'colors' ? item.color_id :
                                    modalType === 'materials' ? item.material_id :
                                    item.fit_id;
                      return !styleItemIds.includes(itemId);
                    }).map(item => {
                      const itemId = modalType === 'colors' ? item.color_id :
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
                             modalType === 'materials' ? item.material_name :
                             item.fit_name}
                          </td>
                          {modalType === 'colors' && <td style={{ fontFamily: 'monospace' }}>{item.color_code}</td>}
                          {(modalType === 'materials' || modalType === 'fits') && <td>{item.description || '-'}</td>}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={async () => {
              if (modalType === 'sizes') {
                if (!selectedSizeRangeId) return;
                setLoading(true);
                try {
                  // Assign only the size_range_id to style_size_ranges, ensure it's a number
                  const response = await fetch(`${BASE_URL}/api/admin/styles/add-style-attributes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      style_number: styleNumber,
                      company_code,
                      type: 'sizes',
                      attribute_ids: [Number(selectedSizeRangeId)]
                    })
                  });
                  const respData = await response.json();
                  if (respData.success) {
                    setSuccess('Size range added successfully!');
                    setShowModal(false);
                    fetchStyleAttributes();
                    setTimeout(() => setSuccess(''), 3000);
                  } else {
                    setError(respData.message || 'Error adding size range');
                  }
                } catch (err) {
                  setError('Error adding size range');
                }
                setLoading(false);
              } else {
                handleSaveAttributes();
              }
            }}
            disabled={loading || (modalType === 'sizes' && !selectedSizeRangeId) || (modalType !== 'sizes' && selectedItems.length === 0)}
          >
            {loading ? 'Adding...' : modalType === 'sizes' ? 'Add Size Range' : `Add Selected ${modalType}`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={showSizeGuideModal}
        onClose={handleCloseSizeGuideModal}
        onSuccess={handleSizeGuideSuccess}
        title={`Size Guide - ${style?.name || 'Loading...'}`}
        assignedRangeSizes={assignedRangeSizes}
        styleNumber={styleNumber}
        companyCode={company_code}
      />
    </Container>
  );
}

// Helper to generate cartesian product of arrays
function cartesianProduct(arrays) {
  return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
}

function SkuVariantGenerator({ style, styleColors, styleSizes, styleMaterials, styleFits, company_code, styleNumber, BASE_URL, onSuccess, onError, assignedRangeSizes }) {
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
    if (!styleColors.length || !styleFits.length) return [];
    let sizeArr = [];
    if (Array.isArray(styleSizes) && styleSizes.length > 0) {
      // If styleSizes is already all sizes, use as is (for backward compatibility)
      sizeArr = styleSizes;
    } else if (Array.isArray(window.assignedSizeRanges) && window.assignedSizeRanges.length > 0) {
      // If assignedSizeRanges is available globally (should be passed as prop ideally)
      sizeArr = window.assignedSizeRanges.flatMap(r => r.sizes);
    }
    // If assignedRangeSizes is available, use that
    if (typeof assignedRangeSizes === 'object' && Object.keys(assignedRangeSizes).length > 0) {
      sizeArr = Object.values(assignedRangeSizes).flat();
    }
    return cartesianProduct([
      styleColors,
      sizeArr,
      styleFits,
      styleMaterials
    ]);
  }, [styleColors, styleFits, assignedRangeSizes]);

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
    if (!style) return []; // to avoid runtime err

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
                  <FaSave 
                    size={16} 
                    className="action-icon text-success" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSaveEdit(variant)}
                    title="Save Changes"
                  />
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
                  <FaSave 
                    size={16} 
                    className="action-icon text-success" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSaveSingle(idx)}
                    title="Save Variant"
                  />
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


