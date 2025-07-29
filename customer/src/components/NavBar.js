import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import logo from '../assets/logo.png';
import '../styles/NavBar.css';
import SearchSidebar from "./SearchSidebar";
import Sidebar from './Sidebar';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function NavigationBar() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [showsearchSidebar, setShowsearchSidebar] = useState(false);

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
          <div className="d-flex align-items-center gap-3">
            {/* Search icon */}
            <i
              className="bi bi-search"
              style={{ fontSize: "1.4rem", cursor: "pointer" }}
              onClick={() => setShowsearchSidebar(true)}
            />
            {/* User icons */}
            <i
              className="bi bi-person-plus"
              style={{ fontSize: "1.4rem", cursor: "pointer" }}
              onClick={() => navigate('/login')}
            />
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