import { useCallback, useContext, useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Select from 'react-select';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Currency.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Currency() {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
const { userData } = useContext(AuthContext);
  
const company_code = userData?.company_code;
const user_id = userData?.id;




  // Fetch currency options from backend API
  const fetchCurrencyOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/currencies/get-all-currency-symbols`);
      if (response.data && response.data.currencies) {
        setCurrencyOptions(response.data.currencies);
      } else {
        throw new Error('Currency API returned no symbols');
      }
    } catch (err) {
      setCurrencyOptions([
        { value: 'GBP', label: 'GBP (£) - British Pound Sterling' },
        { value: 'USD', label: 'USD ($) - US Dollar' },
        { value: 'EUR', label: 'EUR (€) - Euro' },
        { value: 'AED', label: 'AED (د.إ) - UAE Dirham' }
      ]);
    }
  }, []);

  // Fetch currencies for the company
  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/currencies/get-currencies`, {
        params: { company_code }
      });
      if (response.data.success) {
        setCurrencies(response.data.currencies);
      } else {
        alert(response.data.message || 'Error fetching currencies');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch currencies');
    }
  }, [company_code]);

  useEffect(() => {
    fetchCurrencies();
    fetchCurrencyOptions();
  }, [fetchCurrencies, fetchCurrencyOptions]);

  // For dropdown options from backend API
  const [currencyOptions, setCurrencyOptions] = useState([
    { value: 'GBP', label: 'GBP (£) - British Pound Sterling' }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCurrency) {
      alert('Please select a currency');
      return;
    }
    try {
      const url = editMode 
        ? `${BASE_URL}/api/admin/currencies/update-currencies/${currentId}`
        : `${BASE_URL}/api/admin/currencies/add-currencies`;

      const payload = {
        currency_name: selectedCurrency.label,
        short_name: selectedCurrency.value,
        company_code: company_code,
        ...(editMode ? {} : { created_by: user_id })
      };

      const response = editMode 
        ? await axios.put(url, payload)
        : await axios.post(url, payload);

      if (response.data.success) {
        alert(editMode ? 'Currency updated successfully' : 'Currency added successfully');
        fetchCurrencies();
        resetForm();
      } else {
        alert(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save currency');
    }
  };

  const handleEdit = (currency) => {
    setSelectedCurrency({ value: currency.short_name, label: currency.currency_name });
    setCurrentId(currency.currency_id);
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this currency?')) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/admin/currencies/delete-currencies/${id}`);

        if (response.data.success) {
          alert('Currency deleted successfully');
          fetchCurrencies();
        } else {
          alert(response.data.message || 'Failed to delete currency');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete currency');
      }
    }
  };

  const resetForm = () => {
    setSelectedCurrency(null);
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
            <div className="col-md-8">
              <Select
                options={currencyOptions}
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                placeholder="Select Currency..."
                isClearable
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
                  <FaEdit
                    className="action-icon me-2 text-warning"
                    onClick={() => handleEdit(currency)}
                    title="Edit"
                    style={{ cursor: 'pointer' }}
                  />
                  <FaTrash
                    className="action-icon text-danger"
                    onClick={() => handleDelete(currency.currency_id)}
                    title="Delete"
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
