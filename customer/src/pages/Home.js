import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";

import "../styles/Shop.css";
import DataFile from "../assets/DataFile";

const BASEURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Home() {
  const [activePopup] = useState(null);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

   const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

  // keep track of unique category+name combos
  const uniqueProductTypesMap = new Map();

  DataFile.productTypeDetails.forEach(item => {
    const key = item.category + '-' + item.name.toLowerCase();
    if (!uniqueProductTypesMap.has(key)) {
      uniqueProductTypesMap.set(key, item);
    }
  });

  // Fetch product listings from the backend
  useEffect (() => {
    axios.get(`${BASEURL}/customer/product-listings`)
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error('Error fetching product listings:', error);
      });
  }, []);

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
        {/*Display products*/}
        <h2 className="mb-4">Explore Your Fashion</h2>
        <Row className="flex-nowrap overflow-auto mb-5">
          {products.map((item) => (
            <Col
              key={item.style_id}
              xs={8}
              sm={6}
              md={4}
              lg={3}
              className="position-relative"
              onClick={() => getProductDetails(item.style_id)}
            >
              <Card className="h-100 card-hover-popup">
                <Card.Img
                  variant="top"
                  src={item.image}
                  alt={item.name}
                  className="new-crd"
                />
                <Card.Body>
                  <Card.Title>{item.name}</Card.Title>
                </Card.Body>
                <div
                  className={`popup-details ${
                    activePopup === `new-${item.style_id}` ? "show" : ""
                  }`}
                >
                  <p>{item.description}</p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

