
import { useContext, useEffect, useState } from 'react';
import { Button, Modal, Table, Form, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaArrowCircleRight } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import '../styles/WarehouseIssuing.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


export default function WarehouseIssuing() {
  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;

  const [bookings, setBookings] = useState([]);
  const [issuedBookings, setIssuedBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mainStock, setMainStock] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [issueData, setIssueData] = useState({ batch_number: '', lot_no: '', unit_price: '', issuing_qty: '' });
  const [issueError, setIssueError] = useState('');
  const [issueSuccess, setIssueSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch bookings
  useEffect(() => {
    if (!company_code) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/admin/issuing/bookings?company_code=${company_code}`)
      .then(res => res.json())
      .then(data => {
        // If booking has a status, split by status. Otherwise, treat all as pending.
        const pending = [];
        const issued = [];
        data.forEach(b => {
          if (b.status === 'Issued') {
            issued.push(b);
          } else {
            pending.push(b);
          }
        });
        setBookings(pending);
        setIssuedBookings(issued);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load bookings');
        setLoading(false);
      });
  }, [company_code]);

  // Open modal and fetch main stock
  const handleIssueClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
    setMainStock([]);
    setIssueData({ batch_number: '', lot_no: '', unit_price: '', issuing_qty: '' });
    setIssueError('');
    setIssueSuccess('');
    setStockLoading(true);
    if (!booking.style_number) {
      setStockLoading(false);
      setIssueError('No style number found for this booking. Cannot fetch main stock.');
      return;
    }
    fetch(`${BASE_URL}/api/admin/issuing/main-stock?company_code=${booking.company_code}&style_number=${booking.style_number}&sku=${booking.sku}`)
      .then(res => res.json())
      .then(data => {
        setMainStock(Array.isArray(data) ? data : []);
        setStockLoading(false);
        if (!Array.isArray(data) || data.length === 0) {
          setIssueError(`No main stock available for SKU: ${booking.sku} and Style: ${booking.style_number}`);
        }
      })
      .catch(() => {
        setMainStock([]);
        setStockLoading(false);
        setIssueError(`Failed to load main stock for SKU: ${booking.sku} and Style: ${booking.style_number}`);
      });
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setMainStock([]);
    setIssueData({ batch_number: '', lot_no: '', unit_price: '', issuing_qty: '' });
    setIssueError('');
    setIssueSuccess('');
  };

  // Handle select change
  const handleStockSelect = (e) => {
    const idx = e.target.value;
    if (idx === '') return;
    const stock = mainStock[idx];
    setIssueData({
      ...issueData,
      batch_number: stock.batch_number,
      lot_no: stock.lot_no,
      unit_price: stock.unit_price,
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    setIssueData({ ...issueData, [e.target.name]: e.target.value });
  };

  // Handle issue submit
  const handleIssueSubmit = (e) => {
    e.preventDefault();
    setIssueError('');
    setIssueSuccess('');
    if (!issueData.batch_number || !issueData.lot_no || !issueData.unit_price) {
      setIssueError('Please select stock.');
      return;
    }
    fetch(`${BASE_URL}/api/admin/issuing/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_code: selectedBooking.company_code,
        style_number: selectedBooking.style_number,
        sku: selectedBooking.sku,
        batch_number: issueData.batch_number,
        lot_no: issueData.lot_no,
        unit_price: issueData.unit_price,
  issuing_qty: selectedBooking.ordered_qty,
        booking_id: selectedBooking.booking_id,
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIssueSuccess('Issued successfully!');
          // Move booking to issuedBookings
          setBookings(prev => prev.filter(b => b.booking_id !== selectedBooking.booking_id));
          setIssuedBookings(prev => [
            { ...selectedBooking, status: 'Issued' },
            ...prev
          ]);
          setTimeout(() => handleCloseModal(), 1000);
        } else {
          setIssueError(data.error || 'Failed to issue.');
        }
      })
      .catch(() => setIssueError('Failed to issue.'));
  };

  return (
    <div className="warehouse-issuing-page">
      <h2>Warehouse Issuing</h2>
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="pending" title={`Pending (${bookings.length})`}>
          {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Style Number</th>
                  <th>Ordered Qty</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">No pending bookings found.</td></tr>
                ) : bookings.map((b, idx) => (
                  <tr key={b.booking_id}>
                    <td>{idx + 1}</td>
                    <td>{b.sku}</td>
                    <td>{b.style_number || ''}</td>
                    <td>{b.ordered_qty}</td>
                    <td>{b.created_at}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => handleIssueClick(b)} title="Issue">
                        <FaArrowCircleRight />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
        <Tab eventKey="issued" title={`Issued (${issuedBookings.length})`}>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Style Number</th>
                <th>Ordered Qty</th>
                <th>Created At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {issuedBookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center">No issued bookings found.</td></tr>
              ) : issuedBookings.map((b, idx) => (
                <tr key={b.booking_id}>
                  <td>{idx + 1}</td>
                  <td>{b.sku}</td>
                  <td>{b.style_number || ''}</td>
                  <td>{b.ordered_qty}</td>
                  <td>{b.created_at}</td>
                  <td>Issued</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>

      {/* Issue Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Issue Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stockLoading ? <Spinner animation="border" /> : (
            <>
              {issueError && <Alert variant="danger">{issueError}</Alert>}
              <Form onSubmit={handleIssueSubmit}>
                {/* Batch selection */}
                <Form.Group className="mb-3">
                  <Form.Label>Select Batch Number</Form.Label>
                  <Form.Select
                    value={issueData.batch_number}
                    onChange={e => {
                      setIssueData({ batch_number: e.target.value, lot_no: '', unit_price: '', issuing_qty: '' });
                    }}
                    disabled={mainStock.length === 0}
                    required
                  >
                    <option value="">Select batch number</option>
                    {[...new Set(mainStock.map(s => s.batch_number))].map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {/* Lot selection */}
                <Form.Group className="mb-3">
                  <Form.Label>Select Lot Number</Form.Label>
                  <Form.Select
                    value={issueData.lot_no}
                    onChange={e => {
                      setIssueData(prev => ({ ...prev, lot_no: e.target.value, unit_price: '', issuing_qty: '' }));
                    }}
                    disabled={!issueData.batch_number}
                    required
                  >
                    <option value="">Select lot number</option>
                    {[...new Set(mainStock.filter(s => s.batch_number === issueData.batch_number).map(s => s.lot_no))].map(lot => (
                      <option key={lot} value={lot}>{lot}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {/* Unit price selection */}
                <Form.Group className="mb-3">
                  <Form.Label>Select Unit Price</Form.Label>
                  <Form.Select
                    value={issueData.unit_price}
                    onChange={e => {
                      setIssueData(prev => ({ ...prev, unit_price: e.target.value, issuing_qty: '' }));
                    }}
                    disabled={!issueData.batch_number || !issueData.lot_no}
                    required
                  >
                    <option value="">Select unit price</option>
                    {[...new Set(mainStock.filter(s => s.batch_number === issueData.batch_number && s.lot_no === issueData.lot_no).map(s => s.unit_price))].map(price => (
                      <option key={price} value={price}>{price}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {/* Issuing Quantity is not needed, will use Ordered Qty automatically */}
                {issueSuccess && <Alert variant="success">{issueSuccess}</Alert>}
                <Button variant="primary" type="submit" disabled={mainStock.length === 0}>Issue</Button>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
