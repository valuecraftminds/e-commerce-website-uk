import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Table } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import DeleteModal from '../../components/modals/DeleteModal';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewCompanyAdmins() {
  const [companyAdmins, setCompanyAdmins] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [deleteModalId, setDeleteModalId] = useState(null);

  const { companyCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyAdmins = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = {};
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Fetch all admins and filter by company
        const response = await fetch(`${BASE_URL}/api/admin/auth/get-company-admins`, {
          headers: headers
        });
        const data = await response.json();

        if (response.ok && data.success) {
          // Filter admins for the selected company
          const filteredAdmins = data.admins.filter(admin => admin.Company_Code === companyCode);
          setCompanyAdmins(filteredAdmins);
          
          // Get company details from the first admin (if available)
          if (filteredAdmins.length > 0) {
            setCompanyDetails({
              company_code: filteredAdmins[0].Company_Code,
              company_name: filteredAdmins[0].company_name || companyCode,
            });
          }
        } else {
          setErrorMsg(data.message || 'Failed to fetch company admins');
        }
      } catch (error) {
        setErrorMsg('Server error. Please try again later.');
        console.error('Error fetching company admins:', error);
      }

      // Also fetch company details separately
      try {
        const token = localStorage.getItem('authToken');
        const headers = {};
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const companyResponse = await fetch(`${BASE_URL}/api/admin/companies`, {
          headers: headers
        });
        const companyData = await companyResponse.json();

        if (companyResponse.ok && companyData.success) {
          const company = companyData.companies.find(c => c.company_code === companyCode);
          if (company) {
            setCompanyDetails(company);
          }
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyCode) {
      fetchCompanyAdmins();
    }
  }, [companyCode]);

  const handleCreateAdmin = () => {
    navigate(`/vcm-admin/register-company-admins?company_code=${companyCode}`);
  };

  // Handler for delete success
  const handleDeleteSuccess = (deletedAdminId) => {
    setCompanyAdmins(prev => prev.filter(admin => admin.user_id !== deletedAdminId));
    setDeleteModalId(null);
  };

  const handleBackToCompanies = () => {
    navigate('/vcm-admin/view-companies');
  };

  if (loading) {
    return (
      <div className="admin-container mt-4">
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading company admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="me-3"
            onClick={handleBackToCompanies}
          >
            <i className="bi-arrow-left"></i> Back to Companies
          </Button>
          <div>
            <h5 className="admin-title m-0">
              {companyDetails?.company_name || companyCode} - Company users
            </h5>
            <small className="text-muted">Company Code: {companyCode}</small>
          </div>
        </div>
        <div>
          <Button 
            variant="success"
            onClick={handleCreateAdmin}
          >
            <i className="bi-person-plus"></i> Add Admin
          </Button>
        </div>
      </div>

      {companyDetails && (
        <div className="mb-3">
          <div className="d-flex align-items-center">
            {companyDetails.company_logo && (
              <img 
                src={`${BASE_URL}/uploads/company_logos/${companyDetails.company_logo}`} 
                alt="Company Logo" 
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'contain',
                  marginRight: '15px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}
              />
            )}
            <div>
              <h5 className="mb-1">{companyDetails.company_name}</h5>
              <div className="text-muted">
                <Badge bg="primary" className="me-2">
                  {companyAdmins.length} Admin{companyAdmins.length !== 1 ? 's' : ''}
                </Badge>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && <Alert variant="danger" className="mt-3">{errorMsg}</Alert>}

      {!errorMsg && (
        <div className="table-responsive">
          {companyAdmins.length > 0 ? (
            <Table striped hover className="align-middle">
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
                {companyAdmins.map((admin, index) => (
                  <tr key={admin.user_id || index}>
                    <td>{index + 1}</td>
                    <td>{admin.Name}</td>
                    <td>{admin.Email}</td>
                    <td>{admin.Phone}</td>
                    <td>
                      <Badge bg="info">{admin.role || 'Company_Admin'}</Badge>
                    </td>
                    <td>
                      <Button 
                        variant="warning" 
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/vcm-admin/edit-company-admins/${admin.user_id}`)}
                      >
                        <i className="bi-pencil"></i>
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModalId(admin.user_id)}
                      >
                        <i className="bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <i className="bi-people" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
              <h4 className="mt-3 text-muted">No Admins Found</h4>
              <p className="text-muted mb-4">This company doesn't have any administrators yet.</p>
              <Button 
                variant="primary"
                size="lg"
                onClick={handleCreateAdmin}
              >
                <i className="bi-person-plus"></i> Create First Admin
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Delete Modal (single instance, controlled by state) */}
      <DeleteModal
        id={deleteModalId}
        show={!!deleteModalId}
        onHide={() => setDeleteModalId(null)}
        deleteUrl={id => id ? `/api/admin/auth/delete-admin/${id}` : ''}
        entityLabel="admin"
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
