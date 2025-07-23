import React, { useState, useEffect } from "react";
import { Navbar, Nav, Form, Button, Container } from "react-bootstrap";

import '../styles/NavBar.css';
import logo from '../assets/logo.png';
import Sidebar from './Sidebar';
import SearchSidebar from "./SearchSidebar";

export default function NavigationBar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [showsearchSidebar, setShowsearchSidebar] = useState(false);

  useEffect(() => {
    let timeOutId; // Timeout to close sidebar after mouse leaves
    
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
              {["Women", "Men", "Kids"].map((category) => (
                <Nav.Link
                  key={category}
                  role="button"
                  onMouseEnter={() => handleCategoryMouseEnter(category)}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  {category}
                </Nav.Link>
              ))}
            </Nav>
          </div>

          {/* Right Side  */}
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
              onClick={() => setSidebarOpen(true)}
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
      />

      {/* Search Sidebar */}
      <SearchSidebar
        show={showsearchSidebar}
        onClose={() => setShowsearchSidebar(false)}
      />
    </>
  );
}
