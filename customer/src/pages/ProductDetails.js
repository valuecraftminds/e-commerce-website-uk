import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { FaShare } from "react-icons/fa";
import axios from "axios";

import CheckoutModal from "../components/CheckoutModal";
import { useCart } from "../context/CartContext";
import { CountryContext } from "../context/CountryContext";
import { useNotifyModal } from "../context/NotifyModalProvider";
import "../styles/ProductDetails.css"; 

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const styleId = parseInt(id, 10);
  const { addToCart } = useCart();
  const { showNotify } = useNotifyModal();

  // State for product data and loading
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);


  // State for user selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Single state for wishlist status
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // State for expandable sections
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  const getAxiosConfig = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const config = {
      params: { company_code: COMPANY_CODE }
    };

    if (token) {
      config.headers = {
        'Authorization': `Bearer ${token}`
      };
    }

    return config;
  };

  // Check if user is logged in
  const isUserLoggedIn = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
  };

  // Function to get available colors for selected size
  const getAvailableColors = () => {
    if (!selectedSize || !product.colors_by_size) {
      return product.available_colors || [];
    }
    return product.colors_by_size[selectedSize] || [];
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

  // Fetch product reviews
  const fetchProductReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await axios.get(`${BASE_URL}/api/customer/reviews/${styleId}`, {
        params: { company_code: COMPANY_CODE }
      });
      setReviews(response.data.reviews || []);
      setReviewStats(response.data.stats || { average: 0, total: 0 });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
      setReviewStats({ average: 0, total: 0 });
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch similar products
  const fetchSimilarProducts = async () => {
    try {
      setLoadingSimilar(true);
      const response = await axios.get(`${BASE_URL}/api/customer/similar-products/${styleId}`, {
        params: { company_code: COMPANY_CODE }
      });
      setSimilarProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch similar products:', error);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Fetch product details from backend
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/customer/product/${styleId}`, {
          params: { company_code: COMPANY_CODE }
        });
        setProduct(response.data);
        setError(null);
        
        // Fetch reviews for this product
        fetchProductReviews();
        
        // Fetch similar products - ADD THIS LINE
        fetchSimilarProducts();
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (styleId) {
      fetchProductDetails();
    }
  }, [styleId]);

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

  // Check wishlist status when product loads
  useEffect(() => {
    const checkWishlist = async () => {
      if (!isUserLoggedIn()) {
        setIsWishlisted(false);
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/api/customer/wishlist/check-wishlist`, {
          ...getAxiosConfig(),
          params: {
            company_code: COMPANY_CODE,
            style_id: product.style_id
          },
        });
        setIsWishlisted(res.data.in_wishlist);
        console.log("Wishlist status checked:", res.data.in_wishlist);
      } catch (err) {
        console.error("Error checking wishlist:", err);
        setIsWishlisted(false);
      }
    };

    if (product?.style_id) {
      checkWishlist();
    }
  }, [product?.style_id, COMPANY_CODE]);


  const formatPrice = (sale_price) => {
    if (!sale_price) return "Price not available";
    const symbol = currencySymbols[country] || '$';
    const rate = getRate();
    const convertedPrice = (sale_price * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };

  const handleAddToCart = async () => {
    try {
      const result = await addToCart({
        name: product.name,
        sku: product.sku,
        style_id: product.style_id,
        style_number: product.style_number,
        size: selectedSize,
        color: {
          code: selectedColor,
          name: selectedColorName,
        },
        image: product.image,
        quantity: quantity,
        sale_price: product.offer_price && product.offer_price !== "" 
                ? product.offer_price 
                : product.sale_price
      });

      showNotify({
        title: "Added to Cart",
        message: (
            <div>
              <div style={{ fontWeight: 'bold' }}>{product.name}</div>
              <div>Size: {selectedSize}</div>
              <div>Color: {selectedColorName}</div>
            </div>
        ),
      type: "success",
        customButtons: [
            {
                label: "Go to Cart",
                onClick: () => {
                    navigate('/cart');
                }
            },
            {
                label: "Continue Shopping",
                onClick: () => {
                  navigate('/');
                }
            }
            ]
      })
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotify({
        title: "Error",
        message: "Failed to add product to cart. Please try again.",
        type: "error",
        customButtons: [
            {
                label: "Ok",
                onClick: () => {}
            }
        ]
      })
    }
  };

  const handleBuyNow = (product) => {
    if (!isUserLoggedIn()) {
      showNotify({
        title: "Login Required",
        message: "Please log in to proceed with the purchase.",
        type: "warning",
        customButtons: [
            {
                label: "Login",
                onClick: () => {
                navigate('/login');
                }
            },
            {
                label: "Cancel",
                onClick: () => {
                setShowCheckoutModal(false);
                }
            }
            ]
      })
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleWishlistToggle = async (product) => {
    if (!isUserLoggedIn()) {
      showNotify({
        title: "Login Required",
        message: "Please log in to manage your wishlist.",
        type: "warning",
        customButtons: [
            {
                label: "Login",
                onClick: () => {
                navigate('/login');
                }
            },
            {
                label: "Cancel",
                onClick: () => {
                  showNotify(false);
                }
            }
            ]
      })
      return;
    }

    try {
      console.log("Toggling wishlist for:", product.style_id);
      if (isWishlisted) {
        // Remove from wishlist
        await axios.delete(
                `${BASE_URL}/api/customer/wishlist/remove`,
                {
                    ...getAxiosConfig(),
                    data: { style_id: product.style_id }
                }
        );
        setIsWishlisted(false);
        console.log("Removed from wishlist:", product.style_id);
      } else {
        // Add to wishlist
        await axios.post(
          `${BASE_URL}/api/customer/wishlist/set-wishlist`,
          {
            style_id: product.style_id,
            style_number: product.style_number,
            name: product.name,
            image: product.image
          },
          getAxiosConfig()
        );
        setIsWishlisted(true);
        console.log("Added to wishlist:", product.style_number);
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      showNotify({
        title: "Error",
        message: "Failed adding to wishlist. Please try again.",
        type: "error",
        customButtons: [
            {
                label: "Ok",
                onClick: () => {}
            }
        ]
      });
    }
  };

  const ShareBtn = (product) => {
    const productURL = `${window.location.origin}/product/${product.style_id}`;

    const handleShare = async () => {
      navigator.clipboard.writeText(productURL);
      console.log("Product link copied to clipboard");
      showNotify({
        title: "Link Copied",
        message: "Product link has been copied to clipboard.",
        type: "success"
      });
    }
    handleShare();
   };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''}`}
        >
          ★
        </span>
      );
    }
    return <div className="stars-container">{stars}</div>;
  };

  // Loading state
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <h3>Loading product details...</h3>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="my-5 text-center">
        <h2>Error</h2>
        <p>{error}</p>
      </Container>
    );
  }

  // Product not found
  if (!product) {
    return (
      <Container className="my-5 text-center">
        <h2>Product not found</h2>
      </Container>
    );
  }

  return (
    <div className="product-page">
      <Container fluid className="my-5 product-page-container">
        {/* Three Column Layout */}
        <Row className="main-product-row">
          {/* Column 1: Product Image */}
          <Col lg={4} md={12} className="product-image-col">
            <div className="product-image-container">
              <Image 
                className="main-product-image" 
                src={`${BASE_URL}/uploads/styles/${product.image}`}
                alt={product.name} 
                fluid 
              />
            </div>
          </Col>

          {/* Column 2: Product Description & Details */}
          <Col lg={4} md={6} className="product-details-col">
            <div className="product-details">
              <button
                className="wishlist-btn position-absolute"
                style={{ top: "10px", right: "10px" }}
                onClick={() => handleWishlistToggle(product)}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {isWishlisted ? (
                  <GoHeartFill size={30} color="red" />
                ) : (
                  <GoHeart size={30} color="black" />
                )}
              </button>

                <button
                  className="share-btn position-absolute"
                  style={{ top: "10px", right: "50px" }}
                  onClick={() => ShareBtn(product)}
                  title="Copy link to the product"
                >
                  <FaShare size={26} color="black" />
                </button>

              <h1 className="product-name-h1">{product.name}</h1>
              <p className="product-description">{product.description}</p>
              
              {/* Rating Display */}
              {reviewStats.total > 0 && (
                <div className="product-rating mb-3">
                  {renderStars(Math.round(reviewStats.average))}
                  <span className="rating-text">
                    {reviewStats.average.toFixed(1)} ({reviewStats.total} reviews)
                  </span>
                </div>
              )}

              <h5 className="price">
                {product.offer_price && product.offer_price !== 0 ? (
                  <>
                    <span className="me-2 offer-price">
                      {formatPrice(product.offer_price)}
                    </span>
                    <span className="text-muted text-decoration-line-through small">
                      {formatPrice(product.sale_price)}
                    </span>
                  </>
                ) : (
                  <span>{formatPrice(product.sale_price)}</span>
                )}
              </h5>

              <div className="mb-3">
                <div className="mb-3">
                <h4>Select Size:</h4>
                {product.all_sizes && product.all_sizes.length > 0 ? (
                  product.all_sizes.map((sizeObj) => (
                    <button
                      key={sizeObj.size_id}
                      onClick={() => {
                        if (sizeObj.available) {
                          setSelectedSize(sizeObj.size_name);
                          setSelectedColor('');
                          setSelectedColorName('');
                        }
                      }}
                      disabled={!sizeObj.available}
                      className={`me-2 mb-2 btn-size ${
                        selectedSize === sizeObj.size_name ? 'selected' : ''
                      } ${!sizeObj.available ? 'unavailable' : ''}`}
                      title={sizeObj.available ? `Select ${sizeObj.size_name}` : `${sizeObj.size_name} - Not available`}
                    >
                      {sizeObj.size_name}
                    </button>
                  ))
                ) : (
                  <h5>Sizes not available</h5>
                )}
              </div>

                {/* Color selection */}
                <div className="mb-3">
                  <h4>Select Color:</h4>
                  {selectedSize ? (
                    getAvailableColors().length > 0 ? (
                      getAvailableColors().map((color) => (
                        <button
                          key={color.code}
                          onClick={() => {
                            setSelectedColor(color.code);
                            setSelectedColorName(color.name);
                          }}
                          className={`color-circle ${selectedColor === color.code ? 'selected' : ''}`}
                          style={{ backgroundColor: color.code }}
                          title={color.name}
                        />
                      ))
                    ) : (
                      <p>No colors available for this size</p>
                    )
                  ) : (
                    <h6>Please select a size first</h6>
                  )}
                </div>
              </div>
              
              <div className="mb-3">
                <h5>Quantity:</h5>
                <input
                  type="number"
                  min="1"
                  className="form-control w-25 input-product-quantity"
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  value={quantity}
                />
              </div>

              <div className="btns">
                <Button 
                  className="btn-custom-primary me-2" 
                  disabled={!selectedSize || !selectedColor || quantity < 1} 
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
                <Button 
                  className="btn-custom-primary" 
                  disabled={!selectedSize || !selectedColor || quantity < 1} 
                  onClick={() => handleBuyNow(product)}
                >
                  Buy Now
                </Button>
              </div>

              {/* Size Guide Section */}
              <div className="expandable-section size-guide">
                <div 
                  className="section-header"
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                >
                  <h5>Size Guide</h5>
                  <span className="toggle-icon">
                    {showSizeGuide ? '−' : '+'}
                  </span>
                </div>
                {showSizeGuide && (
                  <div className="section-content">
                    <div className="size-guide-image">
                      <img 
                        src={`${BASE_URL}/uploads/size-chart.png`}
                        alt="Size Guide Chart" 
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/500x300/f8f9fa/6c757d?text=Size+Chart+Coming+Soon';
                        }}
                      />
                      <p className="size-guide-instructions">
                        <strong>How to measure:</strong> For the most accurate fit, measure your body wearing only undergarments. Keep the measuring tape level and snug but not tight.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Material Section */}
              <div className="expandable-section material">
                <div 
                  className="section-header"
                  onClick={() => setShowMaterial(!showMaterial)}
                >
                  <h5>Material </h5>
                  <span className="toggle-icon">
                    {showMaterial ? '−' : '+'}
                  </span>
                </div>
                {showMaterial && (
                  <div className="section-content">
                    <div className="material-info">
                      <div className="material-composition">
                        <ul>
                          <li className="material-name">{product?.material?.material_name || 'Material details will be available soon'}</li>
                          {product?.material?.material_description && (
                            <li className="material-description">{product.material.material_description}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* Column 3: Reviews */}
          <Col lg={4} md={6} className="reviews-col">

            <div className="reviews-section">
              <h2 className="reviews-title">Customer Reviews</h2>
              
              {/* Review Summary */}
              {reviewStats.total > 0 && (
                <div className="review-summary">
                  <div className="average-rating">
                    <span className="rating-number">{reviewStats.average.toFixed(1)}</span>
                    {renderStars(Math.round(reviewStats.average))}
                    <span className="total-reviews">Based on {reviewStats.total} reviews</span>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="reviews-list">
                {loadingReviews ? (
                  <div className="text-center py-3">
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-name">{review.user_name || 'Anonymous'}</div>
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <div className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                      <div className="review-comment">{review.comment}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p>No reviews yet for this product.</p>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      
      {/* Spacer to prevent overlap when expandable sections are open */}
      <div className="layout-spacer"></div>
      
      {/* Similar Products Section */}
    <Container fluid className="similar-products-container">
      <h2 className="mb-4">You May Also Like</h2>

      {loadingSimilar ? (
        <div className="text-center my-5">
          <div className="home-loading-spinner">
            <div className="home-spinner"></div>
            <p>Loading similar products...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center my-5">
          <h5 className="text-danger">Failed to load similar products</h5>
        </div>
      ) : similarProducts.length === 0 ? (
        <div className="home-no-products">
          <div className="home-no-products-content">
            <i className="fas fa-search fa-3x"></i>
            <h3>No similar products found</h3>
            <p>No similar products available at the moment.</p>
          </div>
        </div>
      ) : (
        <div className="home-products-grid">
          {similarProducts.map((similarProduct) => (
            <div
              key={similarProduct.style_id}
              className="home-product-card"
              onClick={() => navigate(`/product/${similarProduct.style_id}`)}
            >
              <div className="home-product-image-container">
                <img
                  src={`${BASE_URL}/uploads/styles/${similarProduct.image}`}
                  alt={similarProduct.name}
                  className="home-product-image"
                />

                <div className="home-product-overlay">
                  <h5>Quick View</h5>
                </div>
              </div>

              <div className="home-product-info">
                <h3 className="home-product-name">{similarProduct.name}</h3>
                <p className="home-product-description">
                  {similarProduct.description && similarProduct.description.length > 100
                    ? `${similarProduct.description.substring(0, 100)}...`
                    : similarProduct.description
                  }
                </p>
                    <div className="home-product-price">
                      {similarProduct.offer_price && similarProduct.offer_price !== 0 ? (
                        <>
                          <span className="me-2">
                        {formatPrice(similarProduct.offer_price)}
                      </span>
                      <span className="text-muted text-decoration-line-through small">
                        {formatPrice(similarProduct.sale_price)}
                      </span>
                    </>
                  ) : (
                    <span>{formatPrice(similarProduct.sale_price)}</span>
                  )}
                </div>
                {similarProduct.category_name && (
                  <div className="home-product-category">
                    <span className="home-category-badge">
                      {similarProduct.category_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>

      <CheckoutModal
        show={showCheckoutModal}
        value={product}
        onHide={() => setShowCheckoutModal(false)}
        isDirectBuy={true}
        onSubmit={(data) => {
          console.log('Checkout data:', data);
          setShowCheckoutModal(false);
        }}
      />
    </div>
  );
}