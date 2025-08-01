import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ManagementTable from '../../components/ManagementTable';
import { AuthContext } from '../../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const FitManagement = () => {
  const { userData } = useContext(AuthContext);
  const [fits, setFits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fit_name: '',
    description: ''
  });

  const columns = [
    { key: 'fit_name', label: 'Fit Name' },
    { key: 'description', label: 'Description' }
  ];

  const fetchFits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/fits/get-fits?company_code=${userData.company_code}`);
      const data = await response.json();
      if (data.success) {
        setFits(data.fits);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error fetching fits');
    }
    setLoading(false);
  }, [userData.company_code]);

  useEffect(() => {
    fetchFits();
  }, [fetchFits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing 
        ? `${BASE_URL}/api/admin/fits/update-fits/${editingId}`
        : `${BASE_URL}/api/admin/fits/add-fits`;
      
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
        setSuccess(isEditing ? 'Fit updated successfully' : 'Fit added successfully');
        fetchFits();
        resetForm();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error saving fit');
    }
    setLoading(false);
  };

  const handleEdit = (fit) => {
    setIsEditing(true);
    setEditingId(fit.fit_id);
    setFormData({
      fit_name: fit.fit_name,
      description: fit.description || ''
    });
  };

  const handleDelete = async (fitId) => {
    if (window.confirm('Are you sure you want to delete this fit?')) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/fits/delete-fits/${fitId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setSuccess('Fit deleted successfully');
          fetchFits();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error deleting fit');
      }
    }
  };

  const resetForm = () => {
    setFormData({ fit_name: '', description: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <Container>
      <ManagementTable 
        title="Fits"
        items={fits}
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

export default FitManagement;
