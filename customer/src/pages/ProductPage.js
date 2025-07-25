import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import axios from "axios";

import SuccessMsg from "../components/SuccessMsg";
import "../styles/ProductPage.css"; 

const BASEURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function ProductPage() {
  const { id } = useParams();
  const styleId = parseInt(id, 10);

  // State for product data and loading
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for user selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Fetch product details from backend
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASEURL}/customer/product/${styleId}`);
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

  const handleAddToCart = () => {
    const message = `Added ${quantity} ${product.name}(s) to cart with size ${selectedSize} and color ${selectedColor}`;
    setSuccessMessage(message);
    setShowModal(true);
  };

  const handleBuyNow = (product) => {
   // handle buynow logic
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
              src={product.image || '/placeholder-image.jpg'} 
              alt={product.name} 
              fluid 
            />
          </Col>
          <Col md={6}>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <h5 className="price"> 
              ${product.price }
            </h5>

            <div className="mb-3">
              <h5>Available Sizes:</h5>
              {product.available_sizes && product.available_sizes.length > 0 ? (
                product.available_sizes
                  .filter(size => size) // Remove null/undefined sizes
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
              <h5>Available Colors:</h5>
              {product.available_colors && product.available_colors.length > 0 ? (
                product.available_colors
                  .filter(color => color) // Remove null/undefined colors
                  .map((color) => (
                    <Button
                      key={color}
                      className={`me-2 mb-2 btn-color ${selectedColor === color ? 'selected' : ''}`} 
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </Button>
                  ))
              ) : (
                <p>Colors not available</p>
              )}
            </div>

            <div className="mb-3">
              <h5>Quantity:</h5>
              <input
                type="number"
                min="1"
                className="form-control w-25 quantity-input"
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
