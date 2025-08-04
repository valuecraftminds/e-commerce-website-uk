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
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(false);

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
        console.log("Categories fetched:", res.data);
        setCategories(res.data);
      })
      .catch(err => console.error("Failed to fetch categories:", err));
  }, []);

  // Fetch product types when category changes
  useEffect(() => {
    if (!category || categories.length === 0 || !COMPANY_CODE) {
      setProductTypes([]);
      return;
    }

    // Find the category ID based on the current category name
    const matchedCategory = categories.find(
      cat => cat.category_name.toLowerCase() === currentCategory
    );

    if (matchedCategory) {
      setLoading(true);
      // Fix the API endpoint to match your backend route
      axios.get(`${BASE_URL}/api/customer/product-types/${matchedCategory.category_id}`, {
        params: {
          company_code: COMPANY_CODE
        }
      })
        .then(res => {
          console.log("Product types fetched:", res.data);
          setProductTypes(res.data.categories || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch product types:", err);
          setProductTypes([]);
          setLoading(false);
        });
    } else {
      setProductTypes([]);
    }
  }, [category, categories, currentCategory]);

  // Click outside handler for mobile
  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 768px)").matches) return;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Desktop view
  if (category && !window.matchMedia("(max-width: 768px)").matches) {
    // Get unique product type names
    const uniqueProductTypes = Array.from(
      new Set(productTypes.map((item) => item.category_name))
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
        {/* If category is selected */}
        {category && (
          <>
            <h5 className="mb-3 px-3">{category} Collection</h5>
            {loading ? (
              <span className="text-muted px-3">Loading...</span>
            ) : productTypes.length > 0 ? (
              Array.from(new Set(productTypes.map((item) => item.category_name))).map((name, idx) => (
                <Link
                  key={idx}
                  to={`/shop/${currentCategory}/${name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="sidebar-category-item px-3"
                  onClick={() => onClose && onClose()}
                >
                  {name}
                </Link>
              ))
            ) : (
              <span className="text-muted px-3">No items found</span>
            )}
          </>
        )}

        {/* Show other categories */}
        <div className="sidebar-other-categories mt-4">
          <h6 className="mb-2 px-3">
            {category ? "Browse Other Categories" : "Browse Categories"}
          </h6>
          {categories.map((cat) => (
            <div
              key={cat.category_id}
              className={`sidebar-category-item px-3 py-2 ${
                cat.category_name.toLowerCase() === currentCategory ? "text-primary" : ""
              }`}
              onClick={() => onCategoryClick && onCategoryClick(cat.category_name)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter") onCategoryClick && onCategoryClick(cat.category_name);
              }}
            >
              {cat.category_name}
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return null;
}