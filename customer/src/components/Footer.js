import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

import '../styles/Footer.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function Footer() {
  const [companyName, setCompanyName] = useState();
  const [categories, setCategories] = useState([]);
  const [customFooterSections, setCustomFooterSections] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFooter, setLoadingFooter] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [footerError, setFooterError] = useState('');

  // Fetch company name
  const fetchCompanyName = async () => {
    if (!COMPANY_CODE) {
      console.error('COMPANY_CODE is not defined');
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/customer/company/get-company-details`, {
        params: { company_code: COMPANY_CODE }
      });

      if (res.data.company_name) {
        setCompanyName(res.data.company_name);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  // Fetch custom footer data
  const fetchCustomFooter = async () => {
    if (!COMPANY_CODE) {
      console.error('COMPANY_CODE is not defined');
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/customer/footer-data`, {
        params: { company_code: COMPANY_CODE }
      });

      if (res.data.success) {
        setCustomFooterSections(res.data.data);
      }
      setLoadingFooter(false);
    } catch (err) {
      console.error('Error fetching footer data:', err);
      setFooterError('Failed to fetch footer data');
      setLoadingFooter(false);
    }
  };

  // Fetch main categories for Shop section (fallback)
  const fetchCategories = async () => {
    if (!COMPANY_CODE) {
      console.error('COMPANY_CODE is not defined');
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/api/customer/main-categories`, {
        params: { company_code: COMPANY_CODE }
      });
      setCategories(response.data);
      setLoadingCategories(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryError('Failed to fetch categories');
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCompanyName();
    fetchCustomFooter();
    fetchCategories();
  }, []);

  // Check if we have a "Shop" section in custom footer
  const hasShopSection = customFooterSections.some(section => 
    section.section_title.toLowerCase().includes('shop')
  );

  // Render a footer section
  const renderFooterSection = (section) => (
    <Col md={3} sm={6} xs={12} className="mb-3" key={section.footer_id}>
      <h5>{section.section_title}</h5>
      <ul className="list-unstyled">
        {section.items && section.items.length > 0 ? (
          section.items.map((item) => (
            <li key={item.item_id}>
              {item.is_external_link ? (
                <a 
                  href={item.item_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white text-decoration-none"
                >
                  {item.item_title}
                </a>
              ) : (
                <Link 
                  to={item.item_url} 
                  className="text-white text-decoration-none"
                >
                  {item.item_title}
                </Link>
              )}
            </li>
          ))
        ) : (
          <li className="text-muted">No items available</li>
        )}
      </ul>
    </Col>
  );

  // Render shop section (fallback if not in custom footer)
  const renderShopSection = () => (
    <Col md={3} sm={6} xs={12} className="mb-3">
      <h5>Shop</h5>
      <ul className="list-unstyled">
        {loadingCategories ? (
          <li>Loading categories...</li>
        ) : categoryError ? (
          <li>{categoryError}</li>
        ) : (
          categories.map((category) => (
            <li key={category.category_id}>
              <Link 
                to={`/shop/${category.category_name.toLowerCase()}`} 
                className="text-white text-decoration-none"
              >
                {category.category_name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </Col>
  );

  return (
    <footer className="footer bg-dark text-white py-4">
      <Container>
        <Row>
          {/* Show shop section if not included in custom footer */}
          {!hasShopSection && renderShopSection()}
          
          {/* Render custom footer sections */}
          {loadingFooter ? (
            <Col className="text-center">
              <p>Loading footer data...</p>
            </Col>
          ) : footerError ? (
            <Col className="text-center">
              <p className="text-muted">{footerError}</p>
            </Col>
          ) : (
            customFooterSections.map(renderFooterSection)
          )}

          {/* Fallback sections if no custom footer data */}
          {!loadingFooter && customFooterSections.length === 0 && (
            <>
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
                <ul className="list-unstyled social-links">
                  <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white">
                    <i className='bi bi-facebook'></i> Facebook
                  </a></li>
                  <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white">
                    <i className='bi bi-twitter'></i> Twitter
                  </a></li>
                  <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white">
                    <i className='bi bi-instagram'></i> Instagram
                  </a></li>
                </ul>
              </Col>
            </>
          )}
        </Row>

        <hr className="bg-light" />
        <p className="text-center copyright"> 
          &copy; 2025 {companyName || 'ABCD Clothing'}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}