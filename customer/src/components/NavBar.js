import React, { useState, useEffect } from "react";
import { Navbar, Nav, Form, FormControl, Button, Container } from "react-bootstrap";
import { FaSearch, FaUser, FaShoppingCart, FaBars } from "react-icons/fa";

import '../styles/NavBar.css';
import logo from '../assets/logo.png';
import Sidebar from './Sidebar';

export default function NavigationBar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);

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

          {/* Desktop Right Nav */}
          <div className="d-none d-lg-flex align-items-center">
            <Form className="d-flex me-3" style={{ maxWidth: 280 }}>
              <FormControl
                type="search"
                placeholder="Search"
                className="me-2"
                aria-label="Search"
              />
              <Button variant="outline-success" type="submit">
                Search
              </Button>
            </Form>

            <Nav className="align-items-center">
              <Nav.Link href="/cart">🛒 Cart</Nav.Link>
              <Nav.Link href="/signup">Signup</Nav.Link>
            </Nav>
          </div>

          {/* Mobile Icons and Hamburger menu */}
          <div className="d-flex d-lg-none align-items-center gap-3">
            <FaSearch size={20} role="button" />
            <FaUser size={20} role="button" />
            <FaShoppingCart size={20} role="button" />
            <FaBars size={25} role="button" onClick={() => setSidebarOpen(true)} />
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
    </>
  );

}
