
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import logo from '../assets/logo.png';
import SearchSidebar from "./SearchSidebar";
import Sidebar from './Sidebar';
import UserMenu from "./UserMenu";

import '../styles/NavBar.css';

import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function NavigationBar({ onSidebarStateChange }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const [companyLogo, setCompanyLogo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [showsearchSidebar, setShowsearchSidebar] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [country, setCountry] = useState(() => {
    return localStorage.getItem("selectedCountry") || "US";
  });

  // Get auth token from logged in user
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    return token;
  };

  // Get axios config with auth token
  const getAxiosConfig = () => {
    const token = getAuthToken();
    const config = {
      params: { company_code: COMPANY_CODE },
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };

  // Fetch categories
  useEffect(() => {
    axios.get(`${BASE_URL}/api/customer/main-categories`, {
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

  // Communicate sidebar state to parent App component
  useEffect(() => {
    if (onSidebarStateChange) {
      onSidebarStateChange(sidebarOpen);
    }

    // Alternative method using custom events if needed
    const event = new CustomEvent('sidebarStateChange', {
      detail: { isOpen: sidebarOpen }
    });
    window.dispatchEvent(event);
  }, [sidebarOpen, onSidebarStateChange]);

  useEffect(() => {
    localStorage.setItem("selectedCountry", country);
  }, [country]);

  useEffect(() => {
    const token = getAuthToken();
    axios.get(`${BASE_URL}/api/customer/user/profile`, {
      params: { company_code: COMPANY_CODE },
      headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => {
          const data = res.data;
          setProfilePicture(data.profile_image ? `${BASE_URL}/uploads/profile_images/${data.profile_image}` : null);
        })
        .catch(err => {
          console.error('Failed to load user profile:', err);
        });
  }, []);

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
        <Navbar bg="light" expand="lg" className="shadow-sm sticky-top nav-bar">
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
                        className="navbar-category-link"
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

              {/* Cart icon */}
              <i className="bi bi-cart3" style={{ fontSize: "1.4rem" }}
                 onClick={() => navigate('/cart')}
              />
              <i
                  className="bi bi-list d-lg-none"
                  style={{ fontSize: "1.6rem", cursor: "pointer" }}
                  onClick={() => handleHamburgerClicked(true)}
              />

              {/* User icons */}
              <UserMenu profilePicture={profilePicture} />

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