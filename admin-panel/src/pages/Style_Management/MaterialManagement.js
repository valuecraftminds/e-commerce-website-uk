import { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ManagementTable from '../../components/ManagementTable';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MaterialManagement = ({ embedded, styleCode, companyCode, onSuccess, onCancel }) => {
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
          company_code: companyCode || userData.company_code
        }),
      });
      const data = await response.json();
      console.log('Material add API response:', data);
      if (data.success) {
        setSuccess(isEditing ? 'Material updated successfully' : 'Material added successfully');
        fetchMaterials();
        if (!isEditing && embedded && styleCode && companyCode) {
          // Assign to style
          let materialId = null;
          if (data.material && (data.material.material_id || data.material.id)) {
            materialId = data.material.material_id || data.material.id;
          } else if (data.id) {
            materialId = data.id;
          } else if (data.material_id) {
            materialId = data.material_id;
          }
          if (materialId) {
            const assignRes = await fetch(`${BASE_URL}/api/admin/styles/add-style-attributes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                style_code: styleCode,
                company_code: companyCode,
                type: 'materials',
                attribute_ids: [materialId]
              })
            });
            const assignData = await assignRes.json();
            console.log('Assign material to style response:', assignData);
          } else {
            console.warn('Could not determine new material ID from response:', data);
          }
        }
        resetForm();
        if (onSuccess) onSuccess();
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
        onCancel={resetForm}
        embedded={embedded}
      />
    </Container>
  );
};

export default MaterialManagement;
