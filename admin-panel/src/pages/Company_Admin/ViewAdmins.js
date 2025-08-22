import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

import DeleteModal from '../../components/modals/DeleteModal';

import '../../styles/ViewAdmins.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { userData } = useContext(AuthContext);

  // For DeleteModal: { id, confirmMessage }
  const [deleteModalInfo, setDeleteModalInfo] = useState({ id: null, confirmMessage: '' });

  const navigate = useNavigate();

  const company_code = userData?.company_code;

  // Handler to open delete modal with custom message
  const handleOpenDeleteModal = (admin) => {
    const confirmMessage = `Are you sure you want to delete admin "${admin.Name}"? This action cannot be undone.`;
    setDeleteModalInfo({ id: admin.user_id, confirmMessage });
  };


  // Fetch admins from server
  const fetchAdmins = async () => {
    if (!company_code) {
      setErrorMsg('Company code not available');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/auth/get-all-admins?company_code=${company_code}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setAdmins(data.admins);
        setErrorMsg('');
      } else {
        setErrorMsg(data.message || 'Failed to fetch admin list');
      }
    } catch (error) {
      setErrorMsg('Server error. Please try again later.');
      console.error('Error fetching admin list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for delete success: close modal first, then refresh
  const handleDeleteSuccess = () => {
    setDeleteModalInfo({ id: null, confirmMessage: '' });
    fetchAdmins();
  };

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company_code]);

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="admin-title m-0">Company Users</h3>
        <button className="btn-custom-primary" onClick={() => navigate('/register')}>
          <FaPlus size={14} style={{ marginRight: '8px' }} />
          Add User
        </button>
      </div>

      {errorMsg && <Alert variant="danger" className="mt-3">{errorMsg}</Alert>}

      {!loading && !errorMsg && (
        <div className="table-responsive">
          <Table className="align-middle text-center">
            <thead>
              <tr>
                <th className='table-header'>#</th>
                <th className='table-header'>Name</th>
                <th className='table-header'>Email</th>
                <th className='table-header'>Phone</th>
                <th className='table-header'>Role</th>
                <th className='table-header'>Side bar options</th>
                <th className='table-header'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin_users, index) => (
                <tr key={admin_users.id || index}>
                  <td>{index + 1}</td>
                  <td>{admin_users.Name}</td>
                  <td>{admin_users.Email}</td>
                  <td>{admin_users.Phone}</td>
                  <td>{admin_users.Role}</td>
                  <td>{admin_users.side_bar_options ? JSON.stringify(admin_users.side_bar_options) : 'N/A'}</td>
                  <td>
                    <Button variant="warning" onClick={() => navigate(`/EditAdmins/${admin_users.user_id}`)}><i className="bi-pencil"></i></Button>
                    <Button variant="danger" onClick={() => handleOpenDeleteModal(admin_users)} style={{ marginLeft: 8 }}>
                      <i className="bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {/* Delete Modal (single instance, controlled by state) */}
      <DeleteModal
        id={deleteModalInfo.id}
        show={!!deleteModalInfo.id}
        onHide={() => setDeleteModalInfo({ id: null, confirmMessage: '' })}
        // Pass a function to build the delete URL for this entity
        deleteUrl={(id) => id ? `/api/admin/auth/delete-admin/${id}?company_code=${company_code}` : ''}
        entityLabel="admin"
        confirmMessage={deleteModalInfo.confirmMessage}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
