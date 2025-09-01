import axios from 'axios';
import { useContext, useEffect, useState, useCallback } from 'react';
import { Alert, Button, Col, Container, Row, Spinner, Table, Form, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setPoLoading(true);
      setPoError('');
      const params = { company_code, ...poFilter };
      const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-orders`, { params });
      setPurchaseOrders(response.data.purchase_orders || []);
    } catch (error) {
      setPoError(error.response?.data?.message || error.message);
    } finally {
      setPoLoading(false);
    }
  }, [company_code, poFilter]);

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

  // GRN history and PO search logic (existing)
  const [grnHistory, setGrnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PO Search State
  const [searchPO, setSearchPO] = useState('');
  const [poResults, setPOResults] = useState([]);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poSearchLoading, setPOLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/grn/history?company_code=${company_code}`
        );
        const data = await response.json();
        if (data.success) {
          setGrnHistory(data.grns);
        } else {
          setError(data.message || 'Failed to fetch GRN history');
        }
      } catch (err) {
        setError('Error fetching GRN history');
      } finally {
        setLoading(false);
      }
    };
    if (company_code) fetchHistory();
  }, [company_code]);

  // Autocomplete PO numbers as user types (logic from AddGRN)
  useEffect(() => {
    if (!searchPO || !company_code) {
      setPOResults([]);
      setShowPODropdown(false);
      return;
    }
    const fetchPOs = async () => {
      setPOLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/grn/search-po?company_code=${company_code}&po_number=${encodeURIComponent(searchPO)}`
        );
        const data = await response.json();
        if (data.success && data.purchase_orders?.length > 0) {
          setPOResults(data.purchase_orders);
          setShowPODropdown(true);
        } else {
          setPOResults([]);
          setShowPODropdown(false);
        }
      } catch {
        setPOResults([]);
        setShowPODropdown(false);
      } finally {
        setPOLoading(false);
      }
    };
    const timeout = setTimeout(fetchPOs, 250);
    return () => clearTimeout(timeout);
  }, [searchPO, company_code]);

  // Handle PO select (from AddGRN logic)
  // Only navigate when Search button is clicked
  const handleSelectPO = (po_number) => {
    setSearchPO('');
    setPOResults([]);
    setShowPODropdown(false);
    navigate(`/warehouse/add-grn/${po_number}`);
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col md={8} lg={6} xl={5}>
          <Card>
            <Card.Body>
              <Form autoComplete="off" onSubmit={e => {
                e.preventDefault();
                // Find the PO in the results that matches the entered PO number
                const found = poResults.find(po => String(po.po_number) === String(searchPO));
                if (found) {
                  handleSelectPO(found.po_number);
                } else {
                  setError('No PO found matching the entered PO number');
                }
              }}>
                <Form.Group>
                  <Form.Label>Search PO Number</Form.Label>
                  <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Form.Control
                      type="text"
                      value={searchPO}
                      onChange={e => setSearchPO(e.target.value)}
                      placeholder="Enter PO number"
                      onFocus={() => searchPO && poResults.length > 0 && setShowPODropdown(true)}
                      onBlur={() => setTimeout(() => setShowPODropdown(false), 200)}
                      style={{ flex: 1 }}
                    />
                    <Button type="submit" variant="primary" disabled={!searchPO || poLoading}>
                      {poLoading ? <Spinner size="sm" /> : 'Search'}
                    </Button>
                    {showPODropdown && poResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '100%',
                        zIndex: 10,
                        background: '#fff',
                        border: '1px solid #ccc',
                        width: '100%',
                        maxHeight: 200,
                        overflowY: 'auto',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        {poResults.map(po => (
                          <div
                            key={po.po_number}
                            style={{ padding: '8px', cursor: 'pointer' }}
                            // Only fill the input, do not navigate
                            onMouseDown={() => {
                              setSearchPO(po.po_number);
                              setShowPODropdown(false);
                            }}
                          >
                            {po.po_number} - {po.supplier_name || po.supplier_id}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Form>
              
             
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* PO Search Card */}
      {/* Purchase Orders Table & Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h5>Purchase Orders</h5>
              {/* Filters */}
              <Form className="mb-3">
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>PO Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={poFilter.po_number}
                        onChange={e => setPoFilter({ ...poFilter, po_number: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Supplier</Form.Label>
                      <Form.Select
                        value={poFilter.supplier_id}
                        onChange={e => setPoFilter({ ...poFilter, supplier_id: e.target.value })}
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
                      <th>Status</th>
                      <th>Delivery Date</th>
                      <th>Created date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center">
                          {poLoading ? 'Loading...' : 'No purchase orders found'}
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map(po => (
                        <tr key={po.po_number} style={{ cursor: 'pointer' }} onClick={() => handleSelectPO(po.po_number)}>
                          <td>{po.po_number}</td>
                          <td>{po.supplier_name || 'Unknown Supplier'}</td>
                          <td>{po.total_quantity || 0}</td>
                          <td>{po.total_styles || 0}</td>
                          <td>{po.total_cost || "0.00"}</td>
                          <td>{po.tolerance_limit !== undefined ? po.tolerance_limit : 0}</td>
                          <td>
                            <span className={`badge ${po.status === 'Pending' ? 'bg-warning text-dark' : 
                              po.status === 'Approved' ? 'bg-success' : 'bg-secondary'}`}>
                              {po.status || 'Pending'}
                            </span>
                          </td>
                          <td>{new Date(po.delivery_date).toLocaleDateString()}</td>
                          <td>{new Date(po.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-3 align-items-center">
        <Col><h2>GRN History</h2></Col>
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
                  <td>{new Date(grn.received_date).toLocaleString()}</td>
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
