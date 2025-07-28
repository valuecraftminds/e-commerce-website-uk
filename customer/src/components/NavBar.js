import React, { useState, useEffect } from "react";
import axios from "axios";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import '../styles/NavBar.css';
import logo from '../assets/logo.png';
import Sidebar from './Sidebar';
import SearchSidebar from "./SearchSidebar";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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

  // Fetch categories from the backend
  useEffect(() => {
    axios.get(`${BASE_URL}/customer/main-categories`)
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
            <i
              className="bi bi-search"
              style={{ fontSize: "1.4rem", cursor: "pointer" }}
              onClick={() => setShowsearchSidebar(true)}
            />
            <i className="bi bi-person-plus" style={{ fontSize: "1.4rem" }} />
            <i className="bi bi-cart3" style={{ fontSize: "1.4rem" }} />
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
