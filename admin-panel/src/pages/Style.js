import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { StyleFormModal, VariantFormModal } from '../components/modals/StyleModals';
import StyleTable from '../components/StyleTable';
import { AuthContext } from '../context/AuthContext';
import '../styles/Style.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Style() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { userData } = useContext(AuthContext);

  // Modal states
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isEditingVariant, setIsEditingVariant] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);

  const company_code = userData?.company_code;

  // Form states updated for multiple images
  const [styleForm, setStyleForm] = useState({
    name: '',
    description: '',
    category_id: '',
    main_category_id: '',
    images: [],
    company_code: company_code,
    approved: 'no'
  });

  const [variantForm, setVariantForm] = useState({
    color_id: '',
    size_id: '',
    fit_id: '',
    material_id: '',
    unit_price: '',
    price: '',

  });

  // Add these new states
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [fits, setFits] = useState([]);

  // API Functions
  const fetchStyles = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching styles for company:', company_code); // Debug log
      
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-styles?company_code=${company_code}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data); // Debug log

      if (data.success) {
        setStyles(data.styles);
      } else {
        setError(data.message || 'Failed to fetch styles');
      }
    } catch (err) {
      console.error('Error fetching styles:', err); // Debug log
      setError(`Error fetching styles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [company_code]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/categories/get-categories?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        const mainCats = data.categories.filter(cat => !cat.parent_id);
        setMainCategories(mainCats);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [company_code]);

  const fetchVariants = useCallback(async (styleCode) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-style-variants/${styleCode}`);
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      }
    } catch (err) {
      setError('Error fetching variants');
    }
  }, []);

  const fetchColors = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/colors/get-colors?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setColors(data.colors);
      }
    } catch (err) {
      setError('Error fetching colors');
    }
  }, [company_code]);

  const fetchSizes = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/sizes/get-sizes?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setSizes(data.sizes);
      }
    } catch (err) {
      setError('Error fetching sizes');
    }
  }, [company_code]);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/materials/get-materials?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      setError('Error fetching materials');
    }
  }, [company_code]);

  const fetchFits = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/fits/get-fits?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setFits(data.fits);
      }
    } catch (err) {
      setError('Error fetching fits');
    }
  }, [company_code]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchStyles();
    fetchCategories();
    fetchColors();
    fetchSizes();
    fetchMaterials();
    fetchFits();
  }, [fetchStyles, fetchCategories, fetchColors, fetchSizes, fetchMaterials, fetchFits]);

  const handleAddStyle = () => {
    setEditingStyle(null);
    setSelectedMainCategory('');
    setStyleForm({
      name: '',
      description: '',
      category_id: '',
      main_category_id: '',
      images: [],
      company_code: company_code,
      approved: 'no'
    });
    setShowStyleModal(true);
  };

  const tableActions = useMemo(() => ({
    handleEditStyle: (style) => {
      setEditingStyle(style);
      const subcategory = subCategories.find(sub => parseInt(sub.category_id) === parseInt(style.category_id));
      const mainCategoryId = subcategory?.parent_id || '';
      setSelectedMainCategory(mainCategoryId.toString());
      setStyleForm({
        name: style.name,
        description: style.description || '',
        category_id: style.category_id.toString(),
        main_category_id: mainCategoryId.toString(),
        images: [],
        company_code: company_code,
        approved: style.approved || 'no'
      });
      setShowStyleModal(true);
    },
    handleDeleteStyle: async (styleId) => {
      if (window.confirm('Are you sure you want to delete this style?')) {
        try {
          const response = await fetch(`${BASE_URL}/api/admin/styles/delete-styles/${styleId}`, {
            method: 'DELETE'
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
    }
  }), [company_code, subCategories, fetchStyles]);

  const handleSaveStyle = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      Object.keys(styleForm).forEach(key => {
        if (key === 'images') {
          styleForm.images.forEach(image => {
            formData.append('images', image);
          });
        } else {
          formData.append(key, styleForm[key]);
        }
      });

      const url = editingStyle 
        ? `${BASE_URL}/api/admin/styles/update-styles/${editingStyle.style_id}`
        : `${BASE_URL}/api/admin/styles/add-styles`;
      
      const method = editingStyle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
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

  const handleSaveVariant = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/add-style-variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...variantForm,
          company_code,
          style_code: selectedStyle.style_code
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Variant added successfully');
        fetchVariants(selectedStyle.style_code);
        setVariantForm({
          color_id: '',
          size_id: '',
          fit_id: '',
          material_id: '',
          unit_price: '',
          price: '',
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error saving variant');
    }
  };

  const handleEditVariant = async (variantId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/update-style-variants/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...variantForm,
          company_code
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Variant updated successfully');
        fetchVariants(selectedStyle.style_code);
        setVariantForm({
          color_id: '',
          size_id: '',
          fit_id: '',
          material_id: '',
          unit_price: '',
          price: '',
        });
        setIsEditingVariant(false);
        setEditingVariantId(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error updating variant');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/styles/delete-style-variants/${variantId}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
          setSuccess('Variant deleted successfully');
          fetchVariants(selectedStyle.style_code);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error deleting variant');
      }
    }
  };

  const handleMainCategoryChange = async (categoryId) => {
    setSelectedMainCategory(categoryId);
    setStyleForm(prev => ({
      ...prev,
      category_id: '',
      main_category_id: categoryId
    }));

    if (categoryId) {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/categories/subcategories/${categoryId}?company_code=${company_code}`);
        const data = await response.json();
        if (data.success) {
          setSubCategories(data.subcategories);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    } else {
      setSubCategories([]);
    }
  };

  const getSubcategoriesForMainCategory = () => {
    return subCategories;
  };

  // Add row click handler
  const handleRowClick = useCallback((style) => {
    setSelectedStyle(style);
    fetchVariants(style.style_code);
    setShowVariantModal(true);
  }, [fetchVariants]);

  return (
    <div className="style-management">
      {/* Header */}
      <div className="style-header">
        <h1>Style Management</h1>
        
        <div className="header-buttons">
          <ButtonGroup className="variant-buttons">
            <Button onClick={() => navigate('/colors')} variant="outline-primary">
              Manage Colors
            </Button>
            <Button onClick={() => navigate('/sizes')} variant="outline-primary">
              Manage Sizes
            </Button>
            <Button onClick={() => navigate('/materials')} variant="outline-primary">
              Manage Materials
            </Button>
            <Button onClick={() => navigate('/fits')} variant="outline-primary">
              Manage Fits
            </Button>
          </ButtonGroup>

          <button className="add-style-btn" onClick={handleAddStyle}>
            <FaPlus size={14} style={{ marginRight: '8px' }} />
            Add New Style
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      {/* Styles Table */}
      <div className="styles-table-container">
        {styles.length === 0 ? (
          <div className="empty-state">
            <h3>No Styles Found</h3>
            <p>Start by adding your first clothing style.</p>
            <button className="add-style-btn" onClick={handleAddStyle}>
              Add First Style
            </button>
          </div>
        ) : (
          <StyleTable
            styles={styles}
            loading={loading}
            tableActions={tableActions}
            handleRowClick={handleRowClick}
            BASE_URL={BASE_URL}
          />
        )}
      </div>

      {/* Replace old modals with new component imports */}
      <StyleFormModal 
        show={showStyleModal}
        onHide={() => setShowStyleModal(false)}
        editingStyle={editingStyle}
        styleForm={styleForm}
        setStyleForm={setStyleForm}
        selectedMainCategory={selectedMainCategory}
        handleMainCategoryChange={handleMainCategoryChange}
        mainCategories={mainCategories}
        getSubcategoriesForMainCategory={getSubcategoriesForMainCategory}
        handleSaveStyle={handleSaveStyle}
        loading={loading}
        BASE_URL={BASE_URL}
      />

      <VariantFormModal 
        show={showVariantModal}
        onHide={() => setShowVariantModal(false)}
        selectedStyle={selectedStyle}
        variantForm={variantForm}
        setVariantForm={setVariantForm}
        handleSaveVariant={handleSaveVariant}
        handleEditVariant={handleEditVariant}
        handleDeleteVariant={handleDeleteVariant}
        variants={variants}
        colors={colors}
        sizes={sizes}
        materials={materials}
        fits={fits}
        isEditing={isEditingVariant}
        editingId={editingVariantId}
        setIsEditing={setIsEditingVariant}
        setEditingId={setEditingVariantId}
      />
    </div>
  );
}