import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import '../../styles/SizeGuideModal.css';

const SizeGuideModal = ({ isOpen, onClose, onSave = '', title = "Add Size Guide", assignedRangeSizes = {} }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sizeData, setSizeData] = useState({});

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
    const measurements = ['Bust', 'Chest', 'Waist', 'Hips', 'Height', 'Collar Size'];

    // Reset content when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError('');
            // Only initialize if sizeData is empty (first time opening)
            const currentSizeTypes = getSizeTypes();
            
            // Check if we need to initialize or update the structure
            const needsInitialization = Object.keys(sizeData).length === 0 || 
                !measurements.every(measurement => sizeData[measurement]) ||
                !currentSizeTypes.every(size => measurements.every(measurement => sizeData[measurement] && sizeData[measurement].hasOwnProperty(size)));
            
            if (needsInitialization) {
                const initialData = {};
                measurements.forEach(measurement => {
                    initialData[measurement] = {};
                    currentSizeTypes.forEach(size => {
                        // Preserve existing values if they exist
                        initialData[measurement][size] = sizeData[measurement]?.[size] || '';
                    });
                });
                setSizeData(initialData);
            }
        }
    }, [isOpen]); // Removed assignedRangeSizes from dependencies

    // Separate useEffect to handle assignedRangeSizes changes
    useEffect(() => {
        if (isOpen && Object.keys(sizeData).length > 0) {
            const currentSizeTypes = getSizeTypes();
            setSizeData(prev => {
                const updatedData = { ...prev };
                measurements.forEach(country => {
                    if (!updatedData[country]) {
                        updatedData[country] = {};
                    }
                    currentSizeTypes.forEach(size => {
                        if (!updatedData[country].hasOwnProperty(size)) {
                            updatedData[country][size] = '';
                        }
                    });
                });
                return updatedData;
            });
        }
    }, [assignedRangeSizes]);

    const handleCellChange = (country, sizeType, value) => {
        setSizeData(prev => ({
            ...prev,
            [country]: {
                ...prev[country],
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

        setLoading(true);
        setError('');

        try {
            await onSave(tableContent);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save size guide');
        } finally {
            setLoading(false);
        }
    };

    const generateTableHTML = () => {
        const currentSizeTypes = getSizeTypes();
        
        let html = `
            <div style="padding: 20px;">
                <h3 style="text-align: center; margin-bottom: 20px; color: #333;">International Size Guide</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <th style="padding: 12px; text-align: center; font-weight: 600; border: 1px solid #ddd;">Country</th>
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
            // Only reset data when actually closing the modal
            setSizeData({});
            setError('');
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
                        <div className="alert alert-info mb-4" role="alert">
                            <strong> Measurements should be in inches </strong>  
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

                        <div className="mt-4">
                            <h6 className="text-primary">💡 Tips for filling the table:</h6>
                            <ul className="list-unstyled ms-3">
                                <li>• Enter sizes in inches (e.g. 26.5 - 28)</li>
                                <li>• Leave cells empty if a size is not available in that country</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
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
        </Modal>
    );
};

export default SizeGuideModal;
