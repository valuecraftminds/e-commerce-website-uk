import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import axios from "axios";

import SuccessMsg from "../components/SuccessMsg";
import { useCart } from "../context/CartContext";
import "../styles/ProductPage.css"; 

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function ProductPage() {
  const { id } = useParams();
  const variantId = parseInt(id, 10); // Use id as variant_id
  const { addToCart } = useCart();

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
        const response = await axios.get(`${BASE_URL}/customer/product/${variantId}`,
          {
            params: { company_code: COMPANY_CODE }
          }
        );
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

  const handleAddToCart = async () => {
    try {
      const result = await addToCart({
        name: product.name,
        style_code: product.style_code,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        price: product.price,
        variant_id: variantId  
      });

      const message = `Added ${quantity} ${product.name}(s) to cart with size ${selectedSize} and color ${selectedColor}`;
      setSuccessMessage(message);
      setShowModal(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSuccessMessage("Error adding item to cart. Please try again.");
      setShowModal(true);
    }
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
      <Container className="my-5 container ">
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
              ${product.price}
            </h5>

            <div className="mb-3">
              {product.available_colors && product.available_colors.length > 0 ? (
                product.available_colors
                  .filter(color => color) // Remove null/undefined colors
                  .map((color) => (
                    <Button
                      key={color}
                      className={`me-2 mb-2 product-btn-color ${selectedColor === color ? 'selected' : ''}`}
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