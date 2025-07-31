import React, { useContext, useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import '../styles/Currency.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Currency() {
  const [currencies, setCurrencies] = useState([]);
  const [formData, setFormData] = useState({
    currency_name: '',
    short_name: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
const { userData } = useContext(AuthContext);
  
const company_code = userData?.company_code;
const user_id = userData?.id;



  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/currencies/get-currencies?company_code=${company_code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.currencies);
      } else {
        alert(data.message || 'Error fetching currencies');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch currencies');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editMode 
        ? `${BASE_URL}/api/admin/currencies/update-currencies/${currentId}`
        : `${BASE_URL}/api/admin/currencies/add-currencies`;
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          company_code: company_code,
          ...(editMode ? {} : { created_by: user_id })
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(editMode ? 'Currency updated successfully' : 'Currency added successfully');
        fetchCurrencies();
        resetForm();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save currency');
    }
  };

  const handleEdit = (currency) => {
    setFormData({
      currency_name: currency.currency_name,
      short_name: currency.short_name
    });
    setCurrentId(currency.currency_id);
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this currency?')) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/currencies/delete-currencies/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        if (data.success) {
          alert('Currency deleted successfully');
          fetchCurrencies();
        } else {
          alert(data.message || 'Failed to delete currency');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete currency');
      }
    }
  };

  const resetForm = () => {
    setFormData({ currency_name: '', short_name: '' });
    setEditMode(false);
    setCurrentId(null);
  };

  const filteredCurrencies = currencies.filter(currency =>
    currency.currency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="currency-container">
      <div className="currency-header">
        <h2>Currency Management</h2>
      </div>

      <div className="currency-form">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Currency Name"
                value={formData.currency_name}
                onChange={(e) => setFormData({...formData, currency_name: e.target.value})}
                required
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Short Name"
                value={formData.short_name}
                onChange={(e) => setFormData({...formData, short_name: e.target.value})}
                required
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary">
                {editMode ? 'Update' : 'Add'} Currency
              </button>
              {editMode && (
                <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="form-control"
          placeholder="Search currencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="currency-table">
        <table className="table">
          <thead>
            <tr>
              <th>Currency Name</th>
              <th>Short Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCurrencies.map((currency) => (
              <tr key={currency.currency_id}>
                <td>{currency.currency_name}</td>
                <td>{currency.short_name}</td>
                <td className="action-buttons">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEdit(currency)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(currency.currency_id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
