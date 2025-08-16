import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import { GoHeart, GoHeartFill } from "react-icons/go";
import axios from "axios";

import NotifyModal from "../components/NotifyModal";
import CheckoutModal from "../components/CheckoutModal";
import { useCart } from "../context/CartContext";
import { CountryContext } from "../context/CountryContext";
import "../styles/ProductDetails.css"; 

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const styleId = parseInt(id, 10);
  const { addToCart } = useCart();

  // State for product data and loading
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});

  // State for user selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Single state for wishlist status
  const [isWishlisted, setIsWishlisted] = useState(false);

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
            style_code: product.style_code
          },
        });
        setIsWishlisted(res.data.in_wishlist);
        console.log("Wishlist status checked:", res.data.in_wishlist);
      } catch (err) {
        console.error("Error checking wishlist:", err);
        setIsWishlisted(false);
      }
    };

    if (product?.style_code) {
      checkWishlist();
    }
  }, [product?.style_code, COMPANY_CODE]);

  const formatPrice = (price) => {
    if (!price) return "Price not available";
    const symbol = currencySymbols[country] || '$';
    const rate = getRate();
    const convertedPrice = (price * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };

  const handleAddToCart = async () => {
    try {
      const result = await addToCart({
        name: product.name,
        sku: product.sku,
        style_code: product.style_code,
        size: selectedSize,
        color: {
          code: selectedColor,
          name: selectedColorName,
        },
        image: product.image,
        quantity: quantity,
        price: product.price,
        Offer_price: product.offer_price
      });

      const message = `Added ${quantity} ${product.name}(s) to cart with size ${selectedSize} and color ${selectedColorName}`;
      setSuccessMessage(message);
      setShowModal(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSuccessMessage("Error adding item to cart. Please try again.");
      setShowModal(true);
    }
  };

  const handleBuyNow = (product) => {
    if (!isUserLoggedIn()) {
      alert("Please log in to proceed with the purchase.");
      navigate('/login');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleWishlistToggle = async (product) => {
    if (!isUserLoggedIn()) {
      alert("Please log in before adding to wishlist.");
      navigate("/login");
      return;
    }

    try {
      console.log("Toggling wishlist for:", product.style_code);
      if (isWishlisted) {
        // Remove from wishlist
        await axios.delete(
                `${BASE_URL}/api/customer/wishlist/remove`,
                {
                    ...getAxiosConfig(),
                    data: { style_code: product.style_code }
                }
        );
        setIsWishlisted(false);
        console.log("Removed from wishlist:", product.style_code);
      } else {
        // Add to wishlist
        await axios.post(
          `${BASE_URL}/api/customer/wishlist/set-wishlist`,
          {
            style_code: product.style_code,
            name: product.name,
            image: product.image
          },
          getAxiosConfig()
        );
        setIsWishlisted(true);
        console.log("Added to wishlist:", product.style_code);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      setSuccessMessage("Error updating wishlist. Please try again.");
      setShowModal(true);
    }
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
      <Container className="my-5 container">
        <Row>
          <Col className="img-col" md={6}>
            <Image 
              className="product-image" 
              src={`${BASE_URL}/uploads/styles/${product.image}`}
              alt={product.name} 
              fluid 
            />
          </Col>
          <Col md={6} className="product-details">
          
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

            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <h5 className="price">
              {product.offer_price && product.offer_price !== 0 ? (
                <>
                  <span className="me-2 offer-price">
                    {formatPrice(product.offer_price)}
                  </span>
                  <span className="text-muted text-decoration-line-through small">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span>{formatPrice(product.price)}</span>
              )}
            </h5>

            <div className="mb-3">
              {/* Size selection first */}
              <div className="mb-3">
                <h4>Select Size:</h4>
                {product.available_sizes && product.available_sizes.length > 0 ? (
                  product.available_sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        // Reset color selection when size changes
                        setSelectedColor('');
                        setSelectedColorName('');
                      }}
                      className={`me-2 mb-2 btn-size ${selectedSize === size ? 'selected' : ''}`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  // display all colors until size is selected
                  <h5>Sizes not available</h5>
                )}
              </div>

              {/* Color selection based on selected size */}
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
              
              <CheckoutModal
                show={showCheckoutModal}
                onHide={() => setShowCheckoutModal(false)}
                onSubmit={(data) => {
                  console.log('Checkout data:', data);
                  setShowCheckoutModal(false);
                }}
              />
            </div>

            <NotifyModal
              show={showModal}
              onClose={() => setShowModal(false)}
              message={successMessage}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
}
        