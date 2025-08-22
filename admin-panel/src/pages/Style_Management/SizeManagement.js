import { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ManagementTable from '../../components/StyleAttributeTable';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const SizeManagement = ({ embedded, styleNumber, companyCode, onSuccess, onCancel }) => {
  const { userData } = useContext(AuthContext);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    size_name: '',
  });

  const columns = [
    { key: 'size_name', label: 'Size Name' },
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
          company_code: companyCode || userData.company_code
        }),
      });
      const data = await response.json();
      console.log('Size add API response:', data);
      if (data.success) {
        setSuccess(isEditing ? 'Size updated successfully' : 'Size added successfully');
        fetchSizes();
        if (!isEditing && embedded && styleNumber && companyCode) {
          // Assign to style
          let sizeId = null;
          if (data.size && (data.size.size_id || data.size.id)) {
            sizeId = data.size.size_id || data.size.id;
          } else if (data.id) {
            sizeId = data.id;
          } else if (data.size_id) {
            sizeId = data.size_id;
          }
          if (sizeId) {
            const assignRes = await fetch(`${BASE_URL}/api/admin/styles/add-style-attributes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                style_number: styleNumber,
                company_code: companyCode,
                type: 'sizes',
                attribute_ids: [sizeId]
              })
            });
            const assignData = await assignRes.json();
            console.log('Assign size to style response:', assignData);
          } else {
            console.warn('Could not determine new size ID from response:', data);
          }
        }
        resetForm();
        if (onSuccess) onSuccess();
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
    setFormData({ size_name: '' });
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
        embedded={embedded}
      />
    </Container>
  );
};

export default SizeManagement;
