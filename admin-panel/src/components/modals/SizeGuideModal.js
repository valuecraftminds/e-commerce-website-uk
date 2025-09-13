import React, { useState, useEffect, useCallback } from 'react';
import { Form } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';

import '../../styles/SizeGuideModal.css';

const SizeGuideModal = ({ isOpen, onClose, title = "Add Size Guide", assignedRangeSizes = {}, styleNumber, companyCode, onSuccess }) => {
    const [existingStyleNumbers, setExistingStyleNumbers] = useState([]);
    const [selectedStyleNumber, setSelectedStyleNumber] = useState(styleNumber || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sizeData, setSizeData] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [initialContent, setInitialContent] = useState('');
    const DEFAULT_MEASUREMENTS = ['Bust', 'Chest', 'Waist', 'Hips', 'Height', 'Collar Size'];
    const LOCAL_STORAGE_KEY = 'sizeGuideMeasurements';
    const [measurements, setMeasurements] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_MEASUREMENTS;
    });
    const [newMeasurementName, setNewMeasurementName] = useState('');
    
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

    // Fetch all existing size guide style numbers for the company
    useEffect(() => {
        if (!isOpen || !companyCode) return;
        const fetchExistingStyleNumbers = async () => {
            try {
                const res = await fetch(`http://localhost:8081/api/admin/size-guide/get-all?company_code=${companyCode}&current_style_number=${styleNumber}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.size_guides)) {
                    setExistingStyleNumbers(data.size_guides.map(g => ({ style_number: g.style_number, style_name: g.style_name })));
                } else if (Array.isArray(data)) {
                    // fallback if API returns array directly
                    setExistingStyleNumbers(data.map(g => ({ style_number: g.style_number, style_name: g.style_name })));
                } else {
                    setExistingStyleNumbers([]);
                }
            } catch (e) {
                setExistingStyleNumbers([]);
            }
        };
        fetchExistingStyleNumbers();
    }, [isOpen, companyCode, styleNumber]);

    // When user selects a style number from dropdown, update selectedStyleNumber and fetch its guide
    useEffect(() => {
        if (selectedStyleNumber && selectedStyleNumber !== styleNumber) {
            // Fetch and fill table with selected style's size guide
            const fetchAndFill = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`${BASE_URL}/api/admin/size-guide/${selectedStyleNumber}?company_code=${companyCode}`);
                    const data = await response.json();
                    if (data.success && data.size_guide_content) {
                        setInitialContent(data.size_guide_content);
                        // Parse and fill table
                        const parsed = parseExistingSizeGuide(data.size_guide_content);
                        // Fill sizeData with parsed data for current measurements and sizeTypes
                        const currentSizeTypes = getSizeTypes();
                        const initialData = {};
                        measurements.forEach(measurement => {
                            initialData[measurement] = {};
                            currentSizeTypes.forEach(size => {
                                initialData[measurement][size] = parsed[measurement]?.[size] || '';
                            });
                        });
                        setSizeData(initialData);
                    } else {
                        setInitialContent('');
                        setSizeData({});
                    }
                } catch (err) {
                    setInitialContent('');
                    setSizeData({});
                } finally {
                    setLoading(false);
                }
            };
            fetchAndFill();
        }
    }, [selectedStyleNumber]);

    // Get size types from assigned ranges - flatten all sizes from all ranges
    const getSizeTypes = () => {
        const allSizes = [];
        Object.values(assignedRangeSizes).forEach(rangeSizes => {
            rangeSizes.forEach(sizeObj => {
                if (sizeObj.size_name && !allSizes.includes(sizeObj.size_name)) {
                    allSizes.push(sizeObj.size_name);
                }
            });
        });
        // If no sizes found, use default sizes
        return allSizes.length > 0 ? allSizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    };

    const sizeTypes = getSizeTypes();

    // Size guide measurements for the first column
        // measurements is now a state variable

    // Fetch existing size guide content
    const fetchSizeGuide = useCallback(async () => {
        if (!styleNumber || !companyCode) return;
        
        try {
            const response = await fetch(`${BASE_URL}/api/admin/size-guide/${styleNumber}?company_code=${companyCode}`);
            const data = await response.json();
            if (data.success && data.size_guide_content) {
                setInitialContent(data.size_guide_content);
            } else {
                setInitialContent(''); // Clear if no content found
            }
        } catch (err) {
            console.log('No existing size guide found');
            setInitialContent(''); // Clear on error
        }
    }, [styleNumber, companyCode, BASE_URL]);

    // Function to parse existing size guide HTML content
    const parseExistingSizeGuide = (htmlContent) => {
        if (!htmlContent) return {};
        
        try {
            // Create a temporary DOM element to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            // Find the table
            const table = tempDiv.querySelector('table');
            if (!table) return {};
            
            const parsedData = {};
            const rows = table.querySelectorAll('tbody tr');
            
            if (rows.length === 0) return {};
            
            // Get size types from header row
            const headerRow = table.querySelector('thead tr');
            const sizeHeaders = [];
            if (headerRow) {
                const headerCells = headerRow.querySelectorAll('th');
                for (let i = 1; i < headerCells.length; i++) { // Skip first column (measurement names)
                    sizeHeaders.push(headerCells[i].textContent.trim());
                }
            }
            
            // Parse data rows
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    const measurementName = cells[0].textContent.trim();
                    if (measurements.includes(measurementName)) {
                        parsedData[measurementName] = {};
                        
                        // Parse size values
                        for (let i = 1; i < cells.length && i <= sizeHeaders.length; i++) {
                            const sizeType = sizeHeaders[i - 1];
                            const value = cells[i].textContent.trim();
                            if (sizeType) {
                                parsedData[measurementName][sizeType] = value;
                            }
                        }
                    }
                }
            });
            
            return parsedData;
        } catch (error) {
            console.error('Error parsing existing size guide:', error);
            return {};
        }
    };

    // Reset content when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError('');
            // Load measurements from localStorage if available
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                setMeasurements(JSON.parse(saved));
            } else {
                setMeasurements(DEFAULT_MEASUREMENTS);
            }
            // Fetch existing size guide data when modal opens
            fetchSizeGuide();
        }
        // Data will be refreshed when modal opens again
    }, [isOpen, fetchSizeGuide]);

    // Separate useEffect to handle data initialization after content is fetched
    useEffect(() => {
        if (isOpen) {
            const currentSizeTypes = getSizeTypes();
            
            // Only initialize if we don't have data or if we have new content to parse
            const hasValidData = Object.keys(sizeData).length > 0 && 
                measurements.every(measurement => sizeData[measurement]) &&
                currentSizeTypes.every(size => measurements.every(measurement => 
                    sizeData[measurement] && sizeData[measurement].hasOwnProperty(size)
                ));
            
            if (!hasValidData || initialContent) {
                // Parse existing content if available
                const existingData = parseExistingSizeGuide(initialContent);
                
                const initialData = {};
                measurements.forEach(measurement => {
                    initialData[measurement] = {};
                    currentSizeTypes.forEach(size => {
                        // Priority: existing parsed data > current data > empty string
                        initialData[measurement][size] = 
                            existingData[measurement]?.[size] || 
                            (hasValidData ? sizeData[measurement]?.[size] : '') || 
                            '';
                    });
                });
                setSizeData(initialData);
            }
        }
    }, [isOpen, initialContent, assignedRangeSizes]); // Removed sizeData dependency to avoid infinite loop

    const handleCellChange = (measurements, sizeType, value) => {
        setSizeData(prev => ({
            ...prev,
            [measurements]: {
                ...prev[measurements],
                [sizeType]: value
            }
        }));
    };

    const handleSave = async () => {
        // Convert table data to content for saving
        const tableContent = generateTableHTML();
        
        if (!tableContent.trim()) {
            setError('Please add some content to the size guide');
            return;
        }

        if (!styleNumber || !companyCode) {
            setError('Missing required information for saving');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_URL}/api/admin/size-guide/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    style_number: styleNumber,
                    company_code: companyCode,
                    size_guide_content: tableContent
                })
            });

            const data = await response.json();
            if (data.success) {
                setInitialContent(tableContent);
                if (onSuccess) {
                    onSuccess('Size guide saved successfully!');
                }
                onClose();
            } else {
                throw new Error(data.message || 'Failed to save size guide');
            }
        } catch (err) {
            setError(err.message || 'Failed to save size guide');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!styleNumber || !companyCode) {
            setError('Missing required information for deletion');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_URL}/api/admin/size-guide/${styleNumber}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_code: companyCode
                })
            });

            const data = await response.json();
            if (data.success) {
                setSizeData({});
                setInitialContent('');
                setShowDeleteConfirm(false);
                if (onSuccess) {
                    onSuccess('Size guide deleted successfully!');
                }
                onClose();
            } else {
                throw new Error(data.message || 'Failed to delete size guide');
            }
        } catch (err) {
            setError(err.message || 'Failed to delete size guide');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
    };

    const generateTableHTML = () => {
        const currentSizeTypes = getSizeTypes();
        
        let html = `
            <div style="padding: 20px;">
                <h3 style="text-align: center; margin-bottom: 20px; color: #333;">International Size Guide</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <th style="padding: 12px; text-align: center; font-weight: 600; border: 1px solid #ddd;"></th>
        `;
        
        currentSizeTypes.forEach(size => {
            html += `<th style="padding: 12px; text-align: center; font-weight: 600; border: 1px solid #ddd;">${size}</th>`;
        });
        
        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        measurements.forEach((measurement, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            html += `
                <tr style="background-color: ${bgColor};">
                    <td style="padding: 12px; text-align: center; font-weight: 600; border: 1px solid #ddd; background-color: #e3f2fd;">${measurement}</td>
            `;
            
            currentSizeTypes.forEach(size => {
                const value = sizeData[measurement]?.[size] || '';
                html += `<td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${value}</td>`;
            });
            
            html += '</tr>';
        });
        return html;
    };

    const handleClose = () => {
        if (!loading) {
            // Don't reset data when closing - let the modal re-open with existing data
            // Data will only be reset when modal opens and fetches fresh data
            setError('');
            setShowDeleteConfirm(false);
            onClose();
        }
    };

    return (
    <Modal 
            show={isOpen} 
            onHide={handleClose}
            size="xl"
            className="size-guide-modal"
            backdrop={loading ? "static" : true}
            keyboard={!loading}
        >
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button 
                        className="size-guide-modal-close-btn" 
                        onClick={handleClose}
                        disabled={loading}
                        aria-label="Close"
                    >
                        X
                    </button>
                </div>

                <div className="size-guide-modal-body">
                    {error && (
                        <div className="alert alert-danger mb-3" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="size-guide-table-editor">
                        <h5 className="mb-3">International Size Guide Table</h5>
                        
                        {sizeTypes.length === 0 && (
                            <div className="alert alert-warning mb-4" role="alert">
                                <strong>No sizes found!</strong> Please assign size ranges to your style first before creating a size guide.
                            </div>
                        )}
                        {/* <div className="alert alert-info mb-4" role="alert">
                            <strong> Measurements should be in inches </strong>  
                        </div> */}
                         {/* Dropdown for existing size guide style numbers */}
                <div className="mb-3 px-3 pt-3">
                    <Form.Group controlId="existingSizeGuidesDropdown">
                        <Form.Label>Select Existing Size Guide</Form.Label>
                        <Form.Select
                            value={selectedStyleNumber}
                            onChange={e => setSelectedStyleNumber(e.target.value)}
                        >
                            <option value="">-- Select Style --</option>
                            {existingStyleNumbers.map(obj => (
                                <option key={obj.style_number} value={obj.style_number}>{obj.style_name || obj.style_number}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </div>
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                                <thead className="table-primary">
                                    <tr>
                                        <th className="text-center fw-bold"></th>
                                        {sizeTypes.map(size => (
                                            <th key={size} className="text-center fw-bold">{size}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {measurements.map(measurement => (
                                        <tr key={measurement}>
                                            <td className="table-info text-center fw-bold">{measurement}</td>
                                            {sizeTypes.map(size => (
                                                <td key={`${measurement}-${size}`}>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm text-center"
                                                        value={sizeData[measurement]?.[size] || ''}
                                                        onChange={(e) => handleCellChange(measurement, size, e.target.value)}
                                                        disabled={loading || sizeTypes.length === 0}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Add Row input/button below the table */}
                        <div className="mb-3 d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control form-control-sm me-2"
                                style={{ maxWidth: 200 }}
                                placeholder="Add new measurement (e.g. Sleeve)"
                                value={newMeasurementName}
                                onChange={e => {
                                    // Capitalize first letter of each word
                                    const value = e.target.value.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                                    setNewMeasurementName(value);
                                }}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={loading || !newMeasurementName.trim() || measurements.includes(newMeasurementName.trim())}
                                onClick={() => {
                                    const name = newMeasurementName.trim();
                                    if (!name || measurements.includes(name)) return;
                                    const updated = [...measurements, name];
                                    setMeasurements(updated);
                                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
                                    setSizeData(prev => ({
                                        ...prev,
                                        [name]: Object.fromEntries(sizeTypes.map(size => [size, '']))
                                    }));
                                    setNewMeasurementName('');
                                }}
                            >
                                + Add Row
                            </button>
                        </div>

                        <div className="mt-4">
                            <h6 className="text-primary">💡 Tips for filling the table:</h6>
                            <ul className="list-unstyled ms-3">
                                <li>• Enter sizes in inches (e.g. 26.5 - 28)</li>
                                <li>• Leave cells empty if a size is not available.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="d-flex justify-content-between w-100">
                        <div>
                            {initialContent && styleNumber && companyCode && (
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={handleDeleteConfirm}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Size Guide'
                                    )}
                                </button>
                            )}
                        </div>
                        <div>
                            <button 
                                type="button" 
                                className="btn btn-secondary me-2" 
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleSave}
                                disabled={loading || sizeTypes.length === 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Size Guide'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Confirm Delete</h5>
                                </div>
                                <div className="modal-body">
                                    <p>Are you sure you want to delete this size guide? This action cannot be undone.</p>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={handleDeleteCancel}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger" 
                                        onClick={handleDelete}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SizeGuideModal;
