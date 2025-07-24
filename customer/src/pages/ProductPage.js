import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DataFile from "../assets/DataFile";
import { Container, Row, Col, Image, Button } from "react-bootstrap";

export default function ProductPage() {
  const { id } = useParams();
  const productId = parseInt(id, 10);

  const product = DataFile.newReleases.find((item) => item.id === productId);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return <h2>Product not found</h2>;
  }

  const handleAddToCart = () => {
    // Logic to add the product to the cart
   setSuccessMessage(`Added ${quantity} ${product.name}(s) to cart with size ${selectedSize} and color ${selectedColor}`);
  };

  const handleBuyNow = (product) => {
    // Logic to proceed to checkout
    setSuccessMessage(`Proceeding to checkout for ${quantity} ${product.name}(s) with size ${selectedSize} and color ${selectedColor}`);
  };

  return (
    <Container className="my-5">
      <Row>
        <Col md={6}>
          <Image src={product.image} alt={product.name} fluid />
        </Col>
        <Col md={6}>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <h4>Price: ${product.price?.toFixed(2) ?? "N/A"}</h4>

          <div className="mb-3">
            <h5>Available Sizes:</h5>
            {product.sizes ? (
              product.sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "primary" : "outline-primary"}
                  className="me-2 mb-2"
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
                  variant={selectedColor === color ? "primary" : "outline-primary"}
                  className="me-2 mb-2"
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
              className="form-control w-25"
              onChange={(e) => setQuantity(e.target.value)}
              value={quantity}
            />
          </div>
          <div className="mb-3">
            <Button variant="success" disabled={!selectedSize || !selectedColor || quantity < 1} onClick={handleAddToCart}>
              Add to Cart
            </Button>
            <Button variant="info" className="ms-2" disabled={!selectedSize || !selectedColor || quantity < 1} onClick={() => {handleBuyNow(product)}}>
              Buy Now
            </Button>
          </div>
          {successMessage && (
            <div className="alert alert-success mt-3">
              {successMessage}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
