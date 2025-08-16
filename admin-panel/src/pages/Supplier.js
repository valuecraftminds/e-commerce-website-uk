import axios from 'axios';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import '../styles/Supplier.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function Supplier() {
  const { userData } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    supplier_name: '',
    email: '',
    phone: '',
    address: '',
    brn: '',
    vat: '',
    bank_name: '',
    branch: '',
    account_number: '',
    payment_terms: 'Cash', // Updated field name
    credit_period: '',
    advance_percentage: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/suppliers/get-suppliers`, {
        params: { company_code: userData?.company_code }
      });
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, [userData?.company_code]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers, userData?.company_code]);

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      supplier_name: '',
      email: '',
      phone: '',
      address: '',
      brn: '',
      vat: '',
      bank_name: '',
      branch: '',
      account_number: '',
      payment_terms: 'Cash',
      credit_period: '',
      advance_percentage: ''
    });
    setEditingId(null);
  };

  const handleShow = () => setShowModal(true);

  const handleEdit = (supplier) => {
    setFormData({
      supplier_name: supplier.supplier_name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      brn: supplier.brn,
      vat: supplier.vat || '',
      bank_name: supplier.bank_name || '',
      branch: supplier.branch || '',
      account_number: supplier.account_number || '',
      payment_terms: supplier.payment_terms,
      credit_period: supplier.credit_period || '',
      advance_percentage: supplier.advance_percentage || ''
    });
    setEditingId(supplier.supplier_id);
    setShowModal(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`${BASE_URL}/api/admin/suppliers/delete-suppliers/${supplierId}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate conditional fields
    if (formData.payment_terms === 'Credit' && !formData.credit_period) {
      alert('Credit period is required for credit payment terms');
      return;
    }
    
    if (formData.payment_terms === 'Advance' && !formData.advance_percentage) {
      alert('Advance percentage is required for advance payment terms');
      return;
    }
    
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/admin/suppliers/update-suppliers/${editingId}`, {
          ...formData,
          company_code: userData?.company_code
        });
      } else {
        const response = await axios.post(`${BASE_URL}/api/admin/suppliers/add-suppliers`, {
          ...formData,
          company_code: userData?.company_code,
          created_by: userData?.id
        });
        
        // Show success message with generated supplier ID
        if (response.data.success && response.data.supplier_id) {
          alert(`Supplier created successfully! Supplier ID: ${response.data.supplier_id}`);
        }
      }
      handleClose();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier. Please try again.');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.vat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.bank_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="supplier-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search suppliers..."
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleShow}>Add Supplier</Button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Address</th>
            <th>BRN</th>
            <th>VAT</th>
            <th>Bank Details</th>
            <th>Payment Terms</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSuppliers.map((supplier, index) => (
            <tr key={supplier.supplier_id}>
              <td>{index + 1}</td>
              <td>{supplier.supplier_name}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.email}</td>
              <td>{supplier.address}</td>
              <td>{supplier.brn}</td>
              <td>{supplier.vat}</td>
              <td>
                {supplier.bank_name && (
                  <div>
                    <div><strong>{supplier.bank_name}</strong></div>
                    <div>{supplier.branch}</div>
                    <div>{supplier.account_number}</div>
                  </div>
                )}
              </td>
              <td>
                <div>{supplier.payment_terms}</div>
                {supplier.payment_terms === 'Credit' && supplier.credit_period && (
                  <small>({supplier.credit_period} days)</small>
                )}
                {supplier.payment_terms === 'Advance' && supplier.advance_percentage && (
                  <small>({supplier.advance_percentage}%)</small>
                )}
              </td>
              <td>
                <FaEdit className="action-icon edit" onClick={() => handleEdit(supplier)} />
                <FaTrash className="action-icon delete" onClick={() => handleDelete(supplier.supplier_id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Supplier' : 'Add Supplier'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Supplier Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.supplier_name}
                onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>BRN (Business Registration Number)</Form.Label>
              <Form.Control
                type="text"
                value={formData.brn}
                onChange={(e) => setFormData({...formData, brn: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>VAT Number</Form.Label>
              <Form.Control
                type="text"
                value={formData.vat}
                onChange={(e) => setFormData({...formData, vat: e.target.value})}
              />
            </Form.Group>

            <hr />
            <h6>Bank Details</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Bank Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Branch</Form.Label>
              <Form.Control
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Account Number</Form.Label>
              <Form.Control
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
              />
            </Form.Group>

            <hr />
            <h6>Payment Terms</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Payment Terms</Form.Label>
              <Form.Select
                value={formData.payment_terms}
                onChange={(e) => setFormData({...formData, payment_terms: e.target.value, credit_period: '', advance_percentage: ''})}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
                <option value="Advance">Advance</option>
              </Form.Select>
            </Form.Group>

            {formData.payment_terms === 'Credit' && (
              <Form.Group className="mb-3">
                <Form.Label>Credit Period (Days)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.credit_period}
                  onChange={(e) => setFormData({...formData, credit_period: e.target.value})}
                  required
                  min="1"
                />
              </Form.Group>
            )}

            {formData.payment_terms === 'Advance' && (
              <Form.Group className="mb-3">
                <Form.Label>Advance Percentage (%)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.advance_percentage}
                  onChange={(e) => setFormData({...formData, advance_percentage: e.target.value})}
                  required
                  min="1"
                  max="100"
                />
              </Form.Group>
            )}
            
            <Button variant="primary" type="submit">
              {editingId ? 'Update' : 'Save'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
