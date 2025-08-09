import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function LicenseManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [licenseData, setLicenseData] = useState({ category_count: 0 });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/admin/license/all`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setCompanies(data.companies);
        setErrorMsg('');
      } else {
        setErrorMsg(data.message || 'Failed to fetch license data');
      }
    } catch (error) {
      setErrorMsg('Server error. Please try again later.');
      console.error('Error fetching license data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleEditLicense = (company) => {
    setSelectedCompany(company);
    setLicenseData({ category_count: company.category_count || 0 });
    setModalError('');
    setModalSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

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
        setModalSuccess(data.message);
        
        // Refresh the data
        await fetchLicenses();
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      } else {
        setModalError(data.message || 'Failed to update license');
      }
    } catch (error) {
      console.error('Error updating license:', error);
      setModalError('Server error. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteLicense = async (companyCode) => {
    if (!window.confirm('Are you sure you want to delete this license? This will reset the category count to 0.')) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/admin/license/${companyCode}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('License deleted successfully');
        fetchLicenses(); // Refresh data
      } else {
        setErrorMsg(data.message || 'Failed to delete license');
      }
    } catch (error) {
      console.error('Error deleting license:', error);
      setErrorMsg('Server error. Please try again.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setLicenseData({ category_count: 0 });
    setModalError('');
    setModalSuccess('');
  };

  const getLicenseStatus = (categoryCount) => {
    if (categoryCount === 0) {
      return <Badge bg="danger">No License</Badge>;
    } else if (categoryCount <= 5) {
      return <Badge bg="warning">Basic ({categoryCount})</Badge>;
    } else if (categoryCount <= 20) {
      return <Badge bg="info">Standard ({categoryCount})</Badge>;
    } else {
      return <Badge bg="success">Premium ({categoryCount})</Badge>;
    }
  };

  return (
    <div className="admin-container mt-4">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="admin-title m-0">License Management</h3>
            <p className="text-muted">Manage category licenses for all companies</p>
          </div>
          <Button variant="outline-secondary" onClick={() => navigate('/vcm-admin/view-companies')}>
            <i className="bi bi-arrow-left me-2"></i>Back to Companies
          </Button>
        </div>

        {errorMsg && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="m-0">Company Licenses</h5>
            <Button variant="outline-primary" size="sm" onClick={fetchLicenses}>
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </Button>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading licenses...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Company Code</th>
                      <th>Company Name</th>
                      <th>Currency</th>
                      <th>License Status</th>
                      <th>Categories Allowed</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company, index) => (
                      <tr key={company.company_id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <code className="text-primary">{company.company_code}</code>
                        </td>
                        <td>
                          <strong>{company.company_name}</strong>
                        </td>
                        <td>{company.currency}</td>
                        <td>{getLicenseStatus(company.category_count || 0)}</td>
                        <td>
                          <span className="fw-bold fs-5">
                            {company.category_count || 0}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {company.license_updated 
                              ? new Date(company.license_updated).toLocaleDateString()
                              : 'Never'
                            }
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditLicense(company)}
                              title="Edit License"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            {company.category_count > 0 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteLicense(company.company_code)}
                                title="Delete License"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          <i className="bi bi-inbox display-4 d-block mb-2"></i>
                          No companies found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* License Edit Modal */}
        <Modal show={showModal} onHide={closeModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-key-fill text-warning me-2"></i>
              Edit License - {selectedCompany?.company_name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && (
              <Alert variant="danger" className="mb-3">
                <i className="bi bi-exclamation-circle me-2"></i>
                {modalError}
              </Alert>
            )}
            {modalSuccess && (
              <Alert variant="success" className="mb-3">
                <i className="bi bi-check-circle me-2"></i>
                {modalSuccess}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <div className="mb-3 p-3 bg-light rounded">
                <div className="row">
                  <div className="col-sm-4"><strong>Company:</strong></div>
                  <div className="col-sm-8">{selectedCompany?.company_name}</div>
                </div>
                <div className="row">
                  <div className="col-sm-4"><strong>Code:</strong></div>
                  <div className="col-sm-8">
                    <code>{selectedCompany?.company_code}</code>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-4"><strong>Current License:</strong></div>
                  <div className="col-sm-8">
                    {selectedCompany && getLicenseStatus(selectedCompany.category_count || 0)}
                  </div>
                </div>
              </div>
              
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <i className="bi bi-tags me-2"></i>
                  Category Count
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="1000"
                  value={licenseData.category_count}
                  onChange={(e) => setLicenseData({ ...licenseData, category_count: e.target.value })}
                  placeholder="Enter number of categories allowed"
                  required
                />
                <Form.Text className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Set the number of product categories this company is licensed for (0 = no license).
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" onClick={closeModal} disabled={modalLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={modalLoading}>
                  {modalLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Updating License...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 me-2"></i>
                      Update License
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}
