import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function WarehouseGRN() {
  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;
  const navigate = useNavigate();

  const [grnHistory, setGrnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col><h2>GRN History</h2></Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => navigate('/warehouse/add-grn')}>Add GRN</Button>
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
