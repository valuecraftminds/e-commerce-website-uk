import React, { useEffect, useState } from 'react';
import { Alert, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DeleteAdmin from '../../components/DeleteAdmin';
import LicenseModal from '../../components/LicenseModal';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewCompanyAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState(null);
  const [licenses, setLicenses] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch(`${BASE_URL}/admin/api/company-admins`);
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

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const licensePromises = admins.map(admin => 
          fetch(`${BASE_URL}/admin/api/get-license/${admin.Company_Code}`)
            .then(res => res.json())
        );
        
        const licenseResults = await Promise.all(licensePromises);
        const licenseMap = {};
        licenseResults.forEach((result, index) => {
          if (result.success) {
            licenseMap[admins[index].Company_Code] = result.license;
          }
        });
        setLicenses(licenseMap);
      } catch (error) {
        console.error('Error fetching licenses:', error);
      }
    };

    if (admins.length > 0) {
      fetchLicenses();
    }
  }, [admins]);

  const handleLicenseUpdate = (companyCode) => {
    setSelectedCompanyCode(companyCode);
    setShowLicenseModal(true);
  };

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="admin-title m-0">Company Admins</h3>
        <button className="btn-custom-primary" onClick={() => navigate('/vcm-admin/register-company-admins')}>Add Company Admin</button>
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
                <th className='table-header'>License</th>
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
                      {licenses[admin_users.Company_Code]?.category_count || 0} Categories
                  </td>
                  <td>
                    <Button 
                      variant="info"                      
                      className="me-2"
                      onClick={() => handleLicenseUpdate(admin_users.Company_Code)}
                    >
                      <i className="bi-key"></i>
                      
                    </Button>
                    <Button 
                      variant="warning" 
                      className="me-2"
                      onClick={() => navigate(`/edit-company-admin/${admin_users.user_id}`)}
                    >
                      <i className="bi-pencil"></i>
                    </Button>
                    <DeleteAdmin 
                      adminId={admin_users.user_id} 
                      onDeleteSuccess={() => setAdmins(admins.filter(admin => admin.user_id !== admin_users.user_id))} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <LicenseModal
        show={showLicenseModal}
        onHide={() => setShowLicenseModal(false)}
        company_code={selectedCompanyCode}
        onSuccess={() => {
          const fetchLicenses = async () => {
            const response = await fetch(`${BASE_URL}/admin/api/get-license/${selectedCompanyCode}`);
            const data = await response.json();
            if (data.success) {
              setLicenses(prev => ({
                ...prev,
                [selectedCompanyCode]: data.license
              }));
            }
          };
          fetchLicenses();
        }}
      />
    </div>
  );
}
