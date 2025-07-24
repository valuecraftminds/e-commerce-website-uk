import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="footer bg-dark text-white py-4">
      <Container>
        <Row>
          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Shop</h5>
            <ul className="list-unstyled">
              <li><a href="/shop/women" className="text-white">Women Clothing</a></li>
              <li><a href="/shop/men" className="text-white">Men Clothing</a></li>
              <li><a href="/shop/kids" className="text-white">Kids Clothing</a></li>
            </ul>
          </Col>

          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Corporate Info</h5>
            <ul className="list-unstyled">
              <li><a href="/about" className="text-white">About Us</a></li>
              <li><a href="/contact" className="text-white">Contact</a></li>
            </ul>
          </Col>

          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Customer Service</h5>
            <ul className="list-unstyled">
              <li><a href="/faq" className="text-white">FAQ</a></li>
              <li><a href="/returns" className="text-white">Returns</a></li>
              <li><a href="/support" className="text-white">Support</a></li>
            </ul>
          </Col>

          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Follow Us</h5>
            <ul className="list-unstyled d-flex gap-3">
              <li><a href="https://facebook.com" className="text-white">
                <i className='bi bi-facebook'></i> 
              </a></li>
              <li><a href="https://twitter.com" className="text-white">
                <i className='bi bi-twitter'></i> 
              </a></li>
              <li><a href="https://instagram.com" className="text-white">
                <i className='bi bi-instagram'></i> 
              </a></li>
            </ul>
          </Col>
        </Row>

        <hr className="bg-light" />
        <p className="text-center mb-0"> Company Name. All rights reserved.</p>
      </Container>
    </footer>
  );
}
