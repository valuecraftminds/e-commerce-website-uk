import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";

import "../styles/Shop.css";
import DataFile from "../assets/DataFile";

export default function Shop() {
  const { category } = useParams(); // Get category from URL
  const [activePopup, setActivePopup] = useState(null);

  const togglePopup = (id) => {
    setActivePopup(activePopup === id ? null : id);
  };

  const validCategories = ['women', 'men', 'kids'];
  const currentCategory = validCategories.includes(category) ? category : null;

  if (!currentCategory) {
    return <h2 className="text-center my-5">Invalid category: {category}</h2>;
  }

  return (
    <>
      {/* Banner Section */}
      <div className="banner mb-4">
        {DataFile.banner
          .filter((item) => item.category === currentCategory)
          .map((item) => (
            <img
              key={item.id}
              src={item.image}
              className="banner-img"
              alt={`${currentCategory} banner`}
            />
          ))}
      </div>

      <Container className="my-5">
        {/* New Releases */}
        <h2 className="mb-4 text-capitalize">{currentCategory} - New Releases</h2>
        <Row className="flex-nowrap overflow-auto mb-5">
          {DataFile.newReleases
            .filter((item) => item.category === currentCategory)
            .map((item) => (
              <Col
                key={item.id}
                xs={8}
                sm={6}
                md={4}
                lg={3}
                className="position-relative"
                onClick={() => togglePopup(`new-${item.id}`)}
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
        <h2 className="mb-4 text-capitalize">{currentCategory} - Categories</h2>
        <Row>
          {DataFile.categories
            .filter((item) => item.category === currentCategory)
            .map((item) => (
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
