import React, { useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; 

import "../styles/Shop.css";
import DataFile from "../assets/DataFile";

export default function Home() {
  const [activePopup, setActivePopup] = useState(null);
  const navigate = useNavigate();

  const togglePopup = (id) => {
    setActivePopup(activePopup === id ? null : id);
  };

   const getProductDetails = (id) => {
    navigate(`/product/${id}`);
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
        {/* New Releases */}
        <h2 className="mb-4">New Releases</h2>
        <Row className="flex-nowrap overflow-auto mb-5">
          {DataFile.newReleases.map((item) => (
            <Col
              key={item.id}
              xs={8}
              sm={6}
              md={4}
              lg={3}
              className="position-relative"
              onClick={() => getProductDetails(item.id)}
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
                    activePopup === `new-${item.id}` ? "show" : ""
                  }`}
                >
                  <p>{item.description}</p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Categories */}
        <h2 className="mb-4">Categories</h2>
        <Row>
          {DataFile.categories.map((item) => (
            <Col
              key={item.id}
              xs={12}
              sm={6}
              md={4}
              className="mb-4 position-relative"
              style={{ cursor: "pointer" }}
              onClick={() => togglePopup(`cat-${item.id}`)}
            >
              <Card className="h-100 card-hover-popup">
                <Card.Img
                  variant="top"
                  src={item.image}
                  alt={item.name}
                  className="cat-crd"
                />
                <Card.Body>
                  <Card.Title>{item.name}</Card.Title>
                </Card.Body>
                <div
                  className={`popup-details ${
                    activePopup === `cat-${item.id}` ? "show" : ""
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
