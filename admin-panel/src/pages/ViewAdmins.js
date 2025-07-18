import React, { useEffect, useState } from 'react';
import { Table, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import DeleteAdmin from './DeleteAdmin';
import '../styles/ViewAdmins.css';

export default function ViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await fetch('http://localhost:8081/api/viewAdmins');
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
                        <td>
                            <button className="btn-custom-primary" onClick={() => navigate(`/EditAdmins/${admin_users.user_id}`)}>Edit</button>
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
