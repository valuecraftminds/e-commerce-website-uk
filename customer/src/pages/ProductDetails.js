import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import axios from "axios";

import SuccessMsg from "../components/SuccessMsg";
import { useCart } from "../context/CartContext";
import { CountryContext } from "../context/CountryContext";
import "../styles/ProductDetails.css"; 

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const variantId = parseInt(id, 10);
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

  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);

  // Check if user is logged in
  const isUserLoggedIn = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
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
        const response = await axios.get(`${BASE_URL}/api/customer/product/${variantId}`, {
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

    if (variantId) {
      fetchProductDetails();
    }
  }, [variantId]);

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
        variant_id: variantId  
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
      navigate('/login');
      return;
    }
    console.log('Proceeding with buy now for product:', product);
    // Check if customer has shipping details, if not navigate to ShippingDetails page
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

  console.log('Available colors:', product.available_colors);

  return (
    <div className="product-page">
      <Container className="my-5 container">
        <Row>
          <Col className="img-col" md={6}>
            <Image 
              className="product-image" 
              src={`${BASE_URL}/customer/styles/${product.image}`} 
              alt={product.name} 
              fluid 
            />
          </Col>
          <Col md={6}>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <h5 className="price"> 
              {formatPrice(product.price)}
            </h5>

            <div className="mb-3">
              {product.available_colors && product.available_colors.length > 0 ? (
                product.available_colors.map((color) => (
                  <button
                    key={color.code}
                    // onClick={() => setSelectedColor(color.code)}
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
                <p>Colors not available</p>
              )}
            </div>

            <div className="mb-3">
              {product.available_sizes && product.available_sizes.length > 0 ? (
                product.available_sizes
                  .filter(size => size)
                  .map((size) => (
                    <Button
                      key={size}
                      className={`me-2 mb-2 btn-size ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))
              ) : (
                <p>Sizes not available</p>
              )}
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

            <SuccessMsg
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