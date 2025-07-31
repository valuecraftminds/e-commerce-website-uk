import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
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
    payment: 'Credit' // Set default value
  });
  const [editingId, setEditingId] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/suppliers/get-suppliers`, {
        params: { company_code: userData?.company_code }
      });
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [userData?.company_code]);

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      supplier_name: '',
      email: '',
      phone: '',
      address: '',
      brn: '',
      payment: 'Credit'
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
      payment: supplier.payment
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
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/admin/suppliers/update-suppliers/${editingId}`, {
          ...formData,
          company_code: userData?.company_code
        });
      } else {
        await axios.post(`${BASE_URL}/api/admin/suppliers/add-suppliers`, {
          ...formData,
          company_code: userData?.company_code,
          created_by: userData?.id
        });
      }
      handleClose();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <td>{supplier.payment}</td>
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
              <Form.Label>BRN</Form.Label>
              <Form.Control
                type="text"
                value={formData.brn}
                onChange={(e) => setFormData({...formData, brn: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Terms</Form.Label>
              <Form.Select
                value={formData.payment}
                onChange={(e) => setFormData({...formData, payment: e.target.value})}
                required
              >
                <option value="Credit">Credit</option>
                <option value="Debit">Debit</option>
                <option value="Advance">Advance</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              {editingId ? 'Update' : 'Save'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
