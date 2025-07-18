import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button, Collapse, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminSidebar.css';

export default function AdminSidebar({ sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleWarehouseDropdown = () => {
    setWarehouseDropdownOpen(!warehouseDropdownOpen);
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
          <h5 className="sidebar-title">Admin Panel</h5>
          <Button variant="none" className="sidebar-close" onClick={toggleSidebar}>
            &times;
          </Button>
        </div>

        <nav className="sidebar-nav">
          <Nav className="flex-column">
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/users" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-people me-2"></i>
                User Management
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/category" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-tags me-2"></i>
                Categories
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/style" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-palette me-2"></i>
                Styles
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <button
                className="nav-link dropdown-toggle-custom d-flex align-items-center justify-content-between"
                onClick={toggleWarehouseDropdown}
                aria-expanded={warehouseDropdownOpen}
              >
                <span className="d-flex align-items-center">
                  <i className="bi bi-building me-2"></i>
                  Warehouse
                </span>
                <i className={`bi bi-chevron-right dropdown-icon ${warehouseDropdownOpen ? 'rotated' : ''}`}></i>
              </button>
              <Collapse in={warehouseDropdownOpen}>
                <div className="dropdown-submenu ms-3">
                  <Nav.Link as={Link} to="/dashboard/warehouse/grn" className="nav-link submenu-link" onClick={toggleSidebar}>
                    <i className="bi bi-box-seam me-2"></i>
                    GRN
                  </Nav.Link>
                  <Nav.Link as={Link} to="/dashboard/warehouse/issuing" className="nav-link submenu-link" onClick={toggleSidebar}>
                    <i className="bi bi-box-arrow-up me-2"></i>
                    Issuing
                  </Nav.Link>
                </div>
              </Collapse>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/merchandising" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-cart4 me-2"></i>
                Merchandising
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/orders" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-bag me-2"></i>
                Orders
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/accounting" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-calculator me-2"></i>
                Accounting
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard/settings" className="nav-link" onClick={toggleSidebar}>
                <i className="bi bi-gear me-2"></i>
                Settings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mt-4">
              <Button 
                variant="none"
                className="nav-link text-danger border-0 bg-transparent w-100 text-start"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </Nav.Item>
          </Nav>
        </nav>
      </div>
    </>
  );
}
