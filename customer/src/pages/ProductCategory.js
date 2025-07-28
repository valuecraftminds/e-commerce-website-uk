import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../styles/ProductCategory.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProductCategory = () => {
  const { category, productType } = useParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setCategoryInfo] = useState(null);

  // Format display names
  const formatDisplayName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const categoryDisplay = formatDisplayName(category);
  const productTypeDisplay = formatDisplayName(productType);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get all categories to find the main category ID
        const categoriesResponse = await axios.get(`${BASE_URL}/customer/main-categories`);
        const mainCategories = categoriesResponse.data;
        
        // Find the matching main category
        const matchedMainCategory = mainCategories.find(
          cat => cat.category_name.toLowerCase() === category.toLowerCase()
        );

        if (!matchedMainCategory) {
          setError('Category not found');
          setLoading(false);
          return;
        }

        setCategoryInfo(matchedMainCategory);

        // Get product types (subcategories) for this main category
        const productTypesResponse = await axios.get(
          `${BASE_URL}/customer/product-types/${matchedMainCategory.category_id}`
        );
        const productTypes = productTypesResponse.data;

        // Find the matching product type
        const matchedProductType = productTypes.find(
          type => type.category_name.toLowerCase().replace(/\s+/g, '-') === productType.toLowerCase()
        );

        if (!matchedProductType) {
          setError('Product type not found');
          setLoading(false);
          return;
        }

        // fetch styles from the specific subcategory
        const stylesResponse = await axios.get(
          `${BASE_URL}/customer/styles-by-parent-category/${matchedMainCategory.category_id}`
        );

        // Filter styles to only include those from the specific product type
        const filteredStyles = stylesResponse.data.filter(
          style => style.category_id === matchedProductType.category_id
        );

        setProducts(filteredStyles);
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    if (category && productType) {
      fetchProducts();
    }
  }, [category, productType]);

  const handleProductClick = (product) => {
    // Navigate to individual product
    navigate(`/product/${product.style_id}`);
  };

  const handleBackToCategory = () => {
    navigate(`/shop/${category}`);
  };

  if (loading) {
    return (
      <div className="product-category-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-category-page">
        <div className="container">
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
        </div>
      </div>
    );
  }

  return (
    <div className="product-category-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav">
          <span 
            className="breadcrumb-item clickable"
            onClick={() => navigate('/shop')}
          >
            Shop
          </span>
          <span className="breadcrumb-separator">/</span>
          <span 
            className="breadcrumb-item clickable"
            onClick={handleBackToCategory}
          >
            {categoryDisplay}
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item current">
            {productTypeDisplay}
          </span>
        </nav>

        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            {categoryDisplay} - {productTypeDisplay}
          </h1>
          <p className="page-subtitle">
            {products.length} {products.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        {/* Filter and Sort Options */}
        <div className="filter-sort-bar">
          <div className="filter-options">
            <select className="form-select filter-select">
              <option value="">Filter by Price</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
            <select className="form-select filter-select">
              <option value="">Filter by Size</option>
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
          {/* <div className="view-options">
            <button className="view-btn active" data-view="grid">
              <i className="fas fa-th"></i>
            </button>
            <button className="view-btn" data-view="list">
              <i className="fas fa-list"></i>
            </button>
          </div> */}
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.style_id} 
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-image-container">
                  <img 
                    src={product.image || '/api/placeholder/300/400'} 
                    alt={product.name}
                    className="product-image"
                  />
                  
                  <div className="product-overlay">
                    <button className="quick-view-btn">
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
                    {product.min_price && product.max_price ? (
                      product.min_price === product.max_price ? (
                        <span className="current-price">
                          ${product.min_price}
                        </span>
                      ) : (
                        <span className="price-range">
                          ${product.min_price} - ${product.max_price}
                        </span>
                      )
                    ) : (
                      <span className="current-price">
                        Price on request
                      </span>
                    )}
                  </div>
                  
                  <div className="product-category">
                    <span className="category-badge">
                      {product.category_name}
                    </span>
                  </div>
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
                We couldn't find any {productTypeDisplay.toLowerCase()} in the {categoryDisplay.toLowerCase()} category.
              </p>
            </div>
          </div>
        )}

        {/* Load More Button  */}
        {products.length > 0 && products.length % 12 === 0 && (
          <div className="load-more-container">
            <button className="btn btn-outline-primary load-more-btn">
              Load More Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategory;