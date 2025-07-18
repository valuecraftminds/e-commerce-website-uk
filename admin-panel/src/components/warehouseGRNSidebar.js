import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Collapse, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export default function WarehouseGRNSidebar({ sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close sidebar on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (sidebarOpen && sidebarRef.current) {
        // Check if the click is outside the sidebar
        if (!sidebarRef.current.contains(event.target)) {
          // Also check if the click is not on the toggle button (hamburger menu)
          const toggleButton = document.querySelector('[data-testid="header-toggle-button"]');
          const hamburgerButton = document.querySelector('[data-sidebar-toggle]');
          
          if ((!toggleButton || !toggleButton.contains(event.target)) && 
              (!hamburgerButton || !hamburgerButton.contains(event.target))) {
            toggleSidebar();
          }
        }
      }
    };

    // Add event listener when sidebar is open
    if (sidebarOpen) {
      // Use timeout to avoid immediate triggering
      setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarOpen, toggleSidebar]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSidebar();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={handleOverlayClick}
      ></div>

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar position-fixed top-0 start-0 ${sidebarOpen ? 'open' : ''}`}
      >
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          <h5 className="sidebar-title">Warehouse GRN Admin Panel</h5>
          <Button variant="none" className="sidebar-close" onClick={toggleSidebar}>
            &times;
          </Button>
        </div>

        <nav className="sidebar-nav">
          <Nav className="flex-column">
            <Nav.Item>
              <Nav.Link as={Link} to="/warehouseGRNDashboard" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/warehouseGRNDashboard/settings" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-gear me-2"></i>
                Settings
              </Nav.Link>
            </Nav.Item>
              <Button 
                variant="outline-danger"
                className="w-100 text-start mt-2 logout-btn"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
          </Nav>
        </nav>
      </div>
    </>
  );
}
