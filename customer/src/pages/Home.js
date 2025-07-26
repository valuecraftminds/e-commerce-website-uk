import axios from "axios";
import React, { useEffect, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import DataFile from "../assets/DataFile";
import "../styles/Shop.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Home() {
  const [activePopup, setActivePopup] = useState(null);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

  const togglePopup = (id) => {
    setActivePopup(activePopup === id ? null : id);
  };

  // Fetch product listings from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/customer/all-styles`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching product listings:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Helper function to format price display
  const formatPrice = (minPrice, maxPrice) => {
    if (!minPrice && !maxPrice) return null;
    if (minPrice === maxPrice) return `$${minPrice}`;
    return `$${minPrice} - $${maxPrice}`;
  };

  return (
    <>
      {/* Banner Section */}
      <div className="banner mb-4">
        <img
          src={DataFile.banner[3].image}
          className="banner-img"
          alt={`${DataFile.banner[3].category} banner`}
        />
      </div>

      <Container className="my-5">
        {/* Display products */}
        <h2 className="mb-4">Explore Your Fashion</h2>
        
        {loading ? (
          <div className="text-center my-5">
            <h5>Loading products...</h5>
          </div>
        ) : error ? (
          <div className="text-center my-5">
            <h5 className="text-danger">{error}</h5>
          </div>
        ) : (
          <Row className="mb-5">
            {products.map((item) => (
              <Col
                key={item.style_id}
                xs={12}
                sm={6}
                md={4}
                lg={3}
                className="mb-4 position-relative"
                onMouseEnter={() => togglePopup(`product-${item.style_id}`)}
                onMouseLeave={() => togglePopup(null)}
                onClick={() => getProductDetails(item.style_id)}
              >
                <Card className="h-100 card-hover-popup" style={{ cursor: 'pointer' }}>
                  <Card.Img
                    variant="top"
                    src={item.image || '/placeholder-image.jpg'}
                    alt={item.name}
                    className="new-crd"
                  />
                  <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    {item.category_name && (
                      <Card.Text className="text-muted small">
                        {item.category_name}
                      </Card.Text>
                    )}
                    {formatPrice(item.min_price, item.max_price) && (
                      <Card.Text className="fw-bold text-primary">
                        {formatPrice(item.min_price, item.max_price)}
                      </Card.Text>
                    )}
                  </Card.Body>
                  <div
                    className={`popup-details ${
                      activePopup === `product-${item.style_id}` ? "show" : ""
                    }`}
                  >
                    <p>{item.description}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* no products */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center my-5">
            <p>No products available at the moment.</p>
          </div>
        )}
      </Container>
    </>
  );
}
