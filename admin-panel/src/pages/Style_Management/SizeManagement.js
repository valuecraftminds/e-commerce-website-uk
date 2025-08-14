import { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ManagementTable from '../../components/ManagementTable';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SizeManagement = () => {
  const { userData } = useContext(AuthContext);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    size_name: '',
    size_order: ''
  });

  const columns = [
    { key: 'size_name', label: 'Size Name' },
    { key: 'size_order', label: 'Display Order' }
  ];

  const fetchSizes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/sizes/get-sizes?company_code=${userData.company_code}`);
      const data = await response.json();
      if (data.success) {
        setSizes(data.sizes);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error fetching sizes');
    }
    setLoading(false);
  }, [userData.company_code]);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing 
        ? `${BASE_URL}/api/admin/sizes/update-sizes/${editingId}`
        : `${BASE_URL}/api/admin/sizes/add-sizes`;
      
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
        setSuccess(isEditing ? 'Size updated successfully' : 'Size added successfully');
        fetchSizes();
        resetForm();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error saving size');
    }
    setLoading(false);
  };

  const handleEdit = (size) => {
    setIsEditing(true);
    setEditingId(size.size_id);
    setFormData({
      size_name: size.size_name,
      size_order: size.size_order
    });
  };

  const handleDelete = async (sizeId) => {
    if (window.confirm('Are you sure you want to delete this size?')) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/sizes/delete-sizes/${sizeId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Size deleted successfully');
          fetchSizes();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error deleting size');
      }
    }
  };

  const resetForm = () => {
    setFormData({ size_name: '', size_order: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Container>
      <ManagementTable 
        title="Sizes"
        items={sizes}
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

export default SizeManagement;
