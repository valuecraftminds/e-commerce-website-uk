import { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Spinner, Table } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/WarehouseGRN.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function GRNDetails() {
    const { grn_id } = useParams();
    const navigate = useNavigate();
    const { userData } = useContext(AuthContext);
    
    const [grnDetails, setGRNDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGRNDetails = async () => {
            try {
                const response = await fetch(
                    `${BASE_URL}/api/admin/grn/details/${grn_id}?company_code=${userData.company_code}`
                );
                const data = await response.json();
                
                if (data.success) {
                    setGRNDetails(data);
                } else {
                    setError(data.message || 'Failed to fetch GRN details');
                }
            } catch (err) {
                setError('Error fetching GRN details');
            } finally {
                setLoading(false);
            }
        };
        
        fetchGRNDetails();
    }, [grn_id, userData.company_code]);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" />
                <p>Loading GRN details...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </Container>
        );
    }

    if (!grnDetails) {
        return (
            <Container className="py-5">
                <Alert variant="warning">GRN not found</Alert>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </Container>
        );
    }

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>GRN Details: {grnDetails.header.grn_id}</h2>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Back to GRN List
                </Button>
            </div>

            <Card className="mb-4">
                <Card.Header>
                    <h5>GRN Information</h5>
                </Card.Header>
                <Card.Body>
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>PO Number:</strong> {grnDetails.header.po_number}</p>
                            <p><strong>Supplier:</strong> {grnDetails.header.supplier_name || grnDetails.header.supplier_id}</p>
                            <p><strong>Received Date:</strong> {new Date(grnDetails.header.received_date).toLocaleString()}</p>
                        </div>
                        <div className="col-md-6">
                            <p><strong>Status:</strong> <Badge bg={grnDetails.header.status === 'completed' ? 'success' : 'warning'}>
                                {grnDetails.header.status}
                            </Badge></p>
                            <p><strong>Batch Number:</strong> {grnDetails.header.batch_number || 'N/A'}</p>
                            <p><strong>Invoice Number:</strong> {grnDetails.header.invoice_number || 'N/A'}</p>
                        </div>
                    </div>
                    {grnDetails.header.reference && (
                        <p><strong>Reference:</strong> {grnDetails.header.reference}</p>
                    )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h5>Received Items ({grnDetails.items.length})</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Style Code</th>
                                <th>SKU</th>
                                <th>Ordered Qty</th>
                                <th>Received Qty</th>
                                <th>Location</th>
                                <th>Notes</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grnDetails.items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.style_code}</td>
                                    <td>{item.sku}</td>
                                    <td>{item.ordered_qty}</td>
                                    <td>{item.received_qty}</td>
                                    <td>{item.location || 'N/A'}</td>
                                    <td>{item.notes || 'N/A'}</td>
                                    <td>
                                        <Badge bg={
                                            item.status === 'received' ? 'success' : 
                                            item.status === 'partial' ? 'warning' : 'secondary'
                                        }>
                                            {item.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
}