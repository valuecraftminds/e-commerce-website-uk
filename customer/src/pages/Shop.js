import React, { useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";

import '../styles/Shop.css';
import DataFile from "../assets/DataFile";

export default function Shop() {
  // To handle popup on mobile tap
  const [activePopup, setActivePopup] = useState(null);

  // Toggle popup for mobile (click)
  const togglePopup = (id) => {
    setActivePopup(activePopup === id ? null : id);
  };
 

  return (
    <>
      {/* Banner */}
        <div className="banner">
            <img src={DataFile.couple} className="banner-img" />
        </div>

      <Container className="my-5">
            {/*  New Releases */}
            <h2 className="mb-4">New Release</h2>

            {/* Horizontal scroll row for new releases */}
            <Row className="flex-nowrap overflow-auto mb-5">
                {DataFile.newReleases.map((item) => (
                    <Col
                        key={item.id}
                        xs={8}
                        sm={6}
                        md={4}
                        lg={3}
                        className="position-relative"
                        onClick={() => togglePopup(`new-${item.id}`)}
                    >
                    <Card key={item.id} className="h-100 card-hover-popup">
                        <Card.Img
                            variant="top"
                            src={item.image}
                            alt="New release item"
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
                            <p>Additional details</p>
                        </div>
                    </Card>
                </Col>
            ))}
                </Row>

                {/* Categories Section */}
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
                    onClick={() => togglePopup(`new-${item.id}`)}
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
                            activePopup === `new-${item.id}` ? "show" : ""
                        }`}
                        >
                        <p>Category details</p>
                        </div>
                    </Card>
                    </Col>
                ))}
                </Row>
      </Container>
    </>
  );
}
