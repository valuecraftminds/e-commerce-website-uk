
import { useCallback, useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Spinner as RBSpinner, Alert } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { FaPlus, FaEdit } from 'react-icons/fa';


const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SizeManagement = ({ embedded, styleNumber, companyCode, onSuccess, onCancel }) => {
  const { userData } = useContext(AuthContext);
  const [sizeRanges, setSizeRanges] = useState([]);
  const [sizesByRange, setSizesByRange] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newSizesList, setNewSizesList] = useState([]);
  const [addingRange, setAddingRange] = useState(false);
  const [editingRangeId, setEditingRangeId] = useState(null);
  const [formSizes, setFormSizes] = useState([]);
  const [formSize, setFormSize] = useState('');
  const [updatingRange, setUpdatingRange] = useState(false);

  // Fetch all size ranges and their sizes
  const fetchSizeRanges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const company_code = companyCode || userData.company_code;
      const res = await fetch(`${BASE_URL}/api/admin/sizes/get-size-ranges?company_code=${company_code}`);
      const data = await res.json();
      if (data.success) {
        setSizeRanges(data.size_ranges);
        // Fetch sizes for each range
        const sizesObj = {};
        for (const range of data.size_ranges) {
          const res2 = await fetch(`${BASE_URL}/api/admin/sizes/get-sizes?company_code=${company_code}&size_range_id=${range.size_range_id}`);
          const data2 = await res2.json();
          if (data2.success) {
            sizesObj[range.size_range_id] = data2.sizes;
          } else {
            sizesObj[range.size_range_id] = [];
          }
        }
        setSizesByRange(sizesObj);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error fetching size ranges');
    }
    setLoading(false);
  }, [companyCode, userData.company_code]);

  useEffect(() => {
    fetchSizeRanges();
  }, [fetchSizeRanges]);


  // Handle form submit for add or update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (formSizes.length < 2) {
      setError('Please add at least two sizes to the range');
      return;
    }
    if (editingRangeId) {
      setUpdatingRange(true);
      try {
        const company_code = companyCode || userData.company_code;
        const res = await fetch(`${BASE_URL}/api/admin/sizes/update-size-range/${editingRangeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_code, sizes: formSizes })
        });
        const data = await res.json();
        if (data.success) {
          setSuccess('Size range updated successfully');
          setEditingRangeId(null);
          setFormSizes([]);
          setFormSize('');
          fetchSizeRanges();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error updating size range');
      }
      setUpdatingRange(false);
    } else {
      setAddingRange(true);
      try {
        const company_code = companyCode || userData.company_code;
        const res = await fetch(`${BASE_URL}/api/admin/sizes/add-size-range`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_code, sizes: formSizes })
        });
        const data = await res.json();
        if (data.success) {
          setSuccess('Size range added successfully');
          setFormSizes([]);
          setFormSize('');
          fetchSizeRanges();
          // Auto-assign to style if embedded and styleNumber present
          if (embedded && styleNumber && companyCode) {
            await fetch(`${BASE_URL}/api/admin/styles/add-style-attributes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                style_number: styleNumber,
                company_code: companyCode,
                type: 'sizes',
                attribute_ids: [data.size_range_id]
              })
            });
          }
          if (onSuccess) onSuccess();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error adding size range');
      }
      setAddingRange(false);
    }
  };


  // Add a size to the form list
  const handleAddFormSize = (e) => {
    e.preventDefault();
    const size = formSize.trim().toUpperCase();
    if (!size) return;
    if (formSizes.includes(size)) {
      setError('Size already added');
      return;
    }
    setFormSizes([...formSizes, size]);
    setFormSize('');
    setError('');
  };

  // Remove a size from the form list
  const handleRemoveFormSize = (size) => {
    setFormSizes(formSizes.filter(s => s !== size));
  };



  // Start editing a size range
  const handleEditRange = (rangeId) => {
    setEditingRangeId(rangeId);
    setFormSizes((sizesByRange[rangeId] || []).map(sz => sz.size_name));
    setFormSize('');
    setError('');
    setSuccess('');
  };


  return (
    <Container>
      <Card className="mb-4">
        <Card.Header>
          <h5>{editingRangeId ? 'Edit Size Range' : 'Add Size Range'}</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleFormSubmit}>
            <Row className="align-items-end g-2">
              <Col xs={12} md={5}>
                <Form.Group className="mb-0">
                  <Form.Label>{editingRangeId ? 'Edit Size' : 'Add Size'}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. XS or 38"
                    value={formSize}
                    onChange={e => setFormSize(e.target.value.toUpperCase())}
                    disabled={addingRange || updatingRange}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFormSize(e); } }}
                  />
                </Form.Group>
              </Col>
              <Col xs="auto">
                <Button onClick={handleAddFormSize} disabled={addingRange || updatingRange || !formSize.trim()} variant="success">
                  <FaPlus size={14} />
                </Button>
              </Col>
              <Col xs="auto">
                <Button type="submit" variant="primary" disabled={addingRange || updatingRange || formSizes.length < 2}>
                  {(addingRange || updatingRange) ? <RBSpinner size="sm" animation="border" /> : (editingRangeId ? 'Update' : 'Add')}
                </Button>
              </Col>
              {editingRangeId && (
                <Col xs="auto">
                  <Button variant="secondary" onClick={() => { setEditingRangeId(null); setFormSizes([]); setFormSize(''); setError(''); setSuccess(''); }} disabled={updatingRange}>Cancel</Button>
                </Col>
              )}
            </Row>
          </Form>
          {/* Show entered sizes as chips/list */}
          {formSizes.length > 0 && (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-2">
                {formSizes.map(size => (
                  <span key={size} className="badge bg-info text-dark p-2">
                    {size}
                    <Button size="sm" variant="link" className="ms-1 p-0 text-danger" onClick={() => handleRemoveFormSize(size)} style={{ verticalAlign: 'middle', lineHeight: 1 }}>
                      &times;
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
          {success && <Alert variant="success" className="mt-2">{success}</Alert>}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>Size Range List</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center my-4"><RBSpinner animation="border" /></div>
          ) : sizeRanges.length === 0 ? (
            <div className="text-center text-muted">No size ranges found.</div>
          ) : (
            <Table responsive striped bordered hover size="sm" className="table-organized">
              <thead>
                <tr style={{ verticalAlign: 'middle' }}>
                  <th style={{ minWidth: '100px' }}>Range Name</th>
                  <th style={{ minWidth: '200px' }}>Sizes</th>
                  <th style={{ width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sizeRanges.map(range => (
                  <tr key={range.size_range_id} style={{ verticalAlign: 'middle', height: '34px' }}>
                    <td>{range.range_name}</td>
                    <td>
                      {(sizesByRange[range.size_range_id] || []).map(sz => sz.size_name).join(', ')}
                    </td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="py-0 px-2"
                        style={{ fontSize: '0.9rem', lineHeight: 1 }}
                        onClick={() => handleEditRange(range.size_range_id)}
                        disabled={editingRangeId === range.size_range_id}
                      >
                        <FaEdit />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SizeManagement;
