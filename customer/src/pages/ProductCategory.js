import { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../styles/ProductCategory.css';
import { CountryContext } from "../context/CountryContext";
import StarRating from "../components/StarRating";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const ProductCategory = () => {
  const { category, productType } = useParams();
  const navigate = useNavigate();
  
  const [allProducts, setAllProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    priceSort: ''
  });

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  // Format display names
  const formatDisplayName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  const categoryDisplay = formatDisplayName(category);
  const productTypeDisplay = formatDisplayName(productType);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/customer/currency/rates`);
        if (response.data.success) {
          setExchangeRates(response.data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        setExchangeRates({
          GBP: 0.75,
          LKR: 320
        });
      }
    };
    fetchExchangeRates();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all categories to find the main category ID
        const categoriesResponse = await axios.get(`${BASE_URL}/api/customer/main-categories`, {
          params: { company_code: COMPANY_CODE }
        });

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

        // Get product types (subcategories) for this main category
        const productTypesResponse = await axios.get(
          `${BASE_URL}/api/customer/product-types/${matchedMainCategory.category_id}`,
          {
            params: { company_code: COMPANY_CODE }
          }
        );
        const productTypes = productTypesResponse.data.categories || [];

        // Find the matching product type
        const matchedProductType = productTypes.find(
          type => type.category_name.toLowerCase().replace(/\s+/g, '-') === productType.toLowerCase()
        );

        if (!matchedProductType) {
          setError('Product type not found');
          setLoading(false);
          return;
        }

        // Fetch styles from the specific subcategory
        const stylesResponse = await axios.get(
          `${BASE_URL}/api/customer/styles-by-parent-category/${matchedMainCategory.category_id}`,
          {
            params: { company_code: COMPANY_CODE }
          }
        );

        // Filter styles to only include those from the specific product type
        const filteredStyles = stylesResponse.data.filter(
          style => style.category_id === matchedProductType.category_id
        );

        setAllProducts(filteredStyles);
        
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

  const getRate = () => {
    switch (country) {
      case 'US':
        return 1;
      case 'UK':
        return exchangeRates['GBP'] || 0.75;
      case 'SL':
        return exchangeRates['LKR'] || 320;
      default:
        return 1;
    }
  };

  const formatPrice = (sale_price) => {
    if (!sale_price) return "Price not defined";
    const symbol = currencySymbols[country] || '$';
    const rate = getRate();
    const convertedPrice = (sale_price * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };

  // Apply filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allProducts];

    // Apply sorting
    switch (filters.priceSort) {
      case 'low-high':
        result.sort((a, b) => {
          const priceA = a.offer_price && a.offer_price !== 0 ? a.offer_price : (a.sale_price || 0);
          const priceB = b.offer_price && b.offer_price !== 0 ? b.offer_price : (b.sale_price || 0);
          return priceA - priceB;
        });
        break;
      case 'high-low':
        result.sort((a, b) => {
          const priceA = a.offer_price && a.offer_price !== 0 ? a.offer_price : (a.sale_price || 0);
          const priceB = b.offer_price && b.offer_price !== 0 ? b.offer_price : (b.sale_price || 0);
          return priceB - priceA;
        });
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceSort: ''
    });
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.style_number}`);
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
              className="btn btn-primary pcbtn"
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
            {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'item' : 'items'} found
            {allProducts.length !== filteredAndSortedProducts.length && (
              <span className="filtered-text"> (filtered from {allProducts.length})</span>
            )}
          </p>
        </div>

        {/* Filter and Sort Options */}
        <div className="filter-sort-bar">
          <div className="filter-options">
            {/* Sort Dropdown */}
            <select 
              className="form-select filter-select"
              value={filters.priceSort}
              onChange={(e) => handleFilterChange('priceSort', e.target.value)}
            >
              <option value="">Sort By</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>

            {/* Clear Filters Button */}
            {(filters.priceSort) && (
              <button 
                className="clear-filters-btn"
                onClick={clearAllFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results count for mobile */}
          <div className="results-count-mobile">
            {filteredAndSortedProducts.length} results
          </div>
        </div>

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="cat-products-grid">
            {filteredAndSortedProducts.map((product) => (
              <div 
                key={product.style_id} 
                className="cat-product-card"
                onClick={() => handleProductClick(product)}
              >
                <div className="cat-product-image-container">
                  <img 
                   src={`${BASE_URL}/uploads/styles/${product.image}`}
                    alt={product.name}
                    className="cat-product-image"
                  />
                  
                  <div className="cat-product-overlay">
                    <h5>Quick View</h5>
                  </div>
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="pc-product-description">
                    {product.description && product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                  
                  {/* Rating Display */}
                  {parseFloat(product.average_rating) > 0 && parseInt(product.review_count) > 0 && (
                    <div className="product-rating mb-2">
                      <StarRating rating={Math.round(parseFloat(product.average_rating))} size="medium" />
                       <span className="rating-text ms-2">
                        {parseFloat(product.average_rating).toFixed(1)}({parseInt(product.review_count)})
                      </span>
                    </div>
                  )}
                  
                  <div className="product-price">
                     {product.offer_price && product.offer_price !== 0 ? (
                      <>
                        <span className="me-2">
                          {formatPrice(product.offer_price)}
                        </span>
                        <span className="text-muted text-decoration-line-through small">
                          {formatPrice(product.sale_price)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{formatPrice(product.sale_price)}</span>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>
                          Starting from
                        </small>
                      </>
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

        {/* Load More Button */}
        {filteredAndSortedProducts.length > 0 && filteredAndSortedProducts.length % 12 === 0 && (
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