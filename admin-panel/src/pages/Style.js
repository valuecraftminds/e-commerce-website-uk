import React, { useEffect, useState } from 'react';
import '../styles/Style.css';

export default function Style() {
  const [activeTab, setActiveTab] = useState('styles');
  const [styles, setStyles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [fits, setFits] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [selectedStyleForVariants, setSelectedStyleForVariants] = useState(null);
  const [variants, setVariants] = useState([]);
  
  // Form states
  const [styleForm, setStyleForm] = useState({
    style_code: '',
    name: '',
    description: '',
    category_id: '',
    base_price: '',
    brand: '',
    season: '',
    gender: 'Unisex'
  });

  const [variantForm, setVariantForm] = useState({
    size_id: '',
    color_id: '',
    fit_id: '',
    material_id: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    min_stock_level: '',
    weight: ''
  });

  const API_BASE_URL = 'http://localhost:3000/api';

  // Fetch all data on component mount
  useEffect(() => {
    fetchStyles();
    fetchCategories();
    fetchColors();
    fetchSizes();
    fetchFits();
    fetchMaterials();
  }, []);

  // API Functions
  const fetchStyles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get-styles`);
      const data = await response.json();
      if (data.success) {
        setStyles(data.styles);
      } else {
        setError('Failed to fetch styles');
      }
    } catch (err) {
      setError('Error fetching styles');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-colors`);
      const data = await response.json();
      if (data.success) {
        setColors(data.colors);
      }
    } catch (err) {
      console.error('Error fetching colors:', err);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-sizes`);
      const data = await response.json();
      if (data.success) {
        setSizes(data.sizes);
      }
    } catch (err) {
      console.error('Error fetching sizes:', err);
    }
  };

  const fetchFits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-fits`);
      const data = await response.json();
      if (data.success) {
        setFits(data.fits);
      }
    } catch (err) {
      console.error('Error fetching fits:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-materials`);
      const data = await response.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  };

  const fetchVariants = async (styleCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-variants/${styleCode}`);
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
    }
  };

  // Handle Style Operations
  const handleAddStyle = () => {
    setEditingStyle(null);
    setStyleForm({
      style_code: '',
      name: '',
      description: '',
      category_id: '',
      base_price: '',
      brand: '',
      season: '',
      gender: 'Unisex'
    });
    setShowStyleModal(true);
  };

  const handleEditStyle = (style) => {
    setEditingStyle(style);
    setStyleForm({
      style_code: style.style_code,
      name: style.name,
      description: style.description || '',
      category_id: style.category_id,
      base_price: style.base_price,
      brand: style.brand || '',
      season: style.season || '',
      gender: style.gender || 'Unisex'
    });
    setShowStyleModal(true);
  };

  const handleSaveStyle = async () => {
    setLoading(true);
    setError('');
    
    try {
      const url = editingStyle 
        ? `${API_BASE_URL}/update-style/${editingStyle.style_code}`
        : `${API_BASE_URL}/add-style`;
      
      const method = editingStyle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(styleForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingStyle ? 'Style updated successfully!' : 'Style added successfully!');
        setShowStyleModal(false);
        fetchStyles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save style');
      }
    } catch (err) {
      setError('Error saving style');
    }
    setLoading(false);
  };

  const handleDeleteStyle = async (styleCode) => {
    if (window.confirm('Are you sure you want to delete this style?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/delete-style/${styleCode}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (data.success) {
          setSuccess('Style deleted successfully!');
          fetchStyles();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(data.message || 'Failed to delete style');
        }
      } catch (err) {
        setError('Error deleting style');
      }
    }
  };

  // Handle Variant Operations
  const handleViewVariants = (style) => {
    setSelectedStyleForVariants(style);
    setActiveTab('variants');
    fetchVariants(style.style_code);
  };

  const generateSKU = () => {
    if (!selectedStyleForVariants || !variantForm.color_id || !variantForm.size_id) {
      return '';
    }
    
    const color = colors.find(c => c.color_id === parseInt(variantForm.color_id));
    const size = sizes.find(s => s.size_id === parseInt(variantForm.size_id));
    const fit = fits.find(f => f.fit_id === parseInt(variantForm.fit_id));
    const material = materials.find(m => m.material_id === parseInt(variantForm.material_id));
    
    const colorCode = color ? color.color_name.substring(0, 3).toUpperCase() : '';
    const sizeCode = size ? size.size_name : '';
    const fitCode = fit ? fit.fit_name.substring(0, 3).toUpperCase() : '';
    const materialCode = material ? material.material_name.substring(0, 3).toUpperCase() : '';
    
    return `${selectedStyleForVariants.style_code}-${colorCode}-${sizeCode}-${fitCode}-${materialCode}`;
  };

  // Utility Functions
  const getStockStatus = (quantity) => {
    if (quantity <= 10) return 'stock-low';
    if (quantity <= 50) return 'stock-medium';
    return 'stock-high';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
  };

  return (
    <div className="style-management">
      {/* Header */}
      <div className="style-header">
        <h1>Style Management</h1>
        <button className="add-style-btn" onClick={handleAddStyle}>
          Add New Style
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      {/* Tabs */}
      <div className="style-tabs">
        <button 
          className={`tab-btn ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          All Styles
        </button>
        <button 
          className={`tab-btn ${activeTab === 'variants' ? 'active' : ''}`}
          onClick={() => setActiveTab('variants')}
        >
          Variants {selectedStyleForVariants && `(${selectedStyleForVariants.style_code})`}
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'styles' && (
        <div className="styles-content">
          {loading ? (
            <div className="loading">Loading styles...</div>
          ) : styles.length === 0 ? (
            <div className="empty-state">
              <h3>No Styles Found</h3>
              <p>Start by adding your first clothing style.</p>
              <button className="add-style-btn" onClick={handleAddStyle}>
                Add First Style
              </button>
            </div>
          ) : (
            <div className="styles-grid">
              {styles.map((style) => (
                <div key={style.style_code} className="style-card">
                  <div className="style-card-header">
                    <span className="style-code">{style.style_code}</span>
                    <div className="style-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEditStyle(style)}
                      >
                        Edit
                      </button>
                      <button 
                        className="action-btn variants-btn"
                        onClick={() => handleViewVariants(style)}
                      >
                        Variants
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteStyle(style.style_code)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="style-name">{style.name}</h3>
                  <p className="style-description">{style.description}</p>
                  
                  <div className="style-details">
                    <div className="detail-item">
                      <span className="detail-label">Category</span>
                      <span className="detail-value">{style.category_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Brand</span>
                      <span className="detail-value">{style.brand || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Season</span>
                      <span className="detail-value">{style.season || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Gender</span>
                      <span className="detail-value">{style.gender}</span>
                    </div>
                  </div>
                  
                  <div className="style-price">
                    {formatPrice(style.base_price)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'variants' && (
        <div className="variants-section">
          {selectedStyleForVariants ? (
            <>
              <div className="variants-header">
                <h2 className="variants-title">
                  Variants for {selectedStyleForVariants.name} ({selectedStyleForVariants.style_code})
                </h2>
                <button 
                  className="add-variant-btn"
                  onClick={() => {
                    setVariantForm({
                      size_id: '',
                      color_id: '',
                      fit_id: '',
                      material_id: '',
                      price: selectedStyleForVariants.base_price,
                      cost_price: '',
                      stock_quantity: '',
                      min_stock_level: '10',
                      weight: ''
                    });
                    setShowVariantModal(true);
                  }}
                >
                  Add Variant
                </button>
              </div>
              
              {variants.length === 0 ? (
                <div className="empty-state">
                  <h3>No Variants Found</h3>
                  <p>Create variants with different sizes, colors, fits, and materials.</p>
                </div>
              ) : (
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Fit</th>
                      <th>Material</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.variant_id}>
                        <td>
                          <span className="variant-sku">{variant.sku}</span>
                        </td>
                        <td>{variant.size_name || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {variant.color_code && (
                              <div 
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: variant.color_code,
                                  borderRadius: '50%',
                                  border: '1px solid #ddd'
                                }}
                              ></div>
                            )}
                            {variant.color_name || 'N/A'}
                          </div>
                        </td>
                        <td>{variant.fit_name || 'N/A'}</td>
                        <td>{variant.material_name || 'N/A'}</td>
                        <td>{formatPrice(variant.price)}</td>
                        <td>
                          <span className={`stock-badge ${getStockStatus(variant.stock_quantity)}`}>
                            {variant.stock_quantity}
                          </span>
                        </td>
                        <td>
                          <div className="style-actions">
                            <button className="action-btn edit-btn">Edit</button>
                            <button className="action-btn delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Select a Style</h3>
              <p>Choose a style from the styles tab to view and manage its variants.</p>
              <button 
                className="add-style-btn"
                onClick={() => setActiveTab('styles')}
              >
                Go to Styles
              </button>
            </div>
          )}
        </div>
      )}

      {/* Style Modal */}
      {showStyleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStyle ? 'Edit Style' : 'Add New Style'}
              </h2>
              <button 
                className="close-btn"
                onClick={() => setShowStyleModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Style Code *</label>
              <input
                type="text"
                className="form-input"
                value={styleForm.style_code}
                onChange={(e) => setStyleForm({...styleForm, style_code: e.target.value})}
                disabled={editingStyle}
                placeholder="e.g., TS001"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Style Name *</label>
              <input
                type="text"
                className="form-input"
                value={styleForm.name}
                onChange={(e) => setStyleForm({...styleForm, name: e.target.value})}
                placeholder="e.g., Classic Cotton T-Shirt"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={styleForm.description}
                onChange={(e) => setStyleForm({...styleForm, description: e.target.value})}
                placeholder="Describe the style..."
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={styleForm.category_id}
                  onChange={(e) => setStyleForm({...styleForm, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={styleForm.base_price}
                  onChange={(e) => setStyleForm({...styleForm, base_price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  className="form-input"
                  value={styleForm.brand}
                  onChange={(e) => setStyleForm({...styleForm, brand: e.target.value})}
                  placeholder="Brand name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Season</label>
                <select
                  className="form-select"
                  value={styleForm.season}
                  onChange={(e) => setStyleForm({...styleForm, season: e.target.value})}
                >
                  <option value="">Select Season</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Autumn">Autumn</option>
                  <option value="Winter">Winter</option>
                  <option value="All Season">All Season</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={styleForm.gender}
                onChange={(e) => setStyleForm({...styleForm, gender: e.target.value})}
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowStyleModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleSaveStyle}
                disabled={loading}
              >
                {loading ? 'Saving...' : editingStyle ? 'Update Style' : 'Add Style'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Variant</h2>
              <button 
                className="close-btn"
                onClick={() => setShowVariantModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Generated SKU</label>
              <input
                type="text"
                className="form-input"
                value={generateSKU()}
                disabled
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Size</label>
                <select
                  className="form-select"
                  value={variantForm.size_id}
                  onChange={(e) => setVariantForm({...variantForm, size_id: e.target.value})}
                >
                  <option value="">Select Size</option>
                  {sizes.map((size) => (
                    <option key={size.size_id} value={size.size_id}>
                      {size.size_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <select
                  className="form-select"
                  value={variantForm.color_id}
                  onChange={(e) => setVariantForm({...variantForm, color_id: e.target.value})}
                >
                  <option value="">Select Color</option>
                  {colors.map((color) => (
                    <option key={color.color_id} value={color.color_id}>
                      {color.color_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Fit</label>
                <select
                  className="form-select"
                  value={variantForm.fit_id}
                  onChange={(e) => setVariantForm({...variantForm, fit_id: e.target.value})}
                >
                  <option value="">Select Fit</option>
                  {fits.map((fit) => (
                    <option key={fit.fit_id} value={fit.fit_id}>
                      {fit.fit_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Material</label>
                <select
                  className="form-select"
                  value={variantForm.material_id}
                  onChange={(e) => setVariantForm({...variantForm, material_id: e.target.value})}
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.material_id} value={material.material_id}>
                      {material.material_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Selling Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({...variantForm, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost Price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={variantForm.cost_price}
                  onChange={(e) => setVariantForm({...variantForm, cost_price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Initial Stock</label>
                <input
                  type="number"
                  className="form-input"
                  value={variantForm.stock_quantity}
                  onChange={(e) => setVariantForm({...variantForm, stock_quantity: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Min Stock Level</label>
                <input
                  type="number"
                  className="form-input"
                  value={variantForm.min_stock_level}
                  onChange={(e) => setVariantForm({...variantForm, min_stock_level: e.target.value})}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={variantForm.weight}
                onChange={(e) => setVariantForm({...variantForm, weight: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowVariantModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Variant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}