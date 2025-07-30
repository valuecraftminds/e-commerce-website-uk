import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ManagementTable from '../../components/ManagementTable';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MaterialManagement = () => {
  const { userData } = useContext(AuthContext);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    material_name: '',
    description: ''
  });

  const columns = [
    { key: 'material_name', label: 'Material Name' },
    { key: 'description', label: 'Description' }
  ];

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/materials/get-materials?company_code=${userData.company_code}`);
      const data = await response.json();
      if (data.success) {
        setMaterials(data.materials);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error fetching materials');
    }
    setLoading(false);
  }, [userData.company_code]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing 
        ? `${BASE_URL}/api/admin/materials/update-materials/${editingId}`
        : `${BASE_URL}/api/admin/materials/add-materials`;
      
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
        setSuccess(isEditing ? 'Material updated successfully' : 'Material added successfully');
        fetchMaterials();
        resetForm();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error saving material');
    }
    setLoading(false);
  };

  const handleEdit = (material) => {
    setIsEditing(true);
    setEditingId(material.material_id);
    setFormData({
      material_name: material.material_name,
      description: material.description || ''
    });
  };

  const handleDelete = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/materials/delete-materials/${materialId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Material deleted successfully');
          fetchMaterials();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error deleting material');
      }
    }
  };

  const resetForm = () => {
    setFormData({ material_name: '', description: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Container>
      <ManagementTable 
        title="Materials"
        items={materials}
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
      />
    </Container>
  );
};

export default MaterialManagement;
