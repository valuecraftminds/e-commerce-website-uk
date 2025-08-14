import { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ManagementTable from '../../components/ManagementTable';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ColorManagement = () => {
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

  const columns = [
    { key: 'color_name', label: 'Color Name' },
    { key: 'color_code', label: 'Color Code' }
  ];

  const fetchColors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/colors/get-colors?company_code=${userData.company_code}`);
      const data = await response.json();
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
          company_code: userData.company_code
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(isEditing ? 'Color updated successfully' : 'Color added successfully');
        fetchColors();
        resetForm();
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
      <ManagementTable 
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
      />
    </Container>
  );
};

export default ColorManagement;
