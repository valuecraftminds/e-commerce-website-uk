import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import DataFile from "../assets/DataFile";
import "../styles/Home.css";
import { CountryContext } from "../context/CountryContext";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);
  
  const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

  // Fetch product listings from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/customer/all-styles`, {
          params: { company_code: COMPANY_CODE }
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching product listings:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
        // Set default rates if API fails
        setExchangeRates({
          GBP: 0.75,
          LKR: 320
        });
      }
    };
    fetchExchangeRates();
  }, []);

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

  return (
    <>
      {/* Banner Section */}
      <div className="home-banner mb-4">
        <img
          src={DataFile.banner[3].image}
          className="home-banner-img"
          alt={`${DataFile.banner[3].category} banner`}
        />
      </div>

      <Container fluid className="my-5 home-products-container">
        <h2 className="mb-4">Explore Your Fashion</h2>
        
        {loading ? (
          <div className="text-center my-5">
            <div className="home-loading-spinner">
              <div className="home-spinner"></div>
              <p>Loading products...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center my-5">
            <h5 className="text-danger">{error}</h5>
          </div>
        ) : products.length === 0 ? (
          <div className="home-no-products">
            <div className="home-no-products-content">
              <i className="fas fa-search fa-3x"></i>
              <h3>No products found</h3>
              <p>No products available at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="home-products-grid">
            {products.map((product) => (
              <div 
                key={product.style_id} 
                className="home-product-card"
                onClick={() => getProductDetails(product.style_id)}
              >
                <div className="home-product-image-container">
                  <img 
                    src={`${BASE_URL}/api/customer/styles/${product.image}`}
                    alt={product.name}
                    className="home-product-image"
                  />
                  
                  <div className="home-product-overlay">
                    <h5>Quick View</h5>
                  </div>
                </div>
                
                <div className="home-product-info">
                  <h3 className="home-product-name">{product.name}</h3>
                  <p className="home-product-description">
                    {product.description && product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                  <div className="home-product-price">
                    {/* <span>{formatPrice(product.min_price)}</span> */}
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
                    <div className="home-product-category">
                      <span className="home-category-badge">
                        {product.category_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}