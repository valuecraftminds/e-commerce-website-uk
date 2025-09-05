import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import '../../styles/AddBanners.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Banner image validation function (16:9 aspect ratio for web banners)
const validateBannerImage = (file) => {
  return new Promise((resolve) => {
    // Check file size first (5MB limit for banners)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > maxSizeInBytes) {
      resolve({
        isValid: false,
        error: `File size too large (${fileSizeInMB}MB). Maximum allowed: 5MB`,
        fileName: file.name,
        fileSize: fileSizeInMB
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Banner images should have 16:9 aspect ratio (width:height = 16:9)
      const actualRatio = img.width / img.height;
      const expectedRatio = 16 / 9; // 1.778
      const tolerance = 0.1; // Allow 10% tolerance for banners
      
      const isValidRatio = Math.abs(actualRatio - expectedRatio) <= tolerance;
      
      // Also check minimum dimensions for banners
      const minWidth = 1200;
      const minHeight = 675;
      const isValidSize = img.width >= minWidth && img.height >= minHeight;
      
      resolve({
        isValid: isValidRatio && isValidSize,
        actualRatio: actualRatio,
        expectedRatio: expectedRatio,
        width: img.width,
        height: img.height,
        fileName: file.name,
        fileSize: fileSizeInMB,
        sizeError: !isValidSize ? `Minimum size required: ${minWidth}x${minHeight}px` : null,
        ratioError: !isValidRatio ? `Invalid aspect ratio (${actualRatio.toFixed(2)}:1). Required: 16:9 ratio` : null
      });
    };
    img.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to load image',
        fileName: file.name,
        fileSize: fileSizeInMB
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export default function AddBanners() {
  const { userData } = useContext(AuthContext);
  const company_code = userData?.company_code;

  // State management
  const [mainCategories, setMainCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState('');
  const [editingBanner, setEditingBanner] = useState(null);

  // Fetch main categories
  const fetchMainCategories = useCallback(async () => {
    if (!company_code) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/categories/get-categories`, {
        params: { company_code }
      });
      
      if (response.data.success) {
        // Filter only main categories (no parent_id)
        const mainCats = response.data.categories.filter(cat => !cat.parent_id);
        setMainCategories(mainCats);
      }
    } catch (err) {
      setError('Error fetching categories');
      console.error('Error fetching categories:', err);
    }
  }, [company_code]);

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    if (!company_code) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/banners/get-banners`, {
        params: { company_code }
      });
      
      if (response.data.success) {
        setBanners(response.data.banners);
      }
    } catch (err) {
      setError('Error fetching banners');
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  }, [company_code]);

  // Load data on component mount
  useEffect(() => {
    fetchMainCategories();
    fetchBanners();
  }, [fetchMainCategories, fetchBanners]);

  // Handle image file selection
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      setImageValidationError('');
      return;
    }

    setIsValidatingImage(true);
    setImageValidationError('');

    try {
      const validationResult = await validateBannerImage(file);

      if (!validationResult.isValid) {
        const errorMessage = validationResult.error || 
          [validationResult.sizeError, validationResult.ratioError]
            .filter(Boolean)
            .join(' and ');
        
        setImageValidationError(`${validationResult.fileName} (${validationResult.fileSize}MB): ${errorMessage}`);
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl('');
      } else {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setImageValidationError('');
      }
    } catch (error) {
      setImageValidationError('Error validating image. Please try again.');
      e.target.value = '';
      setSelectedFile(null);
      setPreviewUrl('');
    }
    
    setIsValidatingImage(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory || !selectedFile) {
      setError('Please select a category and upload a banner image');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('company_code', company_code);
      formData.append('category_id', selectedCategory);
      formData.append('banner_image', selectedFile);

      const url = editingBanner 
        ? `${BASE_URL}/api/admin/banners/update-banner/${editingBanner.banner_id}`
        : `${BASE_URL}/api/admin/banners/add-banner`;
      
      const method = editingBanner ? 'put' : 'post';

      const response = await axios[method](url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess(editingBanner ? 'Banner updated successfully!' : 'Banner added successfully!');
        setSelectedCategory('');
        setSelectedFile(null);
        setPreviewUrl('');
        setEditingBanner(null);
        fetchBanners();
        
        // Clear form
        document.getElementById('bannerForm').reset();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving banner');
      console.error('Error saving banner:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit banner
  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setSelectedCategory(banner.category_id);
    setError('');
    setSuccess('');
    setImageValidationError('');
  };

  // Handle delete banner
  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/admin/banners/delete-banner/${bannerId}`, {
        params: { company_code }
      });

      if (response.data.success) {
        setSuccess('Banner deleted successfully!');
        fetchBanners();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting banner');
      console.error('Error deleting banner:', err);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingBanner(null);
    setSelectedCategory('');
    setSelectedFile(null);
    setPreviewUrl('');
    setImageValidationError('');
    document.getElementById('bannerForm').reset();
  };

  // Group banners by category
  const bannersByCategory = banners.reduce((acc, banner) => {
    const categoryName = banner.category_name || 'Unknown Category';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(banner);
    return acc;
  }, {});

  return (
    <div className="add-banners-container">
      <div className="page-header">
        <h1>Banner Management</h1>
        <p>Upload banner images for main categories on your website</p>
      </div>

      {/* Success/Error Messages */}
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Banner Upload Form */}
      <div className="banner-form-container">
        <div className="form-card">
          <h2>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
          
          <form id="bannerForm" onSubmit={handleSubmit} className="banner-form">
            <div className="form-group">
              <label className="form-label">Main Category *</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a main category</option>
                {mainCategories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Banner Image *</label>
              <div className="image-upload-note">
                <small className="text-muted">
                  🖼️ Please upload banner images with 16:9 aspect ratio (e.g., 1920x1080px, 1600x900px) 
                  and minimum size of 1200x675px. Maximum file size: 5MB
                </small>
              </div>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isValidatingImage}
                required={!editingBanner}
              />
              
              {isValidatingImage && (
                <div className="validation-message validating">
                  Validating banner image...
                </div>
              )}
              
              {imageValidationError && (
                <div className="validation-message error">
                  {imageValidationError}
                </div>
              )}
              
              {selectedFile && !imageValidationError && !isValidatingImage && (
                <div className="validation-message success">
                  ✓ Banner image validated successfully
                </div>
              )}
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="image-preview">
                <label className="form-label">Preview:</label>
                <img src={previewUrl} alt="Banner Preview" className="banner-preview" />
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              {editingBanner && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || isValidatingImage || !selectedCategory || (!selectedFile && !editingBanner)}
              >
                {loading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Add Banner'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Existing Banners */}
      <div className="banners-list-container">
        <h2>Existing Banners</h2>
        
        {loading ? (
          <Spinner text="Loading banners..." />
        ) : Object.keys(bannersByCategory).length === 0 ? (
          <div className="empty-state">
            <FaImage size={50} />
            <h3>No Banners Found</h3>
            <p>Upload your first banner image above</p>
          </div>
        ) : (
          <div className="banners-grid">
            {Object.entries(bannersByCategory).map(([categoryName, categoryBanners]) => (
              <div key={categoryName} className="category-section">
                <h3 className="category-title">{categoryName}</h3>
                <div className="banners-row">
                  {categoryBanners.map((banner) => (
                    <div key={banner.banner_id} className="banner-card">
                      <div className="banner-image-container">
                        <img
                          src={`${BASE_URL}/uploads/banners/${banner.banner_url}`}
                          alt={`Banner for ${categoryName}`}
                          className="banner-image"
                        />
                        <div className="banner-overlay">
                          <button
                            className="btn btn-edit"
                            onClick={() => handleEdit(banner)}
                            title="Edit Banner"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-delete"
                            onClick={() => handleDelete(banner.banner_id)}
                            title="Delete Banner"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <div className="banner-info">
                        <p className="banner-date">
                          Added: {new Date(banner.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
