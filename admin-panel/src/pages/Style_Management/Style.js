import 'bootstrap/dist/css/bootstrap.min.css';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { StyleFormModal, VariantFormModal } from '../../components/modals/StyleModals';
import StyleTable from '../../components/StyleTable';
import Spinner from '../../components/Spinner';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/Style.css';

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
  const company_code = userData?.company_code;
  // Company currency state
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  // Fetch company currency
  const fetchCompanyCurrency = useCallback(async () => {
    if (!company_code) return;
    try {
      const response = await fetch(`${BASE_URL}/api/admin/companies-by-code/${company_code}`);
      const data = await response.json();
      if (data.success && data.company && data.company.currency) {
        setCompanyCurrency(data.company.currency);
      }
    } catch (err) {
      // fallback to USD
      setCompanyCurrency('USD');
    }
  }, [company_code, BASE_URL]);

  // Modal states
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isEditingVariant, setIsEditingVariant] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);

  // company_code is now initialized above

  // Form states updated for multiple images
  const [styleForm, setStyleForm] = useState({
    style_number: '', // Style Number (used as style_number)
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
    sale_price: '',

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

  const fetchVariants = useCallback(async (styleNumber) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/get-style-variants/${styleNumber}?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      }
    } catch (err) {
      setError('Error fetching variants');
    }
  }, [company_code]);

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
    fetchCompanyCurrency();
  }, [fetchStyles, fetchCategories, fetchColors, fetchSizes, fetchMaterials, fetchFits, fetchCompanyCurrency]);

  const handleAddStyle = () => {
    setEditingStyle(null);
    setSelectedMainCategory('');
    setStyleForm({
      style_number: '',
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
        style_number: style.style_number || '',
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
      // Deletion confirmation is now handled by DeleteModal in StyleTable
      try {
        const response = await fetch(`${BASE_URL}/api/admin/styles/delete-styles/${styleId}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
          setSuccess('Style deleted successfully!');
          // Clear selected style and close modals if the deleted style was selected
          setSelectedStyle(prev => (prev && prev.style_id === styleId ? null : prev));
          setShowVariantModal(false);
          setEditingStyle(prev => (prev && prev.style_id === styleId ? null : prev));
          setShowStyleModal(false);
          fetchStyles();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(data.message || 'Failed to delete style');
        }
      } catch (err) {
        setError('Error deleting style');
      }
    },
    handleManageAttributes: (style) => {
      navigate(`/styles/${style.style_number}/attributes`);
    },
    handleToggleIsView: async (style, toView) => {
      // Always allow click, but check requirements and show error/success
      // Required fields: style_number, name, description, category_id, main_category_id, image
      const requiredFields = [
        style.style_number,
        style.name,
        style.description,
        style.category_id,
        style.main_category_id,
        style.image
      ];
      const allFieldsFilled = requiredFields.every(f => f !== null && f !== undefined && f !== '' && f !== 'null');
      if (toView && (!allFieldsFilled || style.approved !== 'yes')) {
        setError('All fields must be filled and approved to view in client side.');
        setTimeout(() => setError(''), 2500);
        return;
      }
      try {
        const response = await fetch(`${BASE_URL}/api/admin/styles/update-is-view/${style.style_id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_view: toView ? 'yes' : 'no' })
          }
        );
        const data = await response.json();
        if (data.success) {
          setSuccess(`Style is_view set to ${toView ? 'yes' : 'no'}`);
          fetchStyles();
          setTimeout(() => setSuccess(''), 2000);
        } else {
          setError(data.message || 'Failed to update view status');
          setTimeout(() => setError(''), 2500);
        }
      } catch (err) {
        setError('Error updating view status');
        setTimeout(() => setError(''), 2500);
      }
    },
    getIsViewError: () => '' // No longer used, but keep for compatibility
  }), [company_code, subCategories, fetchStyles, navigate, BASE_URL]);

  const handleSaveStyle = async () => {
    setLoading(true);
    setError('');

    // Check required fields
    const requiredFields = [
      styleForm.style_number,
      styleForm.name,
      styleForm.description,
      styleForm.category_id,
      styleForm.main_category_id,
      styleForm.images && styleForm.images.length > 0
    ];
    const allFieldsFilled = requiredFields.every(f => f !== null && f !== undefined && f !== '' && f !== false && f !== 'null');

    // Set is_view based on required fields
    const formData = new FormData();
    Object.keys(styleForm).forEach(key => {
      if (key === 'images') {
        styleForm.images.forEach(image => {
          formData.append('images', image);
        });
      } else if (key === 'style_number') {
        formData.append('style_number', styleForm.style_number); // send as style_number
      } else if (key === 'is_view') {
        // skip, will set below
      } else {
        formData.append(key, styleForm[key]);
      }
    });
    formData.append('is_view', allFieldsFilled ? 'yes' : 'no');

    try {
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
          style_number: selectedStyle.style_number
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Variant added successfully');
        fetchVariants(selectedStyle.style_number);
        setVariantForm({
          color_id: '',
          size_id: '',
          fit_id: '',
          material_id: '',
          unit_price: '',
          sale_price: '',
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
        fetchVariants(selectedStyle.style_number);
        setVariantForm({
          color_id: '',
          size_id: '',
          fit_id: '',
          material_id: '',
          unit_price: '',
          sale_price: '',
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
    // Deletion confirmation is now handled by DeleteModal in StyleTable (if implemented for variants)
    try {
      const response = await fetch(`${BASE_URL}/api/admin/styles/delete-style-variants/${variantId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Variant deleted successfully');
        fetchVariants(selectedStyle.style_number);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error deleting variant');
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
    fetchVariants(style.style_number);
    setShowVariantModal(true);
  }, [fetchVariants]);

  return (
    <div className="style-management">
      {/* Header */}
      <div className="style-header">
        <h1>Style Management</h1>
        
        <div>
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
        {loading ? (
          <Spinner text="Loading styles..." />
        ) : styles.length === 0 ? (
          <div className="empty-state">
            <h3>No Styles Found</h3>
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
            onAfterDelete={fetchStyles}
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
        companyCurrency={companyCurrency}
      />
    </div>
  );
}