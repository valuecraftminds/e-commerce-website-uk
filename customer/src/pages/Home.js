import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import DataFile from "../assets/DataFile";
import { CountryContext } from "../context/CountryContext";
import "../styles/Home.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [offerProducts, setOfferProducts] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(7);


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
        console.log('Fetched products:', response.data);
      } catch (error) {
        console.error('Error fetching product listings:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

// fetch items with offer_price
  useEffect(() => {
    const fetchOfferProducts = async () => {
      try {
        setOfferLoading(true);
        setOfferError(null);

        const response = await axios.get(`${BASE_URL}/api/customer/offers`, {
          params: {company_code: COMPANY_CODE}
        });

        setOfferProducts(response.data);
      } catch (error) {
        console.error('Error fetching offer products:', error);
        setOfferError('Failed to load offer products');
      } finally{
        setOfferLoading(false);
      }
    };
    fetchOfferProducts();
  }, []);

   const displayedProducts = offerProducts.slice(0, displayLimit);

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

        {/* Offer Products Section */}
        <Container fluid className="my-5 homepage-offer-products-container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="offer-section-title">
              <i className="fas fa-fire text-danger me-2"></i>
              Hot Deals & Offers
            </h2>
            <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  navigate('/offers');
                }}
            >
              View All Offers <i className="fas fa-arrow-right ms-1"></i>
            </button>
          </div>

          {offerLoading ? (
              <div className="text-center my-3">
                <div className="offer-loading-spinner">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading offers...</span>
                  </div>
                  <p className="mt-2">Loading hot deals...</p>
                </div>
              </div>
          ) : offerError ? (
              <div className="text-center my-3">
                <h6 className="text-danger">{offerError}</h6>
              </div>
          ) : offerProducts.length === 0 ? (
              <div className="text-center my-3">
                <i className="fas fa-tag fa-2x text-muted"></i>
                <p className="text-muted mt-2">No special offers available right now.</p>
              </div>
          ) : (
              <div className="offer-products-grid">
                {displayedProducts.map((product) => (
                    <div
                        key={product.style_id}
                        className="offer-product-card"
                        onClick={() => getProductDetails(product.style_id)}
                    >
                      <div className="offer-product-image-container">
                        {/* Discount Badge */}
                        <div className="discount-badge">
                          {product.discount_percentage > 0 && (
                              <span className="discount-percentage">
                                -{product.discount_percentage}%
                              </span>
                          )}
                        </div>

                        <img
                            src={`${BASE_URL}/uploads/styles/${product.image}`}
                            alt={product.name}
                            className="offer-product-image"
                        />
                      </div>

                      <div className="offer-product-info">
                        <h4 className="offer-product-name">{product.name}</h4>
                        <p className="home-product-description">
                          {product.description && product.description.length > 100
                              ? `${product.description.substring(0, 100)}...`
                              : product.description
                          }
                        </p>
                        <div className="offer-product-price">
                  <span className="current-price">
                    {formatPrice(product.offer_price)}
                  </span>
                          <span className="original-price">
                    {formatPrice(product.price)}
                  </span>
                        </div>

                        {product.category_name && (
                            <div className="offer-product-category">
                    <span className="offer-category-badge">
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

        {/* Main Products Section */}
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
                            src={`${BASE_URL}/uploads/styles/${product.image}`}
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