import React, { useEffect} from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

import '../styles/Footer.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function Footer() {
  const [companyName, setCompanyName] = React.useState();
  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [categoryError, setCategoryError] = React.useState('');

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

  // Fetch main categories
  useEffect(() => {
    fetchCompanyName();
    
    axios.get(`${BASE_URL}/api/customer/main-categories`, {
      params: { company_code: COMPANY_CODE }
    })
      .then((response) => {
        setCategories(response.data);
        setLoadingCategories(false);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        setCategoryError('Failed to fetch categories');
        setLoadingCategories(false);
      });
  }, []);

  return (
    <footer className="footer bg-dark text-white py-4">
      <Container>
        <Row>
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
                    <Link to={`/shop/${category.category_name.toLowerCase()}`} className="text-white text-decoration-none">
                      {category.category_name}
                    </Link>
                  </li>
                ))
              )}
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
            <ul className="list-unstyled social-links">
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
        <p className="text-center copyright"> &copy;  2025 {companyName}. All rights reserved.</p>
      </Container>
    </footer>
  );
}