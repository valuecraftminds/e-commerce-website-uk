import { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { FaPalette } from 'react-icons/fa';
import axios from 'axios';
import { Row, Col, Card, Button, Form, Table, Spinner as RBSpinner, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

import '../../styles/ColorManagement.css';
import { AuthContext } from '../../context/AuthContext';
import ColorPaletteModal from '../../components/modals/ColorPickerModal';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ColorManagement = ({ embedded, styleNumber, companyCode, onSuccess, onCancel }) => {
  const { userData } = useContext(AuthContext);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    color_name: '',
    color_code: ''
  });

  // CSS Colors API modal state
  // const [showCssColorsModal, setShowCssColorsModal] = useState(false);
  // const [cssColors, setCssColors] = useState([]);
  // const [cssColorsLoading, setCssColorsLoading] = useState(false);
  // const [cssColorsError, setCssColorsError] = useState('');
  // const [cssColorsSearch, setCssColorsSearch] = useState('');
  // Color Picker (Palette) modal state
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Fetch CSS colors from API
  // const fetchCssColors = async () => {
  //   setCssColorsLoading(true);
  //   setCssColorsError('');
  //   try {
  //     const res = await axios.get('https://www.csscolorsapi.com/api/colors/');
  //     const data = res.data;
  //     if (data && data.colors) {
  //       setCssColors(data.colors);
  //     } else {
  //       setCssColorsError('Failed to load colors');
  //     }
  //   } catch (err) {
  //     setCssColorsError('Failed to fetch colors');
  //   }
  //   setCssColorsLoading(false);
  // };

  // Open modal and fetch colors if not already loaded
  // const handleOpenCssColorsModal = () => {
  //   setShowCssColorsModal(true);
  //   if (cssColors.length === 0) {
  //     fetchCssColors();
  //   }
  // };

  // Select a color from modal
  // const handleSelectCssColor = (color) => {
  //   setFormData({
  //     color_name: color.name,
  //     color_code: color.hex.startsWith('#') ? color.hex : `#${color.hex}`
  //   });
  //   setShowCssColorsModal(false);
  // };

  // const columns = [
  //   { key: 'color_name', label: 'Color Name' },
  //   { key: 'color_code', label: 'Color Code' }
  // ];

  const fetchColors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/colors/get-colors`, {
        params: { company_code: userData.company_code }
      });
      const data = response.data;
      if (data.success) {
        setColors(data.colors);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error fetching colors');
    }
    setLoading(false);
  }, [userData.company_code]);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing 
        ? `${BASE_URL}/api/admin/colors/update-colors/${editingId}`
        : `${BASE_URL}/api/admin/colors/add-colors`;
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          company_code: companyCode || userData.company_code
        }),
      });
      const data = await response.json();
      console.log('Color add API response:', data);
      if (data.success) {
        setSuccess(isEditing ? 'Color updated successfully' : 'Color added successfully');
        fetchColors();
        if (!isEditing && embedded && styleNumber && companyCode) {
          // Assign to style
          let colorId = null;
          if (data.color && (data.color.color_id || data.color.id)) {
            colorId = data.color.color_id || data.color.id;
          } else if (data.id) {
            colorId = data.id;
          } else if (data.color_id) {
            colorId = data.color_id;
          }
          if (colorId) {
            const assignRes = await fetch(`${BASE_URL}/api/admin/styles/add-style-attributes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                style_number: styleNumber,
                company_code: companyCode,
                type: 'colors',
                attribute_ids: [colorId]
              })
            });
            const assignData = await assignRes.json();
            console.log('Assign color to style response:', assignData);
          } else {
            console.warn('Could not determine new color ID from response:', data);
          }
        }
        resetForm();
        if (onSuccess) onSuccess();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error saving color');
    }
    setLoading(false);
  };

  // const handleEdit = (color) => {
  //   setIsEditing(true);
  //   setEditingId(color.color_id);
  //   setFormData({
  //     color_name: color.color_name,
  //     color_code: color.color_code
  //   });
  // };

  // const handleDelete = async (colorId) => {
  //   if (!colorId) {
  //     setError('Invalid color ID');
  //     return;
  //   }

  //   if (window.confirm('Are you sure you want to delete this color?')) {
  //     try {
  //       const response = await fetch(`${BASE_URL}/api/admin/colors/delete-colors/${colorId}`, {
  //         method: 'DELETE'
  //       });
  //       const data = await response.json();
  //       if (data.success) {
  //         setSuccess('Color deleted successfully');
  //         fetchColors();
  //       } else {
  //         setError(data.message);
  //       }
  //     } catch (err) {
  //       setError('Error deleting color');
  //     }
  //   }
  // };

  const resetForm = () => {
    setFormData({ color_name: '', color_code: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Container className='color-container'>
      {/* Add from CSS Colors Button */}
      {/* <div className="mb-2" style={{ textAlign: 'right' }}>
        <FaPalette 
          className="action-icon me-2 text-primary"
          onClick={handleOpenCssColorsModal}
          title="Add from CSS Colors"
          style={{ cursor: 'pointer' }}
        />
        <span className="text-primary" style={{ cursor: 'pointer' }} onClick={handleOpenCssColorsModal}>
          Add from CSS Colors
        </span>
      </div> */}

      {/* Add new color */}
      <Card className="add-color">
        <Card.Header >
          <h5>Add New Color</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit} className="mb-3">
            <Row className="align-items-end">
              <Col md={5} sm={12} className="mb-2">
                <Form.Group controlId="colorName">
                  <Form.Label>Color Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter color name"
                    value={formData.color_name}
                    onChange={e => setFormData({ ...formData, color_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4} sm={12} className="mb-2">
                <Form.Group controlId="colorCode">
                  <Form.Label>Color Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter color code"
                    value={formData.color_code}
                    onChange={e => setFormData({ ...formData, color_code: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3} sm={12} className="mb-2">
                <Button type="submit" variant={isEditing ? "warning" : "primary"} className="me-2" disabled={loading}>
                  {loading ? <RBSpinner animation="border" size="sm" /> : isEditing ? "Update" : "Add"}
                </Button>
                {isEditing && (
                  <Button variant="secondary" onClick={resetForm} disabled={loading}>
                    Cancel
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
          <h6 className="or-h6"> OR </h6>
          {/* Color Palette Picker */}
          <div className="mb-2 color-picker">
            <FaPalette 
              className="action-icon me-2 text-primary"
              onClick={() => setShowColorPicker(true)}
              title="Select from Color Palette"
              style={{ cursor: 'pointer' }}
            />
            <span 
              className="text-primary" 
              style={{ cursor: 'pointer' }} 
              onClick={() => setShowColorPicker(true)}
            >
              Select from Color Palette
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Existing color list */}
      <Card className="existing-color">
        <Card.Header>
          <h5>Existing Color List</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive striped bordered hover size="sm" className="table-organized">
            <thead>
              <tr style={{ verticalAlign: 'middle' }}>
                <th style={{ minWidth: '30%' }}>Color Name</th>
                <th style={{ minWidth: '20%' }}>Color Code</th>
                <th style={{ width: '20%' }}>Preview</th>
                {/* <th style={{ width: '30%' }}>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {colors.length === 0 ? (
                <tr><td colSpan={4} className="text-center">No colors found.</td></tr>
              ) : (
                colors.map(item => (
                  <tr key={item.color_id || item.id} style={{ verticalAlign: 'middle', height: '34px' }}>
                    <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.color_name}</td>
                    <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.color_code}</td>
                    <td>
                      <span style={{ display: 'inline-block', width: '100%', height: 30, background: item.color_code, border: '1px solid #ccc' }}></span>
                    </td>
                    {/* <td>
                      <span
                        className="action-icon me-2 text-warning"
                        style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                        title="Edit"
                        onClick={() => handleEdit(item)}
                      >
                        <FaEdit />
                      </span>
                      <span
                        className="action-icon text-danger"
                        style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                        title="Delete"
                        onClick={() => handleDelete(item.color_id || item.id)}
                      >
                        <FaTrash />
                      </span>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* CSS Colors Modal */}
      {/* <Modal show={showCssColorsModal} onHide={() => setShowCssColorsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select a CSS Color</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search color name or hex..."
              value={cssColorsSearch}
              onChange={e => setCssColorsSearch(e.target.value)}
            />
          </InputGroup>
          {cssColorsLoading ? (
            <div>Loading colors...</div>
          ) : cssColorsError ? (
            <div className="text-danger">{cssColorsError}</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Hex</th>
                    <th>Preview</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cssColors
                    .filter(c =>
                      c.name.toLowerCase().includes(cssColorsSearch.toLowerCase()) ||
                      c.hex.toLowerCase().includes(cssColorsSearch.toLowerCase())
                    )
                    .map((color, idx) => (
                      <tr key={color.hex + color.name + idx}>
                        <td>{color.name}</td>
                        <td>#{color.hex.toUpperCase()}</td>
                        <td>
                          <span style={{ display: 'inline-block', width: 30, height: 20, background: `#${color.hex}` }}></span>
                        </td>
                        <td>
                          <Button size="sm" variant="success" onClick={() => handleSelectCssColor(color)}>
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCssColorsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal> */}

      {/* Color Palette Modal */}
      <ColorPaletteModal 
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        formData={formData}
        setFormData={setFormData}
      />
    </Container>
  );
};

export default ColorManagement;
