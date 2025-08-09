import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // License modal states
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [licenseData, setLicenseData] = useState({ category_count: 0 });
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [licenseSuccess, setLicenseSuccess] = useState('');

  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = {};
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Use the new license endpoint that includes company and license data
        const response = await fetch(`${BASE_URL}/api/admin/license/all`, {
          headers: headers
        });
        const data = await response.json();

        if (response.ok && data.success) {
          console.log('Companies data received:', data.companies); // Debug log
          setCompanies(data.companies);
        } else {
          setErrorMsg(data.message || 'Failed to fetch companies list');
        }
      } catch (error) {
        setErrorMsg('Server error. Please try again later.');
        console.error('Error fetching companies list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleCreateAdmin = (companyCode) => {
    navigate(`/vcm-admin/register-company-admins?company_code=${companyCode}`);
  };    

  const handleViewAdmins = (companyCode) => {
    navigate(`/vcm-admin/view-company-admins/${companyCode}`);
  };

  const handleManageLicense = (company) => {
    setSelectedCompany(company);
    setLicenseData({ category_count: company.category_count || 0 });
    setLicenseError('');
    setLicenseSuccess('');
    setShowLicenseModal(true);
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    setLicenseLoading(true);
    setLicenseError('');
    setLicenseSuccess('');

    try {
      const response = await fetch(`${BASE_URL}/api/admin/license/add-license`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          company_code: selectedCompany.company_code,
          category_count: parseInt(licenseData.category_count)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLicenseSuccess(data.message);
        
        // Update the companies list to reflect the new license data
        setCompanies(prev => prev.map(company => 
          company.company_code === selectedCompany.company_code 
            ? { ...company, category_count: parseInt(licenseData.category_count) }
            : company
        ));

        // Close modal after a short delay
        setTimeout(() => {
          setShowLicenseModal(false);
        }, 1500);
      } else {
        setLicenseError(data.message || 'Failed to update license');
      }
    } catch (error) {
      console.error('Error updating license:', error);
      setLicenseError('Server error. Please try again.');
    } finally {
      setLicenseLoading(false);
    }
  };

  const closeLicenseModal = () => {
    setShowLicenseModal(false);
    setSelectedCompany(null);
    setLicenseData({ category_count: 0 });
    setLicenseError('');
    setLicenseSuccess('');
  };

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="admin-title m-0">Companies</h3>
        <div>
          <button 
            className="btn-custom-primary" 
            onClick={() => navigate('/vcm-admin/register-company')}
          >
            Add Company
          </button>
        </div>
      </div>

      {errorMsg && <Alert variant="danger" className="mt-3">{errorMsg}</Alert>}

      {!loading && !errorMsg && (
        <div className="table-responsive">
          <Table className="align-middle text-center">
            <thead>
              <tr>
                <th className='table-header'>#</th>
                <th className='table-header'>Company Code</th>
                <th className='table-header'>Company Name</th>
                <th className='table-header'>Address</th>
                <th className='table-header'>Currency</th>
                <th className='table-header'>Logo</th>
                <th className='table-header'>License (Categories)</th>
                <th className='table-header'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr key={company.company_id || company.id || index}>
                  <td>{index + 1}</td>
                  <td><strong>{company.company_code}</strong></td>
                  <td>{company.company_name}</td>
                  <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {company.company_address}
                  </td>
                  <td>{company.currency}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      {company.company_logo ? (
                        <>
                          <img 
                            src={`${BASE_URL}/uploads/company_logos/${company.company_logo}`} 
                            alt="Company Logo" 
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'contain',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              backgroundColor: '#f8f9fa'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.querySelector('.logo-placeholder').style.display = 'inline-block';
                            }}
                          />
                          <span 
                            className="logo-placeholder"
                            style={{
                              display: 'none',
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#e9ecef',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              textAlign: 'center',
                              lineHeight: '40px',
                              fontSize: '12px',
                              color: '#6c757d'
                            }}
                          >
                            N/A
                          </span>
                        </>
                      ) : (
                        <span 
                          className="logo-placeholder"
                          style={{
                            display: 'inline-block',
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#e9ecef',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            textAlign: 'center',
                            lineHeight: '40px',
                            fontSize: '12px',
                            color: '#6c757d'
                          }}
                        >
                          N/A
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${company.category_count > 0 ? 'bg-success' : 'bg-secondary'}`}>
                      {company.category_count || 0} Categories
                    </span>
                  </td>
                  <td>
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="me-2"
                      onClick={() => handleViewAdmins(company.company_code)}
                      title="View Admins"
                    >
                      <i className="bi bi-people"></i>
                    </Button>
                    <Button 
                      variant="info" 
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/vcm-admin/edit-company/${company.company_id || company.id}`)}
                      title="Edit Company"
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button 
                      variant="warning" 
                      size="sm"
                      className="me-2"
                      onClick={() => handleManageLicense(company)}
                      title="Manage License"
                    >
                      <i className="bi bi-key"></i>
                    </Button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No companies found. <Button variant="link" onClick={() => navigate('/vcm-admin/register-company')}>Add your first company</Button>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* License Management Modal */}
      <Modal show={showLicenseModal} onHide={closeLicenseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-key me-2"></i>
            Manage License - {selectedCompany?.company_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {licenseError && (
            <Alert variant="danger" className="mb-3">
              {licenseError}
            </Alert>
          )}
          {licenseSuccess && (
            <Alert variant="success" className="mb-3">
              {licenseSuccess}
            </Alert>
          )}
          
          <Form onSubmit={handleLicenseSubmit}>
            <div className="mb-3">
              <strong>Company Code:</strong> {selectedCompany?.company_code}
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Category Count</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={licenseData.category_count}
                onChange={(e) => setLicenseData({ ...licenseData, category_count: e.target.value })}
                placeholder="Enter number of categories allowed"
                required
              />
              <Form.Text className="text-muted">
                Set the number of product categories this company is licensed for.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={closeLicenseModal} disabled={licenseLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={licenseLoading}>
                {licenseLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  'Update License'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
