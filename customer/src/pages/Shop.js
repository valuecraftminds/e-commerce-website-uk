import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import axios from "axios";

import "../styles/Shop.css";
import DataFile from "../assets/DataFile";

const BASEURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Shop() {
  const { category: currentCategory } = useParams(); // Get category from URL
  const [styles, setStyles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASEURL}/customer/main-categories`);
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch styles and product types when category changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCategory) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // If categories are not loaded yet, wait for them
        if (categories.length === 0) {
          return;
        }

        // Find the category ID based on the current category name
        const matchedCategory = categories.find(
          cat => cat.category_name.toLowerCase() === currentCategory.toLowerCase()
        );

        if (!matchedCategory) {
          setError(`Category "${currentCategory}" not found`);
          setLoading(false);
          return;
        }

        // Fetch styles filtered by parent category
        const stylesResponse = await axios.get(
          `${BASEURL}/customer/styles-by-parent-category/${matchedCategory.category_id}`
        );
        setStyles(stylesResponse.data);

        // Fetch product types (subcategories) for this category
        const typesResponse = await axios.get(
          `${BASEURL}/customer/product-types/${matchedCategory.category_id}`
        );
        setProductTypes(typesResponse.data);

      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load styles');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCategory, categories]);

  // Handle case where no category is specified
  useEffect(() => {
    const fetchAllStyles = async () => {
      if (currentCategory || categories.length === 0) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all styles if no category is specified
        const stylesResponse = await axios.get(`${BASEURL}/customer/all-styles`);
        setStyles(stylesResponse.data);

        // Clear product types since we're showing all styles
        setProductTypes([]);

      } catch (err) {
        console.error('Error fetching all styles:', err);
        setError('Failed to load styles');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStyles();
  }, [currentCategory, categories]);

  // Helper function to format price display
  const formatPrice = (minPrice, maxPrice) => {
    if (!minPrice && !maxPrice) return "Price on request";
    if (minPrice === maxPrice) return `$${minPrice}`;
    return `$${minPrice} - $${maxPrice}`;
  };

  const handleQuickView = (e, product) => {
    e.stopPropagation(); 
    console.log('Quick view:', product);
  };

  // Loading state
  if (loading) {
    return (
      <Container className="my-5">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading {currentCategory ? `${currentCategory} products` : 'products'}...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="my-5">
        <div className="error-message">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/shop')}
          >
            Back to Shop
          </button>
        </div>
      </Container>
    );
  }

  return (
    <>
      {/* Banner Section */}
      {currentCategory && (
        <div className="banner mb-4">
          {DataFile.banner
            .filter((item) => item.category === currentCategory)
            .map((item) => (
              <img
                key={item.id}
                src={item.image}
                className="banner-img"
                alt={`${currentCategory} banner`}
              />
            ))}
        </div>
      )}

      <Container className="my-5">
        {/* Products Section */}
        <h2 className="mb-4 text-capitalize">
          {currentCategory ? `${currentCategory} Collection` : 'All Products'}
        </h2>
        
        {/* Display styles */}
        {styles.length > 0 ? (
          <div className="products-grid">
            {styles.map((product) => (
              <div 
                key={product.style_id} 
                className="product-card"
                onClick={() => getProductDetails(product.style_id)}
              >
                <div className="product-image-container">
                  <img 
                    src={product.image || '/placeholder-image.jpg'} 
                    alt={product.name}
                    className="product-image"
                  />
                  
                  <div className="product-overlay">
                    <button 
                      className="quick-view-btn"
                      onClick={(e) => handleQuickView(e, product)}
                    >
                      Quick View
                    </button>
                  </div>
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">
                    {product.description && product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                  <div className="product-price">
                    <span className={product.min_price && product.max_price && product.min_price !== product.max_price ? "price-range" : "current-price"}>
                      {formatPrice(product.min_price, product.max_price)}
                    </span>
                  </div>
                  
                  {product.variant_count && (
                    <div className="product-variants">
                      <span className="variants-label">
                        {product.variant_count} variant{product.variant_count !== 1 ? 's' : ''} available
                      </span>
                    </div>
                  )}
                  
                  {product.category_name && (
                    <div className="product-category">
                      <span className="category-badge">
                        {product.category_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <div className="no-products-content">
              <i className="fas fa-search fa-3x"></i>
              <h3>No products found</h3>
              <p>
                No products found
                {currentCategory ? ` in ${currentCategory} category` : ''}.
              </p>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}