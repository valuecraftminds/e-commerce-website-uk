import React, { useEffect, useState } from 'react';
import { Table, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';

import Header from '../../components/Header';
import DeleteAdmin from '../../components/DeleteAdmin';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewCompanyAdmins() {
  return (
    <div className="dashboard-container">
      <Header role="VCM_Admin" data-testid="header-toggle-button" />
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<ViewCompanyAdminsHome />} />
        </Routes>
      </main>
    </div>
  );
}

function ViewCompanyAdminsHome() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/company-admins`);
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
    }, []);

    return (
        <div className="admin-container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="admin-title m-0">Company Admin Users</h3>
            <button className="btn-custom-primary" onClick={() => navigate('/vcm-admin-dashboard/register-company-admins/')}>Add Company Admin</button>
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
                    <th className='table-header'>Company Code</th>
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
                        <td>{admin_users.Company_Code}</td>
                        <td>
                            {/* <button className="btn-custom-primary" onClick={() => navigate(`/EditAdmins/${admin_users.user_id}`)}>Edit</button> */}
                            <DeleteAdmin adminId={admin_users.user_id} onDeleteSuccess={() => setAdmins(admins.filter(admin => admin.user_id !== admin_users.user_id))} />
                        </td>
                    </tr>
                    ))}
                </tbody>
                </Table>
            </div>
            )}
        </div>
    );
}
