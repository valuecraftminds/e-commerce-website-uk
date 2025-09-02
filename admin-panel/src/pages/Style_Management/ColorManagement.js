import { useCallback, useContext, useEffect, useState } from 'react';
import { Container, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaPalette } from 'react-icons/fa';
import axios from 'axios';
import StyleAttributeTable from '../../components/StyleAttributeTable';
import { AuthContext } from '../../context/AuthContext';

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
  const [showCssColorsModal, setShowCssColorsModal] = useState(false);
  const [cssColors, setCssColors] = useState([]);
  const [cssColorsLoading, setCssColorsLoading] = useState(false);
  const [cssColorsError, setCssColorsError] = useState('');
  const [cssColorsSearch, setCssColorsSearch] = useState('');
  // Fetch CSS colors from API
  const fetchCssColors = async () => {
    setCssColorsLoading(true);
    setCssColorsError('');
    try {
      const res = await axios.get('https://www.csscolorsapi.com/api/colors/');
      const data = res.data;
      if (data && data.colors) {
        setCssColors(data.colors);
      } else {
        setCssColorsError('Failed to load colors');
      }
    } catch (err) {
      setCssColorsError('Failed to fetch colors');
    }
    setCssColorsLoading(false);
  };

  // Open modal and fetch colors if not already loaded
  const handleOpenCssColorsModal = () => {
    setShowCssColorsModal(true);
    if (cssColors.length === 0) {
      fetchCssColors();
    }
  };

  // Select a color from modal
  const handleSelectCssColor = (color) => {
    setFormData({
      color_name: color.name,
      color_code: color.hex.startsWith('#') ? color.hex : `#${color.hex}`
    });
    setShowCssColorsModal(false);
  };

  const columns = [
    { key: 'color_name', label: 'Color Name' },
    { key: 'color_code', label: 'Color Code' }
  ];

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

  const handleEdit = (color) => {
    setIsEditing(true);
    setEditingId(color.color_id);
    setFormData({
      color_name: color.color_name,
      color_code: color.color_code
    });
  };

  const handleDelete = async (colorId) => {
    if (!colorId) {
      setError('Invalid color ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this color?')) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/colors/delete-colors/${colorId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Color deleted successfully');
          fetchColors();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error deleting color');
      }
    }
  };

  const resetForm = () => {
    setFormData({ color_name: '', color_code: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Container>
      {/* Add from CSS Colors Button */}
      <div className="mb-2" style={{ textAlign: 'right' }}>
        <FaPalette 
          className="action-icon me-2 text-primary"
          onClick={handleOpenCssColorsModal}
          title="Add from CSS Colors"
          style={{ cursor: 'pointer' }}
        />
        <span className="text-primary" style={{ cursor: 'pointer' }} onClick={handleOpenCssColorsModal}>
          Add from CSS Colors
        </span>
      </div>
      <StyleAttributeTable 
        title="Colors"
        items={colors}
        columns={columns}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        isEditing={isEditing}
        loading={loading}
        error={error}
        success={success}
        onCancel={resetForm}
        embedded={embedded}
      />

      {/* CSS Colors Modal */}
      <Modal show={showCssColorsModal} onHide={() => setShowCssColorsModal(false)} size="lg">
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
      </Modal>
    </Container>
  );
};

export default ColorManagement;
