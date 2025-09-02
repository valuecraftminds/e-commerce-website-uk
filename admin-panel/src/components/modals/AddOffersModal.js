import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/AddOfferModal.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const AddOfferModal = ({ isOpen, onClose, product, onOfferUpdated }) => {
    const { userData } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        offer_price: '',
        offer_start_date: '',
        offer_end_date: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Reset form when modal opens/closes or product changes
    useEffect(() => {
        if (isOpen && product) {
            setFormData({
                offer_price: product.offer_price || '',
                offer_start_date: product.offer_start_date ? 
                    new Date(product.offer_start_date).toISOString().split('T')[0] : '',
                offer_end_date: product.offer_end_date ? 
                    new Date(product.offer_end_date).toISOString().split('T')[0] : ''
            });
            setError('');
            setSuccess('');
        }
    }, [isOpen, product]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    // Validate form data
    const validateForm = () => {
        if (!formData.offer_price || parseFloat(formData.offer_price) <= 0) {
            setError('Please enter a valid offer price');
            return false;
        }

        if (formData.offer_start_date && formData.offer_end_date) {
            const startDate = new Date(formData.offer_start_date);
            const endDate = new Date(formData.offer_end_date);
            
            if (endDate <= startDate) {
                setError('End date must be after start date');
                return false;
            }
        }

        // Check if offer price is not higher than sale price
        if (product.sale_price && parseFloat(formData.offer_price) >= parseFloat(product.sale_price)) {
            setError('Offer price should be lower than sale price');
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const payload = {
                product_id: product.id,
                sku: product.sku,
                company_code: userData?.company_code,
                ...formData,
                offer_price: parseFloat(formData.offer_price)
            };

            const response = await axios.post(
                `${BASE_URL}/api/admin/offers/create-offer`, 
                {
                    company_code: userData?.company_code,
                    ...payload
                }
            );

            if (response.data.success) {
                setSuccess('Offer saved successfully!');
                setTimeout(() => {
                    onOfferUpdated && onOfferUpdated();
                    handleClose();
                }, 1500);
            }
        } catch (error) {
            console.error('Error saving offer:', error);
            setError(
                error.response?.data?.message || 
                'Failed to save offer. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle removing offer
    const handleRemoveOffer = async () => {
        if (!window.confirm('Are you sure you want to remove this offer?')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.delete(
                `${BASE_URL}/api/admin/offers/remove/${product.id}`,
                {
                    params: { company_code: userData?.company_code }
                }
            );

            if (response.data.success) {
                setSuccess('Offer removed successfully!');
                setTimeout(() => {
                    onOfferUpdated && onOfferUpdated();
                    handleClose();
                }, 1500);
            }
        } catch (error) {
            console.error('Error removing offer:', error);
            setError(
                error.response?.data?.message || 
                'Failed to remove offer. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        setFormData({
            offer_price: '',
            offer_start_date: '',
            offer_end_date: ''
        });
        setError('');
        setSuccess('');
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen || !product) return null;

    // Check if product has existing offer
    const hasExistingOffer = product.offer_price && parseFloat(product.offer_price) > 0;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-container">
                <div className="modal-header">
                    <h2>{hasExistingOffer ? 'Edit Offer' : 'Add Offer'}</h2>
                    <button 
                        className="modal-close-btn"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {/* Product Information */}
                    <div className="product-info-section">
                        <h3>Product Details</h3>
                        <div className="product-info-grid">
                            <div className="info-item">
                                <label>Style Number:</label>
                                <span>{product.style_number}</span>
                            </div>
                            <div className="info-item">
                                <label>SKU:</label>
                                <span>{product.sku}</span>
                            </div>
                            <div className="info-item">
                                <label>Style Name:</label>
                                <span>{product.style_name}</span>
                            </div>
                            <div className="info-item">
                                <label>Unit Price:</label>
                                <span>${product.unit_price}</span>
                            </div>
                            <div className="info-item">
                                <label>Sale Price:</label>
                                <span>${product.sale_price}</span>
                            </div>
                            <div className="info-item">
                                <label>Stock:</label>
                                <span>{product.main_stock_qty}</span>
                            </div>
                        </div>
                    </div>

                    {/* Offer Form */}
                    <form onSubmit={handleSubmit} className="offer-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="offer_price">
                                    Offer Price *
                                </label>
                                <input
                                    type="number"
                                    id="offer_price"
                                    name="offer_price"
                                    value={formData.offer_price}
                                    onChange={handleInputChange}
                                    placeholder="Enter offer price"
                                    step="0.01"
                                    min="0"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="offer_start_date">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    id="offer_start_date"
                                    name="offer_start_date"
                                    value={formData.offer_start_date}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="offer_end_date">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    id="offer_end_date"
                                    name="offer_end_date"
                                    value={formData.offer_end_date}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Error and Success Messages */}
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            
                            {hasExistingOffer && (
                                <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={handleRemoveOffer}
                                    disabled={loading}
                                >
                                    {loading ? 'Removing...' : 'Remove Offer'}
                                </button>
                            )}
                            
                            <button
                                type="submit"
                                className="btn-save"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Offer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddOfferModal;