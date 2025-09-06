import axios from "axios";
import { useContext, useEffect, useState, useCallback } from "react";
import { Container } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaRegArrowAltCircleUp } from 'react-icons/fa';

import DataFile from "../assets/DataFile";
import { CountryContext } from "../context/CountryContext";
import StarRating from "../components/StarRating";
import "../styles/Home.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;
const PRODUCTS_PER_PAGE = 1; // Configurable page size

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [offerProducts, setOfferProducts] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState(null);
  const [displayLimit, ] = useState(7);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Banner state
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  // Initialize page from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  // Back to top visibility handler
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getProductDetails = (style_number) => {
    navigate(`/product/${style_number}`);
  };

  // Fetch products with pagination
  const fetchProducts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await axios.get(`${BASE_URL}/api/customer/all-styles`, {
        params: { 
          company_code: COMPANY_CODE,
          page: page,
          limit: PRODUCTS_PER_PAGE
        }
      });

      // Handle both new paginated response and old response format
      const responseData = response.data;
      let newProducts, total, hasMore;

      if (responseData.success && responseData.products) {
        // New paginated format
        newProducts = responseData.products;
        total = responseData.pagination.totalProducts;
        hasMore = responseData.pagination.hasMore;
      } else if (Array.isArray(responseData)) {
        // Old format - treat as first page only
        newProducts = responseData;
        total = responseData.length;
        hasMore = false;
      } else {
        // Fallback
        newProducts = responseData || [];
        total = newProducts.length;
        hasMore = false;
      }
      
      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      
      setTotalProducts(total);
      setHasMoreProducts(hasMore);

    } catch (error) {
      console.error('Error fetching product listings:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts(currentPage, false);
  }, [currentPage, fetchProducts]);

  // Fetch banners for home page
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setBannersLoading(true);
        console.log('Fetching home banners with COMPANY_CODE:', COMPANY_CODE);
        const response = await axios.get(`${BASE_URL}/api/customer/banners`, {
          params: {
            company_code: COMPANY_CODE,
            category: 'home' // Fetch banners for home category (where category_id IS NULL)
          }
        });
        
        console.log('Banner API response:', response.data);
        
        if (response.data.success) {
          console.log('Found banners:', response.data.banners);
          setBanners(response.data.banners);
        } else {
          console.log('API returned success: false');
          setBanners([]);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        setBanners([]); // Fall back to empty array
      } finally {
        setBannersLoading(false);
      }
    };

    if (COMPANY_CODE) {
      fetchBanners();
    } else {
      console.warn('COMPANY_CODE is not defined');
      setBannersLoading(false);
    }
  }, []);

  // Load more products
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // Update URL for SEO
    setSearchParams({ page: nextPage.toString() });
    
    fetchProducts(nextPage, true);
  };

  // Back to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // fetch items with offer_price
  useEffect(() => {
    const fetchOfferProducts = async () => {
      try {
        setOfferLoading(true);
        setOfferError(null);

        const response = await axios.get(`${BASE_URL}/api/customer/offers`, {
          params: {company_code: COMPANY_CODE}
        });

        // Group products by style_id and select the best offer (minimum offer_price)
        const groupedProducts = {};
        response.data.forEach(product => {
          const styleId = product.style_id;
          
          if (!groupedProducts[styleId]) {
            groupedProducts[styleId] = product;
          } else {
            // If current product has lower offer_price, replace it
            if (product.offer_price < groupedProducts[styleId].offer_price) {
              groupedProducts[styleId] = product;
            }
          }
        });

        // Convert back to array
        const uniqueProducts = Object.values(groupedProducts);
        setOfferProducts(uniqueProducts);
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

  // Utility function to calculate time left for a given end date
  const calculateTimeLeft = (endDate) => {
    const difference = new Date(endDate) - currentTime;

    if (difference <= 0) {
      return { expired: true };
    }

    return {
      expired: false,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  // Timer effect for real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  return (
    <>
      {/* Banner Section */}
      <div className="home-banner mb-4">
        {bannersLoading ? (
          <div className="home-banner-loading">
            <div className="home-banner-skeleton"></div>
          </div>
        ) : banners.length > 0 ? (
          <div className="home-banner-carousel">
            {banners.map((banner, index) => (
              <img
                key={banner.id}
                src={`${BASE_URL}/uploads/banners/${banner.image_url}`}
                className="home-banner-img"
                alt={banner.alt_text || `Home banner ${index + 1}`}
                style={{ display: index === 0 ? 'block' : 'none' }} // Show only first banner for now
              />
            ))}
          </div>
        ) : (
          <img
            src={DataFile.banner[3].image}
            className="home-banner-img"
            alt={`${DataFile.banner[3].category} banner`}
          />
        )}
      </div>

      {/* Offer Products Section */}
      {!offerLoading && !offerError && offerProducts.length > 0 && (
        <Container fluid className="my-5 homepage-offer-products-container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="homepage-offer-title-section">
              <h2 className="homepage-offer-title">
                <i className="fas fa-fire text-danger me-2 "></i>
                Hot Deals & Offers
              </h2>
              <p className="hp-offer-des">
                * Offer prices are valid only for selected size/color combinations.{" "}
              </p>
          </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                navigate('/offers');
              }}
            >
              View All Offers <i className="fas fa-arrow-right ms-1"></i>
            </button>
          </div>

          <div className="homepage-offer-products-grid">
            {displayedProducts.map((product) => {
              const timeLeft = calculateTimeLeft(product.offer_end_date);

              return (
                <div
                  key={product.style_id}
                  className="homepage-offer-product-card"
                  onClick={() => getProductDetails(product.style_number)}
                >
                  <div className="homepage-offer-product-image-container">
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
                        : product.description}
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

                    <div className="offer-product-price">
                      <span className="current-price">
                        {formatPrice(product.offer_price)}
                      </span>
                      <span className="original-price">
                        {formatPrice(product.sale_price)}
                      </span>
                    </div>

                    <div className="countdown-timer">
                      {timeLeft.expired ? (
                        <div className="countdown-label text-danger" style={{fontSize: '0.9rem' }}>Offer Ended</div>
                      ) : (
                        <>
                          <div className="countdown-display text-danger" style={{fontSize: '0.9rem' }}>
                            {timeLeft.days > 0 && (
                              <span className="time-unit">
                                <span className="time-value">{timeLeft.days}</span>
                                <span className="time-label">d </span>
                              </span>
                            )}
                            <span className="time-unit">
                              <span className="time-value">
                                {timeLeft.hours.toString().padStart(2, "0")}
                              </span>
                              <span className="time-label">h </span>
                            </span>
                            <span className="time-unit">
                              <span className="time-value">
                                {timeLeft.minutes.toString().padStart(2, "0")}
                              </span>
                              <span className="time-label">m </span>
                            </span>
                            <span className="time-unit">
                              <span className="time-value">
                                {timeLeft.seconds.toString().padStart(2, "0")}
                              </span>
                              <span className="time-label">s </span>
                            </span>
                          </div>
                        </>
                      )}
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
              );
            })}
          </div>
        </Container>
      )}

    {/* Sticky Filter Bar */}
      {/* <div className="sticky-filter-bar">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center">
            <div className="sticky-bar-filter-info">
              <span className="sticky-bar-text text-muted">
                {totalProducts > 0 && `Showing ${products.length} of ${totalProducts} products`}
              </span>
            </div>
          </div>
        </Container>
      </div> */}

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
          <>
            <div className="home-products-grid">
              {products.map((product) => (
                <div
                  key={product.style_id}
                  className="home-product-card"
                  onClick={() => getProductDetails(product.style_number)}
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
                    
                    {/* Rating Display */}
                    {parseFloat(product.average_rating) > 0 && parseInt(product.review_count) > 0 && (
                      <div className="product-rating mb-2">
                        <StarRating rating={Math.round(parseFloat(product.average_rating))} size="medium" />
                        <span className="rating-text ms-2">
                          {parseFloat(product.average_rating).toFixed(1)}({parseInt(product.review_count)})
                        </span>
                      </div>
                    )}
                    
                    <div className="home-product-price">
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
                        </>
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

            {/* Load More Section */}
            {hasMoreProducts && (
              <div className="text-center my-5">
                <button
                  className="btn btn-primary load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More Products
                      <i className="fas fa-chevron-down ms-2"></i>
                    </>
                  )}
                </button>
                <div className="mt-2 text-muted small">
                  Showing {products.length} of {totalProducts} products
                </div>
              </div>
            )}

            {/* End of results message */}
            {!hasMoreProducts && products.length > 0 && (
              <div className="text-center my-5">
                <div className="end-of-results">
                  <i className="fas fa-check-circle text-success fa-2x mb-2"></i>
                  <p className="text-muted">You've seen all our amazing products!</p>
                </div>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Back to Top Button */}
      {showBackToTop && (
          <FaRegArrowAltCircleUp className="back-to-top-btn" onClick={scrollToTop} aria-label="Back to top"/>
      )}
    </>
  );
}