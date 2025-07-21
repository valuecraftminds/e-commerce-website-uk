import React, { useContext, useEffect, useState } from 'react';
import { Alert, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import DeleteAdmin from '../components/DeleteAdmin';
import '../styles/ViewAdmins.css';
import DeleteAdmin from './DeleteAdmin';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { userData } = useContext(AuthContext);

  const navigate = useNavigate();

  const company_code = userData?.company_code;

   useEffect(() => {
    const fetchAdmins = async () => {
      if (!company_code) {
        setErrorMsg('Company code not available');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8081/api/viewAdmins?company_code=${company_code}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setAdmins(data.admins);
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

    fetchAdmins();
  }, [company_code]);

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="admin-title m-0">Admin Users</h3>
        <button className="btn-custom-primary" onClick={() => navigate('/register')}>Add Admin</button>
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
                        {/* <td>
                            <button className="btn-custom-primary" onClick={() => navigate(`/EditAdmins/${admin_users.user_id}`)}>
                                <i className='bi-pencil'></i>
                            </button>
                            <DeleteAdmin adminId={admin_users.user_id} onDeleteSuccess={() => setAdmins(admins.filter(admin => admin.user_id !== admin_users.user_id))} />
                        </td> */}

                        {/* hide the edit and delete buttons for VCM_Admin role */}
                        <td>
                        {admin_users.Role !== 'VCM_Admin' && (
                            <div className="d-flex align-items-center gap-2 justify-content-center">
                            <button
                                className="btn-custom-primary"
                                onClick={() => navigate(`/EditAdmins/${admin_users.user_id}`)}
                            >
                                <i className="bi bi-pencil"></i>
                            </button>

                            <DeleteAdmin
                                adminId={admin_users.user_id}
                                onDeleteSuccess={() =>
                                setAdmins(admins.filter(admin => admin.user_id !== admin_users.user_id))
                                }
                            />
                            </div>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </Table>
            </div>
            )}
        </div>
      )}
    </div>
  );
  }
