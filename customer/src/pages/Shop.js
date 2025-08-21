import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import DataFile from "../assets/DataFile";
import '../styles/Shop.css';
import { CountryContext } from "../context/CountryContext";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function Shop() {
  const { category: currentCategory } = useParams();
  const [styles, setStyles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const navigate = useNavigate();

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!COMPANY_CODE) {
        setError('Company code not configured');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/customer/main-categories`, {
          params: { company_code: COMPANY_CODE }
        });
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch styles when category changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCategory) {
        setLoading(false);
        return;
      }

      if (!COMPANY_CODE) {
        setError('Company code not configured');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (categories.length === 0) {
          return;
        }

        const matchedCategory = categories.find(
          cat => cat.category_name.toLowerCase() === currentCategory.toLowerCase()
        );

        if (!matchedCategory) {
          setError(`Category "${currentCategory}" not found`);
          setLoading(false);
          return;
        }

        const stylesResponse = await axios.get(
          `${BASE_URL}/api/customer/styles-by-parent-category/${matchedCategory.category_id}`,
          {
            params: { company_code: COMPANY_CODE }
          }
        );
        setStyles(stylesResponse.data);

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

      if (!COMPANY_CODE) {
        setError('Company code not configured');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const stylesResponse = await axios.get(`${BASE_URL}/api/customer/all-styles`, {
          params: { company_code: COMPANY_CODE }
        });
        setStyles(stylesResponse.data);

      } catch (err) {
        console.error('Error fetching all styles:', err);
        setError('Failed to load styles');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStyles();
  }, [currentCategory, categories]);

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

   const formatPrice = (minPrice) => {
    if (!minPrice) return "Price not defined";
    const symbol = currencySymbols[country] || '$';
    const rate = getRate();
    const convertedPrice = (minPrice * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };

  
  if (loading) {
    return (
      <Container className="my-5">
        <div className="shop-loading-spinner">
          <div className="shop-spinner"></div>
          <p>Loading {currentCategory ? `${currentCategory} products` : 'products'}...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <div className="shop-error-message">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button 
            className="shop-btn btn-primary"
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
      {/* banner */}
      {currentCategory && (
        <div className="shop-banner mb-4">
          {DataFile.banner
            .filter((item) => item.category === currentCategory)
            .map((item) => (
              <img
                key={item.id}
                src={item.image}
                className="shop-banner-img"
                alt={`${currentCategory} banner`}
              />  
            ))}
        </div>
      )}
      
      {/* product grid */}
      <Container fluid className="my-5 shop-product-container">
        <h2 className="mb-4 text-capitalize">
          {currentCategory ? `${currentCategory} Collection` : 'All Products'}
        </h2>
        
        {styles.length > 0 ? (
          <div className="shop-products-grid">
            {styles.map((product) => (
              <div 
                key={product.style_id} 
                className="shop-product-card"
                onClick={() => getProductDetails(product.style_id)}
              >
                <div className="home-product-image-container">
                  <img 
                    src={`${BASE_URL}/uploads/styles/${product.image}`}
                    alt={product.name}
                    className="home-product-image"
                  />
                  
                  <div className="home-product-overlay">
                    <h5>Quick View</h5>
                  </div>
                </div>
                
                <div className="shop-product-info">
                  <h3 className="shop-product-name">{product.name}</h3>
                  <p className="shop-product-description">
                    {product.description && product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                  <div className="shop-product-price">
                     {product.offer_price && product.offer_price !== 0 ? (
                      <>
                        <span className="me-2">
                          {formatPrice(product.offer_price)}
                        </span>
                        <span className="text-muted text-decoration-line-through small">
                          {formatPrice(product.min_price)}
                        </span>
                      </>
                    ) : (
                      <span>{formatPrice(product.min_price)}</span>
                    )}
                  </div>
                  
                  {product.category_name && (
                    <div className="shop-product-category">
                      <span className="shop-category-badge">
                        {product.category_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="shop-no-products">
            <div className="shop-no-products-content">
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