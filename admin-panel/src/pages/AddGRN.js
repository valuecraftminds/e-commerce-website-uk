import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Alert, Badge,
    Button, Card, Col, Container, Form,
    Modal,
    Row,
    Table
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import '../styles/WarehouseGRN.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function AddGRN() {
    // Process multiple selected PO items (bulk action)
    const processSelectedPOItems = async () => {
        if (!poDetails || !checkedPOItems.length) {
            setError('No items selected');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Collect selected items' data
            const selectedItems = poDetails.items.filter(item => checkedPOItems.includes(item.sku));
            // Example: send all selected items to backend in one request
            const response = await fetch(`${BASE_URL}/api/admin/grn/process-multiple-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    po_number: selectedPO,
                    items: selectedItems,
                    company_code: company_code
                })
            });
            const data = await response.json();
            if (data.success) {
                setSuccess('Selected items processed successfully!');
                // Optionally refresh PO details or update UI
                await handleSelectPO(selectedPO);
            } else {
                setError(data.message || 'Failed to process selected items');
            }
        } catch (err) {
            setError('Error processing selected items');
        } finally {
            setLoading(false);
        }
    };
    // Checkbox state for PO items
    const [checkedPOItems, setCheckedPOItems] = useState([]);
    // Checkbox state for GRN items
    const [checkedGRNItems, setCheckedGRNItems] = useState([]);

    // Handler for PO select all
    const handleSelectAllPO = (e) => {
        if (e.target.checked) {
            // Only select items that are enabled (canReceive)
            const enabledSkus = (poDetails?.items || [])
                .filter(item => item.remaining_qty > 0 && poDetails.header.status === 'Approved' && (headerStatus !== 'completed') && !loading)
                .map(item => item.sku);
            setCheckedPOItems(enabledSkus);
        } else {
            setCheckedPOItems([]);
        }
    };
    // Handler for individual PO row
    const handleCheckPO = (sku) => {
        setCheckedPOItems((prev) =>
            prev.includes(sku) ? prev.filter((id) => id !== sku) : [...prev, sku]
        );
    };
    // Handler for GRN select all
    const handleSelectAllGRN = (e) => {
        if (e.target.checked) {
            setCheckedGRNItems(grnItems.map((item, idx) => idx));
        } else {
            setCheckedGRNItems([]);
        }
    };
    // Handler for individual GRN row
    const handleCheckGRN = (idx) => {
        setCheckedGRNItems((prev) =>
            prev.includes(idx) ? prev.filter((id) => id !== idx) : [...prev, idx]
        );
    };
    const navigate = useNavigate();
    const { po_number: poParam } = useParams();
    const { userData } = useContext(AuthContext);
    
    const company_code = userData?.company_code;
    const warehouse_user_id = userData?.id;
    
    // State for PO selection
    const [selectedPO, setSelectedPO] = useState(poParam || null);
    const [poDetails, setPODetails] = useState(null);
    
    // State for GRN creation
    const [grnItems, setGRNItems] = useState([]);
    const [batchNumber, setBatchNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [reference, setReference] = useState('');
    const [grnStatus, setGrnStatus] = useState('');
    
    // State for UI
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // State for GRN header status
    const [headerStatus, setHeaderStatus] = useState('partial');

    // State for GRN header status from backend
    const [grnHeaderStatus, setGrnHeaderStatus] = useState('');
    
    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalForm, setModalForm] = useState({
        received_qty: '',
        location_id: '',
        notes: '',
    });
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    // Add state for locations
    const [locations, setLocations] = useState([]);
    const [locationsLoading, setLocationsLoading] = useState(false);

    // Function to check if all items are completed (within tolerance limits)
    const checkAllItemsCompleted = useCallback(() => {
        if (!poDetails || !poDetails.items) return false;
        
        return poDetails.items.every(item => {
            const receivedQty = item.total_received || 0;
            const orderedQty = item.ordered_qty;
            const toleranceLimit = item.tolerance_limit || 0;
            
            // Calculate min and max acceptable quantities
            const minQty = Math.max(0, orderedQty - (orderedQty * toleranceLimit / 100));
            const maxQty = orderedQty + (orderedQty * toleranceLimit / 100);
            
            // Check if received quantity is within tolerance limits
            return receivedQty >= minQty && receivedQty <= maxQty;
        });
    }, [poDetails]);

    // Update header status when items change
    useEffect(() => {
        if (checkAllItemsCompleted()) {
            setHeaderStatus('completed');
        } else {
            setHeaderStatus('partial');
        }
    }, [poDetails, checkAllItemsCompleted]);

    // Select PO and fetch details (useCallback to avoid re-creation)
    const handleSelectPO = useCallback(async (po_number) => {
        setSelectedPO(po_number);
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Fetch PO details (add company_code)
            const response = await fetch(`${BASE_URL}/api/admin/grn/po-details/${po_number}?company_code=${company_code}`);
            const data = await response.json();
            
            if (data.success) {
                setPODetails(data);

                // Fetch GRN header status for this PO (latest GRN for this PO and company)
                let grnHeaderStatusFetched = '';
                try {
                    const grnHeaderResp = await fetch(`${BASE_URL}/api/admin/grn/grn-history/${po_number}?company_code=${company_code}&limit=1`);
                    const grnHeaderData = await grnHeaderResp.json();
                    if (grnHeaderData.success && Array.isArray(grnHeaderData.grns) && grnHeaderData.grns.length > 0) {
                        grnHeaderStatusFetched = grnHeaderData.grns[0].status || '';
                    }
                } catch {}
                setGrnHeaderStatus(grnHeaderStatusFetched);
                console.log('Fetched GRN header status:', grnHeaderStatusFetched);

                // Fetch remaining quantities for each item
                const itemsWithRemaining = await Promise.all(
                    data.items.map(async (item) => {
                        try {
                            const remainingResponse = await fetch(
                                `${BASE_URL}/api/admin/grn/get-remaining-qty?po_number=${po_number}&sku=${item.sku}&company_code=${company_code}`
                            );
                            const remainingData = await remainingResponse.json();
                            
                            if (remainingData.success) {
                                return {
                                    ...item,
                                    ordered_qty: remainingData.ordered_qty,
                                    max_qty: remainingData.max_qty,
                                    tolerance_limit: remainingData.tolerance_limit,
                                    total_received: remainingData.total_received,
                                    remaining_qty: remainingData.remaining_qty,
                                    unit_price: remainingData.unit_price
                                };
                            }
                            return item;
                        } catch {
                            return item;
                        }
                    })
                );
                
                setPODetails(prev => ({ ...prev, items: itemsWithRemaining }));
            } else {
                setError(data.message || 'Failed to fetch PO details');
            }
        } catch (err) {
            setError('Error fetching PO details');
        } finally {
            setLoading(false);
        }
    }, [company_code]);

    // Load PO details if poParam exists
    useEffect(() => {
        if (poParam) {
            handleSelectPO(poParam);
        }
    }, [poParam, handleSelectPO]);

    // Clear all states
    const clearAllStates = () => {
        setSelectedPO(null);
        setPODetails(null);
        setGRNItems([]);
        setBatchNumber('');
        setInvoiceNumber('');
        setReference('');
        setGrnStatus('');
        setError('');
        setSuccess('');
        navigate('/warehouse/add-grn');
    };

    // (PO search logic removed; now handled in WarehouseGRN)

    // Open modal for item entry
    const handleItemClick = (item) => {
        if (item.remaining_qty <= 0) {
            setError(`SKU ${item.sku} has no remaining quantity to receive`);
            return;
        }
        setSelectedItem(item);
        setModalForm({
            received_qty: item.remaining_qty.toString(),
            location_id: '',
            notes: ''
        });
        setModalError('');
        setShowModal(true);
    };

    // Handle modal form change
    const handleModalFormChange = (field, value) => {
        setModalForm(prev => ({ ...prev, [field]: value }));
        setModalError('');
    };

    // Fetch locations for dropdown
    useEffect(() => {
        if (!company_code) return;
        setLocationsLoading(true);
        fetch(`${BASE_URL}/api/admin/locations/get-locations?company_code=${company_code}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.locations)) {
                    setLocations(data.locations);
                } else {
                    setLocations([]);
                }
            })
            .catch(() => setLocations([]))
            .finally(() => setLocationsLoading(false));
    }, [company_code]);

    // Helper to generate next unique lot number
    const getNextLotNo = () => {
        // Collect all used lot numbers in grnItems
        const usedLots = new Set(
            grnItems
                .map(item => item.lot_no)
                .filter(Boolean)
                .map(lot => {
                    const match = lot.match(/LOT-(\d+)/i);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter(num => num !== null)
        );
        // Find the lowest unused lot number starting from 1
        let next = 1;
        while (usedLots.has(next)) {
            next++;
        }
        return `LOT-${String(next).padStart(3, '0')}`;
    };

    const handleAddGRNItem = async () => {
        setModalError('');
        setModalLoading(true);
        const received_qty = parseInt(modalForm.received_qty);
        const location_id = String(modalForm.location_id || '').trim();
        // Basic validation
        if (!received_qty || received_qty <= 0) {
            setModalError('Please enter a valid received quantity');
            setModalLoading(false);
            return;
        }
        if (!location_id || location_id === '0') {
            setModalError('Please select a location');
            setModalLoading(false);
            return;
        }
        if (received_qty > selectedItem.remaining_qty) {
            setModalError(`Cannot receive ${received_qty} items. Only ${selectedItem.remaining_qty} items remaining`);
            setModalLoading(false);
            return;
        }
        try {
            // Validate with backend
            const validateResponse = await fetch(`${BASE_URL}/api/admin/grn/validate-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    po_number: selectedPO,
                    sku: selectedItem.sku,
                    received_qty: received_qty,
                    company_code: company_code
                })
            });
            const validateData = await validateResponse.json();
            if (!validateData.success) {
                setModalError(validateData.message);
                setModalLoading(false);
                return;
            }
            // Always generate new lot number for each item
            const lot_no = getNextLotNo();
            // Add new item
            const newGRNItem = {
                style_number: selectedItem.style_number,
                sku: selectedItem.sku,
                ordered_qty: selectedItem.ordered_qty,
                max_qty: selectedItem.max_qty,
                received_qty: received_qty,
                location_id: location_id,
                lot_no: lot_no,
                notes: modalForm.notes || '',
                tolerance_limit: selectedItem.tolerance_limit,
            };
            setGRNItems(prev => [...prev, newGRNItem]);
            // Update remaining quantity in PO details
            const updatedPODetails = { ...poDetails };
            const itemIndex = updatedPODetails.items.findIndex(item => item.sku === selectedItem.sku);
            if (itemIndex !== -1) {
                updatedPODetails.items[itemIndex].remaining_qty -= received_qty;
                updatedPODetails.items[itemIndex].total_received = 
                    (updatedPODetails.items[itemIndex].total_received || 0) + received_qty;
            }
            setPODetails(updatedPODetails);
            setShowModal(false);
            setSuccess(`Added ${received_qty} units of SKU ${selectedItem.sku} to GRN`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setModalError('Error validating GRN item');
        } finally {
            setModalLoading(false);
        }
    };

    // Edit GRN item
    const handleEditGRNItem = (index) => {
        const item = grnItems[index];
        const poItem = poDetails.items.find(pi => pi.sku === item.sku);
        setSelectedItem({
            ...poItem,
            remaining_qty: poItem.remaining_qty + item.received_qty
        });
        setModalForm({
            received_qty: item.received_qty.toString(),
            location_id: item.location_id,
            notes: item.notes,
        });
        // Remove the item from grnItems temporarily
        setGRNItems(prev => prev.filter((_, i) => i !== index));
        // Restore remaining quantity in PO details
        const updatedPODetails = { ...poDetails };
        const itemIndex = updatedPODetails.items.findIndex(pi => pi.sku === item.sku);
        if (itemIndex !== -1) {
            updatedPODetails.items[itemIndex].remaining_qty += item.received_qty;
            updatedPODetails.items[itemIndex].total_received = 
                Math.max(0, (updatedPODetails.items[itemIndex].total_received || 0) - item.received_qty);
        }
        setPODetails(updatedPODetails);
        setModalError('');
        setShowModal(true);
    };

    // Delete GRN item
    const handleDeleteGRNItem = (index) => {
        const item = grnItems[index];
        // Restore remaining quantity in PO details
        const updatedPODetails = { ...poDetails };
        const itemIndex = updatedPODetails.items.findIndex(pi => pi.sku === item.sku);
        if (itemIndex !== -1) {
            updatedPODetails.items[itemIndex].remaining_qty += item.received_qty;
            updatedPODetails.items[itemIndex].total_received = 
                Math.max(0, (updatedPODetails.items[itemIndex].total_received || 0) - item.received_qty);
        }
        setPODetails(updatedPODetails);
        // Remove item from grnItems
        setGRNItems(prev => prev.filter((_, i) => i !== index));
        setSuccess(`Removed SKU ${item.sku} from GRN`);
        setTimeout(() => setSuccess(''), 3000);
    };

    // Submit GRN
    const handleSubmitGRN = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        // Validation
        if (grnItems.length === 0) {
            setError('Please add at least one item to the GRN');
            setLoading(false);
            return;
        }
        if (!batchNumber.trim()) {
            setError('Please enter a batch number');
            setLoading(false);
            return;
        }
        try {
            // Ensure lot_no and status are included in payload for each item
            const payload = {
                po_number: selectedPO,
                grn_items: grnItems.map(item => ({ ...item, lot_no: item.lot_no || '', status: item.status })),
                warehouse_user_id: warehouse_user_id,
                company_code: company_code,
                received_date: new Date().toISOString(),
                batch_number: batchNumber,
                invoice_number: invoiceNumber,
                reference: reference,
                supplier_id: poDetails?.header?.supplier_id,
                status: headerStatus
            };

            console.log('Submitting GRN with payload:', payload);
            const response = await fetch(`${BASE_URL}/api/admin/grn/create-grn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
                setSuccess(`GRN created successfully! GRN ID: ${data.grn_id}`);
                setGrnStatus(data.status || '');
                // Reset form
                setGRNItems([]);
                setBatchNumber('');
                setInvoiceNumber('');
                setReference('');
                // Refresh PO details to show updated remaining quantities
                await handleSelectPO(selectedPO);
                setTimeout(() => {
                    setSuccess('');
                    setGrnStatus('');
                }, 5000);
            } else {
                setError(data.message || 'Failed to create GRN');
            }
        } catch (err) {
            setError('Error creating GRN');
        } finally {
            setLoading(false);
        }
    };

    // Calculate GRN totals
    const calculateTotals = () => {
        return grnItems.reduce((acc, item) => {
            acc.totalItems += 1;
            acc.totalQty += item.received_qty;
            return acc;
        }, { totalItems: 0, totalQty: 0 });
    };

    const totals = calculateTotals();

    // Helper to generate batch number
    const generateBatchNumber = (invoice, po) => {
        if (!invoice || !po) return '';
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const poLast2 = String(po).slice(-2).padStart(2, '0');
        const invLast2 = String(invoice).slice(-2).padStart(2, '0');
        return `${dd}${mm}${yy}${poLast2}${invLast2}`;
    };

    // Auto-generate batch number when invoice number changes
    useEffect(() => {
        if (invoiceNumber && selectedPO) {
            setBatchNumber(generateBatchNumber(invoiceNumber, selectedPO));
        } else {
            setBatchNumber('');
        }
    }, [invoiceNumber, selectedPO]);

    return (
        <Container fluid className="warehouse-grn-container">
            {/* Alerts */}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Back Button */}
            <Row className="mb-3">
                <Col>
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate('/warehouse/grn')}
                        disabled={loading}
                    >
                        Back to GRN History
                    </Button>
                </Col>
            </Row>

            {/* Main Content */}
            <Row>
                {/* PO search UI removed; now handled in WarehouseGRN */}
                <Col>
                    {/* PO Details and GRN Processing */}
                    {poDetails && (
                        <>
                            <Card className="mb-4">
                                <Card.Header>
                                    <Row>
                                        <Col>
                                            <h5>PO Details: {poDetails.header.po_number}</h5>
                                            <div>Supplier: {poDetails.header.supplier_name}</div>
                                            <div>Status: {poDetails.header.status}</div>
                                            <div>Tolerance Limit: {poDetails.header.tolerance_limit || 0}%</div>
                                        </Col>
                                        <Col xs="auto">
                                            {checkAllItemsCompleted() && (
                                                <Badge bg="success" className="fs-6">
                                                    All Items Completed
                                                </Badge>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body>
                                    {/* Show note if PO is not approved */}
                                    {poDetails.header.status !== 'Approved' && (
                                        <Alert variant="warning" className="mb-3">
                                            <strong>Note:</strong> This PO is <b>not approved</b>. You cannot add GRN for a pending PO.
                                        </Alert>
                                    )}
                                    {/* Batch and Invoice Info */}
                                    <Form className="mb-3">
                                        <Row className="g-3">
                                         <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Invoice Number</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={invoiceNumber}
                                                        onChange={e => setInvoiceNumber(e.target.value)}
                                                        placeholder="Enter invoice number"
                                                        disabled={poDetails.header.status !== 'Approved' || loading}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Batch Number *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={batchNumber}
                                                        onChange={e => setBatchNumber(e.target.value)}
                                                        placeholder="Batch number"
                                                        required
                                                        readOnly
                                                        disabled={loading}
                                                    />
                                                </Form.Group>
                                            </Col>
                                           
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Reference</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={reference}
                                                        onChange={e => setReference(e.target.value)}
                                                        placeholder="Optional reference"
                                                        disabled={poDetails.header.status !== 'Approved' || loading}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Form>

                                    {/* PO Items Table */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner />
                                            <p className="mt-3 text-muted">Loading PO details...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <h6>Click on items to add to GRN:</h6>
                                            <Table striped bordered hover responsive className="mb-4">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            <input
                                                                type="checkbox"
                                                                checked={(() => {
                                                                    const enabledSkus = (poDetails?.items || [])
                                                                        .filter(item => item.remaining_qty > 0 && poDetails.header.status === 'Approved' && (headerStatus !== 'completed') && !loading)
                                                                        .map(item => item.sku);
                                                                    return enabledSkus.length > 0 && checkedPOItems.length === enabledSkus.length;
                                                                })()}
                                                                indeterminate={(() => {
                                                                    const enabledSkus = (poDetails?.items || [])
                                                                        .filter(item => item.remaining_qty > 0 && poDetails.header.status === 'Approved' && (headerStatus !== 'completed') && !loading)
                                                                        .map(item => item.sku);
                                                                    return checkedPOItems.length > 0 && checkedPOItems.length < enabledSkus.length;
                                                                })()}
                                                                onChange={handleSelectAllPO}
                                                            />
                                                        </th>
                                                        <th>Style Code</th>
                                                        <th>SKU</th>
                                                        <th>Unit Price</th>
                                                        <th>Ordered Qty</th>
                                                        <th>Max Qty (with tolerance)</th>
                                                        <th>Total Received</th>
                                                        <th>Remaining Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                            {poDetails.items.map((item, idx) => {
                                                // Calculate tolerance range
                                                const orderedQty = item.ordered_qty;
                                                const toleranceLimit = item.tolerance_limit || 0;
                                                const minQty = Math.max(0, orderedQty - (orderedQty * toleranceLimit / 100));
                                                const maxQty = orderedQty + (orderedQty * toleranceLimit / 100);
                                                const receivedQty = item.total_received || 0;
                                                                                                
                                                // Use headerStatus instead of grnHeaderStatus for clickable logic
                                                const canReceive = item.remaining_qty > 0 && poDetails.header.status === 'Approved' && (headerStatus !== 'completed') && !loading;
                                                return (
                                                    <tr 
                                                        key={item.sku}
                                                        className={canReceive ? 'table-row-clickable' : 'table-row-disabled'}
                                                        onClick={() => canReceive && handleItemClick(item)}
                                                        style={{ cursor: canReceive ? 'pointer' : 'not-allowed' }}
                                                    >
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={checkedPOItems.includes(item.sku)}
                                                                onChange={() => handleCheckPO(item.sku)}
                                                                disabled={!canReceive}
                                                            />
                                                        </td>
                                                        <td>{item.style_number}</td>
                                                        <td>{item.sku}</td>
                                                        <td>{item.unit_price}</td>
                                                        <td>{item.ordered_qty}</td>
                                                        <td>
                                                            {item.max_qty}
                                                            {item.tolerance_limit > 0 && (
                                                                <small className="text-muted"> (+{item.tolerance_limit}%)</small>
                                                            )}
                                                        </td>
                                                        <td>{receivedQty}</td>
                                                        <td>
                                                            <Badge bg={canReceive ? 'success' : 'secondary'}>
                                                                {item.remaining_qty}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                    <div className="d-flex justify-content-start mb-3">
                                        <Button
                                            variant="primary"
                                            onClick={processSelectedPOItems}
                                            disabled={checkedPOItems.length === 0 || loading}
                                        >
                                            Add Selected Items to GRN
                                        </Button>
                                    </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Added GRN Items */}
                            {grnItems.length > 0 && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6>Items Added to GRN ({grnItems.length} items, {totals.totalQty} total quantity)</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>
                                                        <input
                                                            type="checkbox"
                                                            checked={grnItems.length > 0 && checkedGRNItems.length === grnItems.length}
                                                            indeterminate={checkedGRNItems.length > 0 && checkedGRNItems.length < grnItems.length}
                                                            onChange={handleSelectAllGRN}
                                                        />
                                                    </th>
                                                    <th>Style Code</th>
                                                    <th>SKU</th>
                                                    <th>Ordered Qty</th>
                                                    <th>Received Qty</th>
                                                    <th>Location</th>
                                                    <th>Lot No</th>
                                                    <th>Notes</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grnItems.map((item, index) => (
                                                    <tr key={`${item.sku}-${item.lot_no || ''}-${index}`}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={checkedGRNItems.includes(index)}
                                                                onChange={() => handleCheckGRN(index)}
                                                            />
                                                        </td>
                                                        <td>{item.style_number}</td>
                                                        <td>{item.sku}</td>
                                                        <td>{item.ordered_qty}</td>
                                                        <td><Badge bg="primary">{item.received_qty}</Badge></td>
                                                        <td>{locations.find(l => String(l.location_id) === String(item.location_id))?.location_name || '-'}</td>
                                                        <td>{item.lot_no || '-'}</td>
                                                        <td>{item.notes}</td>
                                                        <td>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                className="me-2"
                                                                onClick={() => handleEditGRNItem(index)}
                                                                disabled={poDetails.header.status !== 'Approved' || loading}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                onClick={() => handleDeleteGRNItem(index)}
                                                                disabled={poDetails.header.status !== 'Approved' || loading}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>

                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                {grnStatus && (
                                                    <Badge bg="info" className="fs-6">
                                                        Current Status: {grnStatus}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <Form.Group className="me-3 mb-0">
                                                    <Form.Label visuallyHidden>Status</Form.Label>
                                                    <Form.Select
                                                        value={headerStatus}
                                                        onChange={e => setHeaderStatus(e.target.value)}
                                                        style={{ minWidth: 140 }}
                                                        disabled={checkAllItemsCompleted() || loading}
                                                    >
                                                        <option value="partial">Partial</option>
                                                        <option value="completed">Completed</option>
                                                    </Form.Select>
                                                    {checkAllItemsCompleted() && (
                                                        <Form.Text className="text-muted">
                                                            Auto-set to completed as all items are within tolerance
                                                        </Form.Text>
                                                    )}
                                                </Form.Group>
                                                <Button
                                                    variant="primary"
                                                    onClick={handleSubmitGRN}
                                                    disabled={loading || grnItems.length === 0 || !batchNumber.trim() || poDetails.header.status !== 'Approved'}
                                                >
                                                    {loading ? 'Submitting GRN...' : `Submit GRN (${grnItems.length} items)`}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </Col>
            </Row>

            {/* GRN Item Entry Modal */}
            <Modal show={showModal} onHide={() => !modalLoading && setShowModal(false)} size="lg">
                <Modal.Header closeButton={!modalLoading}>
                    <Modal.Title>
                        Add Item to GRN - {selectedItem?.sku}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedItem && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p><strong>Style Code:</strong> {selectedItem.style_number}</p>
                                    <p><strong>SKU:</strong> {selectedItem.sku}</p>
                                    <p><strong>Ordered Quantity:</strong> {selectedItem.ordered_qty}</p>
                                    <p><strong>Unit Price:</strong> {selectedItem.unit_price}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Max Allowed:</strong> {selectedItem.max_qty} 
                                        {selectedItem.tolerance_limit > 0 && (
                                            <small className="text-muted"> (with {selectedItem.tolerance_limit}% tolerance)</small>
                                        )}
                                    </p>
                                    <p><strong>Already Received:</strong> {selectedItem.total_received || 0}</p>
                                    <p><strong>Remaining:</strong> <Badge bg="success">{selectedItem.remaining_qty}</Badge></p>
                                </Col>
                            </Row>

                            {modalError && (
                                <Alert variant="danger">{modalError}</Alert>
                            )}

                            <Form>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Received Quantity *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                max={selectedItem.remaining_qty}
                                                value={modalForm.received_qty}
                                                onChange={e => handleModalFormChange('received_qty', e.target.value)}
                                                placeholder={`Max: ${selectedItem.remaining_qty}`}
                                                required
                                                disabled={modalLoading}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Location</Form.Label>
                                            <Form.Select
                                                value={modalForm.location_id}
                                                onChange={e => handleModalFormChange('location_id', e.target.value)}
                                                required
                                                disabled={locationsLoading || modalLoading}
                                            >
                                                <option value="">Select location</option>
                                                {locations.map(loc => (
                                                    <option key={loc.location_id} value={loc.location_id}>
                                                        {loc.location_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {/* Lot No field removed, now auto-generated */}
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Lot No</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={(() => {
                                                    // Show next unique lot number preview
                                                    if (!selectedItem) return '';
                                                    const usedLots = new Set(
                                                        grnItems
                                                            .map(item => item.lot_no)
                                                            .filter(Boolean)
                                                            .map(lot => {
                                                                const match = lot.match(/LOT-(\d+)/i);
                                                                return match ? parseInt(match[1], 10) : null;
                                                            })
                                                            .filter(num => num !== null)
                                                    );
                                                    let next = 1;
                                                    while (usedLots.has(next)) {
                                                        next++;
                                                    }
                                                    return `LOT-${String(next).padStart(3, '0')}`;
                                                })()}
                                                readOnly
                                                disabled
                                            />
                                            <Form.Text muted>
                                                Lot number will be generated automatically.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={modalForm.notes}
                                        onChange={e => handleModalFormChange('notes', e.target.value)}
                                        placeholder="Additional notes (optional)"
                                        disabled={modalLoading}
                                    />
                                </Form.Group>
                            </Form>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowModal(false)}
                        disabled={modalLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddGRNItem}
                        disabled={modalLoading || !modalForm.received_qty}
                    >
                        {modalLoading ? 'Adding...' : 'Add to GRN'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}