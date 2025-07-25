import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import DataFile from '../assets/DataFile';

export default function Footer() {
  return (
    <footer className="footer bg-dark text-white py-4">
      <Container>
        <Row>
          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Shop</h5>
            <ul className="list-unstyled">
              {DataFile.categories.map((category) => (
                <li key={category.name}>
                  <Link to={`/shop/${category.name.toLowerCase()}`} className="text-white text-decoration-none">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Corporate Info</h5>
            <ul className="list-unstyled">
              <li><Link to="/about" className="text-white text-decoration-none">About Us</Link></li>
              <li><Link to="/contact" className="text-white text-decoration-none">Contact</Link></li>
            </ul>
          </Col>

          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Customer Service</h5>
            <ul className="list-unstyled">
              <li><Link to="/faq" className="text-white text-decoration-none">FAQ</Link></li>
              <li><Link to="/returns" className="text-white text-decoration-none">Returns</Link></li>
              <li><Link to="/support" className="text-white text-decoration-none">Support</Link></li>
            </ul>
          </Col>

          <Col md={3} sm={6} xs={12} className="mb-3">
            <h5>Follow Us</h5>
            <ul className="list-unstyled d-flex gap-3">
              <li><Link to="https://facebook.com" className="text-white">
                <i className='bi bi-facebook'></i> 
              </Link></li>
              <li><Link to="https://twitter.com" className="text-white">
                <i className='bi bi-twitter'></i> 
              </Link></li>
              <li><Link to="https://instagram.com" className="text-white">
                <i className='bi bi-instagram'></i> 
              </Link></li>
            </ul>
          </Col>
        </Row>

        <hr className="bg-light" />
        <p className="text-center mb-0"> &copy; 2025 Company Name. All rights reserved.</p>
      </Container>
    </footer>
  );
}
