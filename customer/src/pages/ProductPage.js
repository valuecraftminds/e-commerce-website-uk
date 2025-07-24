import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";

import DataFile from "../assets/DataFile";
import SuccessMsg from "../components/SuccessMsg";
import "../styles/ProductPage.css"; 

export default function ProductPage() {
  const { id } = useParams();
  const productId = parseInt(id, 10);

  const product = DataFile.newReleases.find((item) => item.id === productId);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);

  if (!product) {
    return <h2>Product not found</h2>;
  }

  const handleAddToCart = () => {
    const message = `Added ${quantity} ${product.name}(s) to cart with size ${selectedSize} and color ${selectedColor}`;
    setSuccessMessage(message);
    setShowModal(true);
  };

  const handleBuyNow = (product) => {
    // Logic to proceed to checkout
    setSuccessMessage(`Proceeding to checkout for ${quantity} ${product.name}(s) with size ${selectedSize} and color ${selectedColor}`);
  };

  return (
    <div className="product-page">
    <Container className="my-5 container">
      <Row>
        <Col className="img-col" md={6}>
          <Image className="product-image" src={product.image} alt={product.name} fluid />
        </Col>
        <Col md={6}>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <h5 className="price"> ${product.price?.toFixed(2) ?? "N/A"}</h5>

          <div className="mb-3">
            <h5>Available Sizes:</h5>
            {product.sizes ? (
              product.sizes.map((size) => (
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
            {product.colors ? (
              product.colors.map((color) => (
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
          <div>
            <h5> Quantity: </h5>
            <input
              type="number"
              min="1"
              defaultValue="1"
              className="form-control w-25 quantity-input"
              onChange={(e) => setQuantity(e.target.value)}
              value={quantity}
            />
          </div>
          <div className="btns">
            <Button className="btn-custom-primary" disabled={!selectedSize || !selectedColor || quantity < 1} onClick={handleAddToCart}>
              Add to Cart
            </Button>
            <Button className="btn-custom-primary" disabled={!selectedSize || !selectedColor || quantity < 1} onClick={() => {handleBuyNow(product)}}>
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
