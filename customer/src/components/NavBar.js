import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import logo from '../assets/logo.png';
import '../styles/NavBar.css';
import SearchSidebar from "./SearchSidebar";
import Sidebar from './Sidebar';
import UserMenu from "../pages/UserMenu";
import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function NavigationBar() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [showsearchSidebar, setShowsearchSidebar] = useState(false);
  const [country, setCountry] = useState(() => {
    return localStorage.getItem("selectedCountry") || "US";
  });

  // Fetch categories
  useEffect(() => {
    axios.get(`${BASE_URL}/customer/main-categories`, {
      params: {
        company_code: COMPANY_CODE
      }
    })
      .then((response) => {
        setCategories(response.data);
        setLoading(false);
        console.log('Categories fetched:', response.data);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        setError('Failed to fetch categories');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let timeOutId;
    if (isHoveringCategory || isHoveringSidebar) {
      setSidebarOpen(true);
    } else {
      timeOutId = setTimeout(() => {
        setSidebarOpen(false);
        setSelectedCategory(null);
      }, 300);
    }
    return () => clearTimeout(timeOutId);
  }, [isHoveringCategory, isHoveringSidebar]);

  useEffect(() => {
    localStorage.setItem("selectedCountry", country);
  }, [country]);

  // Handlers for mouse enter and leave events
  const handleCategoryMouseEnter = (category) => {
    setSelectedCategory(category);
    setIsHoveringCategory(true);
  };

  const handleCategoryMouseLeave = () => {
    setIsHoveringCategory(false);
  };

  // Handlers for sidebar mouse enter and leave events
  const handleSidebarMouseEnter = () => {
    setIsHoveringSidebar(true);
  };

  const handleSidebarMouseLeave = () => {
    setIsHoveringSidebar(false);
  };

  // Render the navigation bar
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    navigate(`/shop/${category.toLowerCase()}`);
    setSidebarOpen(false);
  };

  const handleHamburgerClicked = () => {
    setSidebarOpen(true);
  }

  const handleCategoryClickFromSidebar = (category) => {
    setSelectedCategory(category);
    navigate(`/shop/${category.toLowerCase()}`);
    setSidebarOpen(false);
  };

  // handle country change
  const handleCountryChange = (e) => {
    setCountry(e.target.value);
    window.location.reload();
  };

  
  // if loading or error state
  if (loading) {
    return <div>Loading categories...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <>
      <Navbar bg="light" expand="lg" className="shadow-sm sticky-top">
        <Container fluid className="d-flex justify-content-between align-items-center">
          {/* Left side */}
          <Navbar.Brand href="/">
            <img
              src={logo}
              alt="Company logo"
              style={{ height: "40px", objectFit: "contain" }}
            />
          </Navbar.Brand>

          {/* Categories  */}
          <div className="d-none d-md-flex me-auto">
            <Nav className="align-items-center flex-row">
              {categories.map((category) => (
                <Nav.Link
                  key={category.category_id}
                  role="button"
                  onMouseEnter={() => handleCategoryMouseEnter(category.category_name)}
                  onMouseLeave={handleCategoryMouseLeave}
                  onClick={() => handleCategoryClick(category.category_name)}
                >
                  {category.category_name}
                </Nav.Link>
              ))}
            </Nav>
          </div>

          {/* Right side */}
          <div className="d-flex align-items-center right-navbar">
            {/* select country */}
            <select className="form-select"
              aria-label="Select country"
              value={country}
              onChange={handleCountryChange}
            > 
              <option value="UK">United Kingdom</option>
              <option value="US">United States</option>
              <option value="SL">Sri Lanka</option>
            </select>

            {/* Search icon */}
            <i
              className="bi bi-search"
              style={{ fontSize: "1.4rem", cursor: "pointer" }}
              onClick={() => setShowsearchSidebar(true)}
            />
            {/* User icons */}
            <UserMenu />

            {/* Cart icon */}
            <i className="bi bi-cart3" style={{ fontSize: "1.4rem" }}
              onClick={() => navigate('/cart')}
            />
            <i
              className="bi bi-list d-lg-none"
              style={{ fontSize: "1.6rem", cursor: "pointer" }}
              onClick={() => handleHamburgerClicked(true)}
            />
          </div>
        </Container>
      </Navbar>

      {/* Sidebar */}
      <Sidebar
        category={selectedCategory}
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setSelectedCategory(null);
        }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        categories={categories}
        onCategoryClick={handleCategoryClickFromSidebar}
      />

      {/* Search Sidebar */}
      <SearchSidebar
        show={showsearchSidebar}
        onClose={() => setShowsearchSidebar(false)}
      />
    </>
  );
}