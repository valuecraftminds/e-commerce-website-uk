import { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, Table } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
 
const Location = () => {
  const { userData } = useContext(AuthContext);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    location_name: '',
    description: ''
  });

 
  const fetchlocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/locations/get-locations`, {
        params: { company_code: userData.company_code }
      });
      if (response.data.success) {
        setLocations(response.data.locations);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error fetching locations');
    }
    setLoading(false);
  }, [userData.company_code]);

  useEffect(() => {
    fetchlocations();
  }, [fetchlocations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing 
        ? `${BASE_URL}/api/admin/locations/update-locations/${editingId}`
        : `${BASE_URL}/api/admin/locations/add-locations`;
      
      const response = isEditing 
        ? await axios.put(url, {
            ...formData,
            company_code: userData.company_code
          })
        : await axios.post(url, {
            ...formData,
            company_code: userData.company_code
          });
      
      if (response.data.success) {
        setSuccess(isEditing ? 'Location updated successfully' : 'Location added successfully');
        fetchlocations();
        resetForm();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error saving location');
    }
    setLoading(false);
  };

  const handleEdit = (location) => {
    setIsEditing(true);
    setEditingId(location.location_id);
    setFormData({
      location_name: location.location_name,
      description: location.description || ''
    });
  };

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/admin/locations/delete-locations/${locationId}`);
        if (response.data.success) {
          setSuccess('Location deleted successfully');
          fetchlocations();
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Error deleting location');
      }
    }
  };

  const resetForm = () => {
    setFormData({ location_name: '', description: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Container>
      <Card className="mb-4">
        <Card.Header>
          <h3>{isEditing ? 'Edit Location' : 'Add New Location'}</h3>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Location Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location_name}
                    onChange={e => setFormData({ ...formData, location_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
              </Button>
              {isEditing && (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>
          <h3>Locations List</h3>
        </Card.Header>
        <Card.Body>
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(location => (
                <tr key={location.location_id}>
                  <td>{location.location_name}</td>
                  <td>{location.description}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <FaEdit
                        className="action-icon me-2 text-warning"
                        onClick={() => handleEdit(location)}
                        title="Edit"
                        style={{ cursor: 'pointer' }}
                      />
                      <FaTrash
                        className="action-icon text-danger"
                        onClick={() => handleDelete(location.location_id)}
                        title="Delete"
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Location;
