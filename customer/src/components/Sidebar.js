import { Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import axios from "axios";

import "../styles/Sidebar.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function Sidebar({
  category,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onCategoryClick,
}) {
  const sidebarRef = useRef(null);
  const currentCategory = category?.toLowerCase();

  // State to hold product types and categories
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loadingProductTypes, setLoadingProductTypes] = useState({});

  // Fetch categories on mount
  useEffect(() => {
    if (!COMPANY_CODE) {
      console.error('Company code not configured');
      return;
    }

    axios.get(`${BASE_URL}/api/customer/main-categories`, {
      params: {
        company_code: COMPANY_CODE
      }
    })
      .then(res => {
        setCategories(res.data);
      })
      .catch(err => console.error("Failed to fetch categories:", err));
  }, []);

  // Fetch product types when category changes
  useEffect(() => {
    if (!category || categories.length === 0 || !COMPANY_CODE) {
      return;
    }

    // Find the category ID based on the current category name
    const matchedCategory = categories.find(
      cat => cat.category_name.toLowerCase() === currentCategory
    );

    if (matchedCategory && !productTypes[matchedCategory.category_id]) {
      setLoading(true);
      // Fix the API endpoint to match your backend route
      axios.get(`${BASE_URL}/api/customer/product-types/${matchedCategory.category_id}`, {
        params: {
          company_code: COMPANY_CODE
        }
      })
        .then(res => {
          setProductTypes(prev => ({
            ...prev,
            [matchedCategory.category_id]: res.data.categories || []
          }));
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch product types:", err);
          setProductTypes(prev => ({
            ...prev,
            [matchedCategory.category_id]: []
          }));
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [category, categories, currentCategory, productTypes]);

  // Function to toggle category expansion and fetch product types
  const toggleCategory = async (categoryItem) => {
    const categoryId = categoryItem.category_id;
    const categoryName = categoryItem.category_name;
    
    // Toggle expanded state
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));

    // If expanding and we don't have product types for this category, fetch them
    if (!expandedCategories[categoryId] && !productTypes[categoryId]) {
      setLoadingProductTypes(prev => ({ ...prev, [categoryId]: true }));
      
      try {
        const response = await axios.get(`${BASE_URL}/api/customer/product-types/${categoryId}`, {
          params: {
            company_code: COMPANY_CODE
          }
        });
        
        setProductTypes(prev => ({
          ...prev,
          [categoryId]: response.data.categories || []
        }));
      } catch (err) {
        console.error(`Failed to fetch product types for ${categoryName}:`, err);
        setProductTypes(prev => ({
          ...prev,
          [categoryId]: []
        }));
      } finally {
        setLoadingProductTypes(prev => ({ ...prev, [categoryId]: false }));
      }
    }
  };

  // Click outside handler for mobile
  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 768px)").matches) return;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Desktop view
  if (category && !window.matchMedia("(max-width: 768px)").matches) {
    // Find the current category ID
    const matchedCategory = categories.find(
      cat => cat.category_name.toLowerCase() === currentCategory
    );
    
    // Get product types for the current category
    const currentProductTypes = matchedCategory ? productTypes[matchedCategory.category_id] || [] : [];
    
    // Get unique product type names
    const uniqueProductTypes = Array.from(
      new Set(currentProductTypes.map((item) => item.category_name))
    );

    return (
      <aside
        className={`sidebar ${isOpen ? "open" : ""}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sidebar-header d-flex justify-content-between align-items-center">
          <h2 className="sidebar-title">{category} Collection</h2>
        </header>

        <nav className="sidebar-nav d-flex flex-column">
          {loading ? (
            <span className="text-muted px-3">Loading...</span>
          ) : uniqueProductTypes.length > 0 ? (
            uniqueProductTypes.map((typeName, idx) => (
              <Link 
                key={idx}
                to={`/shop/${currentCategory}/${typeName.toLowerCase().replace(/\s+/g, '-')}`} 
                className="nav-link"
                onClick={() => onClose && onClose()}
              >
                {typeName}
              </Link>
            ))
          ) : (
            <span className="text-muted px-3">No items found</span>
          )}
        </nav>
      </aside>
    );
  }

  // Mobile view
  if (isOpen) {
    return (
      <aside
        ref={sidebarRef}
        className="sidebar open"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidebar-header px-3 py-2 border-bottom">
          <h5 className="mb-0">Categories</h5>
        </div>

        <div className="sidebar-categories">
          {categories.map((cat) => (
            <div key={cat.category_id} className="category-group">
              {/* Main category header */}
              <div
                className={`sidebar-category-item px-3 py-2 d-flex justify-content-between align-items-center ${
                  cat.category_name.toLowerCase() === currentCategory ? "text-primary" : ""
                }`}
                onClick={() => toggleCategory(cat)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter") toggleCategory(cat);
                }}
                style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
              >
                <span>{cat.category_name}</span>
                <i 
                  className={`fas ${expandedCategories[cat.category_id] ? 'fa-chevron-down' : 'fa-chevron-right'}`}
                  style={{ fontSize: '12px', color: '#666' }}
                ></i>
              </div>

              {/* Subcategories (Product Types) */}
              {expandedCategories[cat.category_id] && (
                <div className="subcategories" style={{ backgroundColor: '#f8f9fa' }}>
                  {loadingProductTypes[cat.category_id] ? (
                    <div className="px-4 py-2 text-muted" style={{ fontSize: '14px' }}>
                      Loading...
                    </div>
                  ) : productTypes[cat.category_id] && productTypes[cat.category_id].length > 0 ? (
                    Array.from(new Set(productTypes[cat.category_id].map((item) => item.category_name))).map((typeName, idx) => (
                      <Link
                        key={idx}
                        to={`/shop/${cat.category_name.toLowerCase()}/${typeName.toLowerCase().replace(/\s+/g, '-')}`}
                        className="sidebar-subcategory-item px-4 py-2 d-block text-decoration-none"
                        onClick={() => onClose && onClose()}
                        style={{ 
                          fontSize: '14px', 
                          color: '#666',
                          borderBottom: '1px solid #dee2e6'
                        }}
                      >
                        {typeName}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-muted" style={{ fontSize: '14px' }}>
                      No subcategories found
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return null;
}