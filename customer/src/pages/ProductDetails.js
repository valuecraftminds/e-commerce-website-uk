import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Image, Button, Modal } from "react-bootstrap";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { FaShare } from "react-icons/fa";
import axios from "axios";

import CheckoutModal from "../components/CheckoutModal";
import SizeGuideModal from "../components/SizeGuideModal";
import StarRating from "../components/StarRating";
import { useCart } from "../context/CartContext";
import { CountryContext } from "../context/CountryContext";
import { useNotifyModal } from "../context/NotifyModalProvider";
import MeasureGuideModal from "../components/MeasureGuideModal";
import "../styles/ProductDetails.css"; 

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function ProductDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { style_number } = useParams();
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
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);
  const [stockStatus, setStockStatus] = useState(null);
  const [, setStockError] = useState(null);
  const [, setCheckingStock] = useState(false);
  // Modal state for How to Measure
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  const [measureGuides, setMeasureGuides] = useState([]);
  const [loadingMeasureGuides, setLoadingMeasureGuides] = useState(false);

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

 // Function to get variant info based on selected color and size
  const getVariantInfo = useCallback(async (colorCode, sizeName) => {
    if (!colorCode || !sizeName || !product.style_number) {
      return null;
    }

    try {
      setCheckingStock(true);
      setStockError(null);
      
      // Get available colors for the selected size
      const availableColors = (!selectedSize || !product.colors_by_size) 
        ? (product.available_colors || [])
        : (product.colors_by_size[selectedSize] || []);
      
      // Get color_id from the color code
      const selectedColorObj = availableColors.find(color => color.code === colorCode);
      if (!selectedColorObj?.color_id) return null;
      
      // Get size_id from the size name
      const selectedSizeObj = product.all_sizes?.find(size => size.size_name === sizeName);
      if (!selectedSizeObj?.size_id) return null;

      const response = await axios.get(`${BASE_URL}/api/customer/variant-info`, {
        params: {
          company_code: COMPANY_CODE,
          style_number: product.style_number,
          color_id: selectedColorObj.color_id,
          size_id: selectedSizeObj.size_id
        }
      });

      const variantData = response.data;
      console.log('Variant info response:', variantData);
      
      // Check if variantData exists and has stock_qty property
      if (!variantData || variantData.stock_qty === undefined || variantData.stock_qty === null) {
        setStockStatus('error');
        setStockError('This item is currently out of stock');
        return null;
      }
      
      // Check stock availability
      if (variantData.stock_qty <= 0) {
        setStockStatus('out_of_stock');
        setStockError('This item is currently out of stock');
      } else if (variantData.stock_qty < 5) {
        setStockStatus('low_stock');
        setStockError(`Only ${variantData.stock_qty} items left in stock`);
      } else {
        setStockStatus('in_stock');
        setStockError(null);
      }

      return variantData;
    } catch (error) {
      console.error('Error getting variant info:', error);
      setStockStatus('error');
      setStockError('Unable to check stock availability');
      return null;
    } finally {
      setCheckingStock(false);
    }
  }, [product, selectedSize]);

  // Fetch Measure Guide
  const fetchMeasureGuides = useCallback(async () => {
    try {
      setLoadingMeasureGuides(true);
      const response = await axios.get(`${BASE_URL}/api/customer/measure-guide/${style_number}`, {
        params: { company_code: COMPANY_CODE }
      });
      console.log('Measure guides response:', response.data);
      if (response.data.success) {
        setMeasureGuides(response.data.measure_guides || []);
      }
    } catch (error) {
      console.error('Failed to fetch measure guides:', error);
      setMeasureGuides([]);
    } finally {
      setLoadingMeasureGuides(false);
    }
  }, [style_number]);

  useEffect(() => {
    fetchMeasureGuides();
  }, [fetchMeasureGuides]);

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
  const fetchProductReviews = useCallback(async () => {
    if (!product?.style_id) return;
    
    try {
      setLoadingReviews(true);
      const response = await axios.get(`${BASE_URL}/api/customer/feedback/reviews/${product.style_id}`, {
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
  }, [product?.style_id]);

  // Fetch similar products
  const fetchSimilarProducts = useCallback(async () => {
    try {
      setLoadingSimilar(true);
      const response = await axios.get(`${BASE_URL}/api/customer/similar-products/${product?.style_id}`, {
        params: { company_code: COMPANY_CODE }
      });
      setSimilarProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch similar products:', error);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  }, [product?.style_id]);

  // Fetch product details from backend
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/customer/product/${style_number}`, {
          params: { company_code: COMPANY_CODE }
        });
        setProduct(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (style_number) {
      fetchProductDetails();
    }
  }, [style_number]);

  // Fetch reviews and similar products when product is loaded
  useEffect(() => {
    if (product?.style_id) {
      fetchProductReviews();
      fetchSimilarProducts();
    }
  }, [product?.style_id, fetchProductReviews, fetchSimilarProducts]);

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
      } catch (err) {
        console.error("Error checking wishlist:", err);
        setIsWishlisted(false);
      }
    };

    if (product?.style_id) {
      checkWishlist();
    }
  }, [product?.style_id]);

  // Update variant info when color or size changes
  useEffect(() => {
    const updateVariantInfo = async () => {
      if (selectedColor && selectedSize && product) {
        const variant = await getVariantInfo(selectedColor, selectedSize);
        setSelectedVariant(variant);
        
        // Reset quantity to 1 when variant changes, but check if current quantity exceeds new stock
        if (variant?.stock_qty) {
          setQuantity(prevQuantity => Math.min(prevQuantity, variant.stock_qty));
        }
      } else {
        setSelectedVariant(null);
        setQuantity(1); // Reset to 1 when no variant is selected
      }
    };

    updateVariantInfo();
  }, [selectedColor, selectedSize, product, getVariantInfo]);


  const formatPrice = (sale_price) => {
    if (!sale_price) return "Price not available";
    const symbol = currencySymbols[country] || '$';
    const rate = getRate();
    const convertedPrice = (sale_price * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };

  // put near other utils
  const isActiveOffer = (price, startsAt, endsAt) => {
    if (!price || Number(price) <= 0) return false;
    const now = new Date();
    // if your API doesn’t send dates, these checks safely pass
    const startsOk = !startsAt || new Date(startsAt) <= now;
    const endsOk = !endsAt || now <= new Date(endsAt);
    return startsOk && endsOk;
  };

  const getVariantOffer = (v) => ({
    offerPrice: v?.offer_price ?? null,
    startsAt: v?.offer_start_date || v?.offer_start || v?.offer_from || null,
    endsAt:   v?.offer_end_date || v?.offer_end || v?.offer_to || null,
  });

  

  // Function to get the current price based on variant selection
const getCurrentPrice = () => {
  if (selectedVariant) {
    const { offerPrice, startsAt, endsAt } = getVariantOffer(selectedVariant);
    const showOffer = isActiveOffer(offerPrice, startsAt, endsAt);
    return {
      salePrice: selectedVariant.sale_price || product.sale_price,
      offerPrice: showOffer ? offerPrice : null
    };
  }
  // No variant chosen yet → don’t show any offer
  return { salePrice: product.sale_price, offerPrice: null };
};


  const handleAddToCart = async () => {
    try {
      // Validate stock quantity before adding to cart
      if (selectedVariant && quantity > selectedVariant.stock_qty) {
        showNotify({
          title: "Insufficient Stock",
          message: `Only ${selectedVariant.stock_qty} items available in stock. Please reduce the quantity.`,
          type: "error",
          customButtons: [
            {
              label: "Ok",
              onClick: () => {}
            }
          ]
        });
        return;
      }

      // Use the SKU from the selected variant, fallback to product SKU
      const skuToUse = selectedVariant?.sku || product.sku;
      const { salePrice, offerPrice } = getCurrentPrice();
      
      await addToCart({
        name: product.name,
        sku: skuToUse,
        style_id: product.style_id,
        style_number: product.style_number,
        variant_id: selectedVariant?.variant_id,
        size: selectedSize,
        color: {
          code: selectedColor,
          name: selectedColorName,
        },
        image: product.image,
        quantity: quantity,
        sale_price: offerPrice || salePrice
      });
      showNotify({
        title: "Added to Cart",
        message: (
            <div>
              <div style={{ fontWeight: 'bold' }}>{product.name}</div>
              <div>Size: {selectedSize}</div>
              <div>Color: {selectedColorName}</div>
              {skuToUse && <div>SKU: {skuToUse}</div>}
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
                navigate('/login', { 
                  state: { from: location }
                });
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

    // Validate stock quantity before proceeding to checkout
    if (selectedVariant && quantity > selectedVariant.stock_qty) {
      showNotify({
        title: "Insufficient Stock",
        message: `Only ${selectedVariant.stock_qty} items available in stock. Please reduce the quantity.`,
        type: "error",
        customButtons: [
          {
            label: "Ok",
            onClick: () => {}
          }
        ]
      });
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
                navigate('/login', { 
                  state: { from: location }
                });
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
    const productURL = `${window.location.origin}/product/${product.style_number}`;

    const handleShare = async () => {
      navigator.clipboard.writeText(productURL);
      showNotify({
        title: "Link Copied",
        message: "Product link has been copied to clipboard.",
        type: "success"
      });
    }
    handleShare();
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
                  <StarRating rating={Math.round(reviewStats.average)} size="medium" />
                  <span className="rating-text">
                    {reviewStats.average.toFixed(1)} ({reviewStats.total} reviews)
                  </span>
                </div>
              )}

              <h5 className="price">
                {(() => {
                  const { salePrice, offerPrice } = getCurrentPrice();
                  return offerPrice ? (
                    <>
                      <span className="me-2 offer-price">
                        {formatPrice(offerPrice)}
                      </span>
                      <span className="text-muted text-decoration-line-through small">
                        {formatPrice(salePrice)}
                      </span>
                    </>
                  ) : (
                    <span>{formatPrice(salePrice)}</span>
                  );
                })()}
              </h5>

              <div className="mb-3">
                <div className="mb-3">
                  <h4>Select Size:</h4>
                  {product.all_sizes && product.all_sizes.length > 0 ? (
                    product.all_sizes
                      .filter(sizeObj => (product.available_sizes || []).includes(sizeObj.size_name))
                      .map((sizeObj) => (
                        <button
                          key={sizeObj.size_id}
                          onClick={() => {
                            setSelectedSize(sizeObj.size_name);
                            setSelectedColor('');
                            setSelectedColorName('');
                            setSelectedVariant(null);
                          }}
                          className={`me-2 mb-2 btn-size ${
                            selectedSize === sizeObj.size_name ? 'selected' : ''
                          }`}
                          title={`Select ${sizeObj.size_name}`}
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
              {selectedVariant && selectedVariant.stock_qty === 0 && (
                <div className="mb-3 stock-status">
                  <div className="alert alert-danger py-2">
                    Out of stock
                  </div>
                </div>
              )}
              {selectedVariant && selectedVariant.stock_qty > 0 && selectedVariant.stock_qty < 6 && (
                <div className="mb-3 stock-status">
                  <div className="alert alert-warning py-2">
                    Only available {selectedVariant.stock_qty} items
                  </div>
                </div>
              )}
              <div className="mb-3">
                <h5>Quantity:</h5>
                <input
                  type="number"
                  min="1"
                  max={selectedVariant?.stock_qty}
                  className="form-control w-25 input-product-quantity"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;

                    // Allow empty string while typing
                    if (val === "") {
                      setQuantity("");
                      return;
                    }

                    const num = parseInt(val, 10);
                    const maxStock = selectedVariant?.stock_qty;

                    // If user types less than 1, force it to 1
                    if (isNaN(num) || num < 1) {
                      setQuantity(1);
                    } else if (num > maxStock) {
                      // If user tries to enter more than available stock, limit to stock quantity
                      setQuantity(maxStock);
                    } else {
                      setQuantity(num);
                    }
                  }}
                  onBlur={(e) => {
                    // If left empty, reset to 1 on blur
                    if (e.target.value === "") {
                      setQuantity(1);
                    }
                  }}
                />
              </div>

              <div className="btns">
                <Button 
                  className="btn-custom-primary me-2" 
                  disabled={!selectedSize || !selectedColor || quantity < 1 || (selectedVariant && quantity > selectedVariant.stock_qty) || stockStatus === 'out_of_stock'} 
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
                <Button 
                  className="btn-custom-primary" 
                  disabled={!selectedSize || !selectedColor || quantity < 1 || (selectedVariant && quantity > selectedVariant.stock_qty) || stockStatus === 'out_of_stock'} 
                  onClick={() => handleBuyNow(product)}
                >
                  Buy Now
                </Button>
              </div>

              {/* Material and Size Guide with Tooltips */}
              <div className="product-info-tooltips mt-3">
                <div className="tooltip-container">
                  <span className="info-link material-link">
                    Material
                  </span>
                  <div className="tooltip-content material-tooltip">
                    <div className="tooltip-arrow"></div>
                    <div className="material-info">
                      <p>{product?.material?.material_name || 'Material details will be available soon'}</p>
                      {product?.material?.material_description && (
                        <p className="material-description">{product.material.material_description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <span className="separator">|</span>

                <div className="tooltip-container">
                  <span 
                    className="info-link size-guide-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowSizeGuideModal(true)}
                  >
                    Size Guide
                  </span>
                </div>

                <span className="separator">|</span>

                <div className="tooltip-container">
                  <span 
                    className="info-link howtomeasure-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowMeasureModal(true)}
                  >
                    How To Measure
                  </span>
                </div>
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
                    <StarRating rating={Math.round(reviewStats.average)} size="large" />
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
                          <StarRating rating={review.rating} size="small" />
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
              onClick={() => navigate(`/product/${similarProduct.style_number}`)}
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
                
                {/* Rating Display */}
                {parseFloat(similarProduct.average_rating) > 0 && parseInt(similarProduct.review_count) > 0 && (
                  <div className="product-rating mb-2">
                    <StarRating rating={Math.round(parseFloat(similarProduct.average_rating))} size="medium" />
                    <span className="rating-text ms-2">
                      {parseFloat(similarProduct.average_rating).toFixed(1)} ({parseInt(similarProduct.review_count)} {parseInt(similarProduct.review_count) === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                
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
        value={product ? {
          ...product,
          price: (() => {
            const { salePrice, offerPrice } = getCurrentPrice();
            return offerPrice || salePrice;
          })(),
          variant_id: selectedVariant?.variant_id || product.style_id,
          id: product.style_id,
          quantity: quantity,
          sku: selectedVariant?.sku || product.sku,
          selectedSize,
          selectedColor,
          selectedColorName
        } : null}
        onHide={() => setShowCheckoutModal(false)}
        onSubmit={(data) => {
          setShowCheckoutModal(false);
        }}
        isDirectBuy={true}
      />

      {/* Size Guide Modal */}
      <SizeGuideModal
        show={showSizeGuideModal}
        onHide={() => setShowSizeGuideModal(false)}
        styleNumber={style_number}
      />

      {/* How to Measure Modal */}
      <MeasureGuideModal
        show={showMeasureModal}
        onHide={() => setShowMeasureModal(false)}
        measureGuides={measureGuides}
        loading={loadingMeasureGuides}
        baseUrl={BASE_URL}
      />

    </div>
  );
}