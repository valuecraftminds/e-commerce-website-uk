import axios from 'axios';
import { useContext, useEffect, useState, useCallback } from 'react';
import { Alert, Button, Col, Container, Row, Table, Form, Card, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';
// For purchase orders table



const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function WarehouseGRN() {
  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;
  const navigate = useNavigate();

  // Purchase Orders Table State (move inside component)
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poSuppliers, setPoSuppliers] = useState([]);
  const [poFilter, setPoFilter] = useState({
    po_number: '',
    supplier_id: '',
    from_date: '',
    to_date: ''
  });
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // New state for tabs

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setPoLoading(true);
      setPoError('');
      const params = { 
        company_code, 
        ...poFilter,
        ...(activeTab !== 'all' && { status: activeTab }) // Only add status filter if not 'all'
      };
      const response = await axios.get(`${BASE_URL}/api/admin/grn/purchase-orders-with-status`, { params });
      setPurchaseOrders(response.data.purchase_orders || []);
    } catch (error) {
      setPoError(error.response?.data?.message || error.message);
    } finally {
      setPoLoading(false);
    }
  }, [company_code, poFilter, activeTab]);

  // Fetch all PO numbers for dropdown (independent of filters)
  const fetchAllPONumbers = useCallback(async () => {
    if (!company_code) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/grn/purchase-orders-with-status`, {
        params: { company_code } // No filters, get all POs
      });
      if (response.data.purchase_orders?.length > 0) {
        const poNumbers = response.data.purchase_orders.map(po => po.po_number);
        setAllPONumbers([...new Set(poNumbers)]); // Remove duplicates
      } else {
        setAllPONumbers([]);
      }
    } catch (error) {
      console.error('Error fetching PO numbers:', error);
      setAllPONumbers([]);
    }
  }, [company_code]); // Add activeTab to dependencies

  // Fetch suppliers for PO filter
  const fetchPoSuppliers = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/suppliers/get-suppliers`, {
        params: { company_code }
      });
      setPoSuppliers(response.data.suppliers || []);
    } catch (error) {
      // ignore
    }
  }, [company_code]);

  useEffect(() => {
    if (company_code) {
      fetchPurchaseOrders();
      fetchPoSuppliers();
    }
  }, [company_code, fetchPurchaseOrders, fetchPoSuppliers]);

  // Separate useEffect for fetching PO numbers only once
  useEffect(() => {
    if (company_code) {
      fetchAllPONumbers();
    }
  }, [company_code]); // Only depend on company_code

  // GRN history logic
  const [grnHistory, setGrnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grnFilter, setGrnFilter] = useState({
    search: '',
    status: '',
    from_date: '',
    to_date: ''
  });

  // PO Number dropdown state
  const [allPONumbers, setAllPONumbers] = useState([]);
  const [showPODropdown, setShowPODropdown] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          company_code,
          ...grnFilter
        });
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/grn/history`, {
          params: {
            company_code,
            ...grnFilter
          }
        });
        if (response.data.success) {
          setGrnHistory(response.data.grns);
        } else {
          setError(response.data.message || 'Failed to fetch GRN history');
        }
      } catch (err) {
        setError('Error fetching GRN history');
      } finally {
        setLoading(false);
      }
    };
    if (company_code) fetchHistory();
  }, [company_code, grnFilter]);

  // Handle PO select - navigate to add GRN page
  const handleSelectPO = (po_number) => {
    navigate(`/warehouse/add-grn/${po_number}`);
  };

  // Fetch GRN history with filters
  const fetchGRNHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        company_code,
        ...grnFilter
      });
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/grn/history`, {
        params: {
          company_code,
          ...grnFilter
        }
      });
      if (response.data.success) {
        setGrnHistory(response.data.grns);
      } else {
        setError(response.data.message || 'Failed to fetch GRN history');
      }
    } catch (err) {
      setError('Error fetching GRN history');
    } finally {
      setLoading(false);
    }
  }, [company_code, grnFilter]);

  return (
    <Container className="py-4">
      
      {/* Purchase Orders Table & Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h5>Purchase Orders</h5>
              
              {/* Status Tabs */}
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'all'} 
                    onClick={() => !poLoading && setActiveTab('all')}
                    style={{ cursor: poLoading ? 'not-allowed' : 'pointer', opacity: poLoading ? 0.6 : 1 }}
                  >
                    All
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'pending'} 
                    onClick={() => !poLoading && setActiveTab('pending')}
                    style={{ cursor: poLoading ? 'not-allowed' : 'pointer', opacity: poLoading ? 0.6 : 1 }}
                  >
                    Pending
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'partial'} 
                    onClick={() => !poLoading && setActiveTab('partial')}
                    style={{ cursor: poLoading ? 'not-allowed' : 'pointer', opacity: poLoading ? 0.6 : 1 }}
                  >
                    Partial
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'completed'} 
                    onClick={() => !poLoading && setActiveTab('completed')}
                    style={{ cursor: poLoading ? 'not-allowed' : 'pointer', opacity: poLoading ? 0.6 : 1 }}
                  >
                    Completed
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {/* Filters */}
              <Form className="mb-3">
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>PO Number</Form.Label>
                      <div style={{ position: 'relative' }}>
                        <Form.Control
                          type="text"
                          value={poFilter.po_number}
                          onChange={e => setPoFilter({ ...poFilter, po_number: e.target.value })}
                          onFocus={() => setShowPODropdown(true)}
                          onBlur={() => setTimeout(() => setShowPODropdown(false), 200)}
                          placeholder="Select or type PO number"
                          disabled={poLoading}
                        />
                        {showPODropdown && allPONumbers.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            background: '#fff',
                            border: '1px solid #ccc',
                            borderTop: 'none',
                            maxHeight: 200,
                            overflowY: 'auto',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            {allPONumbers
                              .filter(po => po.toLowerCase().includes(poFilter.po_number.toLowerCase()))
                              .map(po => (
                                <div
                                  key={po}
                                  style={{ 
                                    padding: '8px 12px', 
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee'
                                  }}
                                  onMouseDown={() => {
                                    setPoFilter({ ...poFilter, po_number: po });
                                    setShowPODropdown(false);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#fff';
                                  }}
                                >
                                  {po}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Supplier</Form.Label>
                      <Form.Select
                        value={poFilter.supplier_id}
                        onChange={e => setPoFilter({ ...poFilter, supplier_id: e.target.value })}
                        disabled={poLoading}
                      >
                        <option value="">All Suppliers</option>
                        {poSuppliers.map(s => (
                          <option key={s.supplier_id} value={s.supplier_id}>
                            {s.supplier_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={poFilter.from_date}
                        onChange={e => setPoFilter({ ...poFilter, from_date: e.target.value })}
                        disabled={poLoading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={poFilter.to_date}
                        onChange={e => setPoFilter({ ...poFilter, to_date: e.target.value })}
                        disabled={poLoading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button onClick={fetchPurchaseOrders} disabled={poLoading}>
                      Filter
                    </Button>
                  </Col>
                </Row>
              </Form>
              {/* Table */}
              {poError && <Alert variant="danger">{poError}</Alert>}
              {poLoading ? (
                <div className="text-center py-4">
                  <Spinner text="Loading purchase orders..." />
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Supplier</th>
                        <th>Total Quantity</th>
                        <th>Total Styles</th>
                        <th>Total Cost</th>
                        <th>Tolerance Limit (%)</th>
                        {(activeTab === 'partial' || activeTab === 'completed') && <th>Latest GRN Date</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.length === 0 ? (
                        <tr>
                          <td colSpan={(['partial', 'completed'].includes(activeTab)) ? '7' : '6'} className="text-center">
                            No {activeTab === 'all' ? '' : activeTab} purchase orders found
                          </td>
                        </tr>
                      ) : (
                        purchaseOrders.map(po => (
                          <tr key={po.po_number} style={{ cursor: 'pointer' }} onClick={() => handleSelectPO(po.po_number)}>
                            <td>{po.po_number}</td>
                            <td>{po.supplier_name || 'Unknown Supplier'}</td>
                            <td>{po.total_quantity || 0}</td>
                            <td>{po.total_styles || 0}</td>
                            <td>${parseFloat(po.total_cost || 0).toFixed(2)}</td>
                            <td>{po.tolerance_limit !== undefined ? po.tolerance_limit : 0}%</td>
                           
                            {(activeTab === 'partial' || activeTab === 'completed') && <td>{po.latest_grn_date ? new Date(po.latest_grn_date).toLocaleDateString() : '-'}</td>}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-3 align-items-center">
        <Col><h2>GRN History</h2></Col>
      </Row>
      
      {/* GRN History Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Form className="mb-3">
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Search</Form.Label>
                      <Form.Control
                        type="text"
                        value={grnFilter.search}
                        onChange={e => setGrnFilter({ ...grnFilter, search: e.target.value })}
                        placeholder="GRN ID, PO Number, Batch Number, Supplier"
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={grnFilter.status}
                        onChange={e => setGrnFilter({ ...grnFilter, status: e.target.value })}
                        disabled={loading}
                      >
                        <option value="">All Status</option>
                        <option value="partial">Partial</option>
                        <option value="complete">Complete</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={grnFilter.from_date}
                        onChange={e => setGrnFilter({ ...grnFilter, from_date: e.target.value })}
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={grnFilter.to_date}
                        onChange={e => setGrnFilter({ ...grnFilter, to_date: e.target.value })}
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button onClick={fetchGRNHistory} disabled={loading} className="me-2">
                      {loading ? 'Filtering...' : 'Filter'}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setGrnFilter({ search: '', status: '', from_date: '', to_date: '' })}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  </Col>
                  <Col md={1} className="d-flex align-items-end">
                    
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>GRN ID</th>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Received Date</th>
              <th>Status</th>
              <th>Batch Number</th>
              <th>Total Items</th>
              <th>Total Qty</th>
            </tr>
          </thead>
          <tbody>
            {grnHistory.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-muted">No GRN records found</td></tr>
            ) : (
              grnHistory.map(grn => (
                <tr key={grn.grn_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/warehouse/grn-details/${grn.grn_id}`)}>
                  <td>{grn.grn_id}</td>
                  <td>{grn.po_number}</td>
                  <td>{grn.supplier_name || grn.supplier_id}</td>
                  <td>{new Date(grn.received_date).toLocaleDateString()}</td>
                  <td>{grn.status}</td>
                  <td>{grn.batch_number || '-'}</td>
                  <td>{grn.total_items || grn.items_count || '-'}</td>
                  <td>{grn.total_qty || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
