import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { CountryContext } from "../context/CountryContext";
import StarRating from "../components/StarRating";
import BackToTop from "../components/BackToTop";

import "../styles/OfferPage.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function OfferPage() {
  const navigate = useNavigate();
  const [exchangeRates, setExchangeRates] = useState({});
  const [offerProducts, setOfferProducts] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());


  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  const getProductDetails = (styleNumber) => {
    navigate(`/product/${styleNumber}`);
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
        <Container fluid className="my-5 offer-products-container">
          <h2 className="offer-section-title">
              <i className="fas fa-fire text-danger me-2"></i>
              Hot Deals & Offers 🔥
            </h2>

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
                {offerProducts.map((product) => {
                  const timeLeft = calculateTimeLeft(product.offer_end_date);
                  
                  return (
                    <div
                        key={product.style_id}
                        className="offer-product-card"
                        onClick={() => getProductDetails(product.style_number)}
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

                        {/* Countdown Timer */}
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
          )}
        </Container>

        <BackToTop />
     </>
  );
}