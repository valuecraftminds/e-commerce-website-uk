
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Alert } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ViewPurchaseOrder() {
  const navigate = useNavigate();
  const { po_number } = useParams();
  const { userData } = useContext(AuthContext);
  const [poDetails, setPoDetails] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPODetails = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Use the same endpoint as in PurchaseOrderForm.js view mode
        const response = await axios.get(`${BASE_URL}/api/admin/po/get-purchase-order-details/${po_number}`, {
          params: { company_code: userData?.company_code }
        });
        if (response.data.success) {
          // For view mode, fetch available stock for each item
          const itemsWithStock = await Promise.all(
            (response.data.items || []).map(async item => {
              try {
                const stockRes = await axios.get(`${BASE_URL}/api/admin/stock/get-stock-summary`, {
                  params: {
                    company_code: userData?.company_code,
                    style_number: item.style_number,
                    sku: item.sku
                  }
                });
                return {
                  ...item,
                  available_stock_qty: stockRes.data?.stock_qty ?? '-'
                };
              } catch {
                return {
                  ...item,
                  available_stock_qty: '-'
                };
              }
            })
          );
          setPoDetails({ ...response.data, items: itemsWithStock });
          setPoItems(itemsWithStock);
        } else {
          setError('Failed to load purchase order details');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (userData?.company_code && po_number) fetchPODetails();
  }, [userData?.company_code, po_number]);

  if (isLoading) {
    return <Container className="mt-4"><Alert variant="info">Loading...</Alert></Container>;
  }

  if (error) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!poDetails) {
    return null;
  }

  return (
    <Container fluid className="p-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>Purchase Order Details - {po_number}</h4>
          <Button variant="outline-secondary" onClick={() => navigate('/merchandising/po')}>
            <FaArrowLeft className="me-2" />
            Back to List
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h6>Header Information</h6>
              <Table bordered size="sm">
                <tbody>
                  <tr><th>PO Number:</th><td>{poDetails.header.po_number}</td></tr>
                  <tr><th>Supplier:</th><td>{poDetails.header.supplier_name}</td></tr>
                  <tr><th>Attention:</th><td>{poDetails.header.attention}</td></tr>
                  <tr><th>Delivery Date:</th><td>{poDetails.header.delivery_date ? new Date(poDetails.header.delivery_date).toLocaleDateString() : '-'}</td></tr>
                  <tr><th>Tolerance Limit (%):</th><td>{poDetails.header.tolerance_limit}</td></tr>
                  <tr>
                    <th>Status:</th>
                    <td>
                      <span className={`badge ${poDetails.header.status === 'Pending' ? 'bg-warning text-dark' : 
                        poDetails.header.status === 'Approved' ? 'bg-success' : 'bg-secondary'}`}>
                        {poDetails.header.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <h6>Summary</h6>
              <Table bordered size="sm">
                <tbody>
                  <tr><th>Total Items:</th><td>{poDetails.items ? poDetails.items.length : 0}</td></tr>
                  <tr><th>Total Quantity:</th><td>{poDetails.items ? poDetails.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) : 0}</td></tr>
                  <tr><th>Total Amount:</th><td>${parseFloat(poDetails.total_amount || 0).toFixed(2)}</td></tr>
                  <tr><th>Delivery Date:</th><td>{new Date(poDetails.header.delivery_date).toLocaleDateString()}</td></tr>
                  <tr><th>Created Date:</th><td>{new Date(poDetails.header.created_at).toLocaleDateString()}</td></tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {poDetails.header.remark && (
            <Row className="mb-3">
              <Col>
                <h6>Remarks</h6>
                <p className="bg-light p-2 rounded">{poDetails.header.remark}</p>
              </Col>
            </Row>
          )}

          <Row>
            <Col>
              <h6>Items</h6>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SKU</th>
                      <th>Style</th>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Fit</th>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>Available Stock </th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(poDetails.items || []).map((item, index) => (
                      <tr key={item.item_id || index}>
                        <td>{index + 1}</td>
                        <td>{item.sku}</td>
                        <td>{item.style_name || 'N/A'}</td>
                        <td>{item.color_name || 'N/A'}</td>
                        <td>{item.size_name || 'N/A'}</td>
                        <td>{item.fit_name || 'N/A'}</td>
                        <td>{item.material_name || 'N/A'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.available_stock_qty !== undefined && item.available_stock_qty !== null ? item.available_stock_qty : '-'}</td>
                        <td>${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                        <td>${parseFloat(item.total_price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-info">
                      <th colSpan="10" className="text-end">Total:</th>
                      <th>${parseFloat(poDetails.total_amount || 0).toFixed(2)}</th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
