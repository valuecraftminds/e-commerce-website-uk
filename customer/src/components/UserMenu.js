import React, { useContext } from "react";
import { Dropdown } from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';

export default function UserMenu({ profilePicture }) {
  const navigate = useNavigate();
  const { isLoggedIn, userData, logout } = useContext(AuthContext);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle 
        variant="link" 
        id="user-dropdown"
        className="p-0 border-0 bg-transparent"
        style={{ boxShadow: 'none' }}
      >
        {isLoggedIn ? (
          profilePicture ? (
            <img
              src={profilePicture} 
              alt="Profile"
              className="rounded-circle"
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />
          ) : (
            <i
              className="bi bi-person"
              style={{ fontSize: '1.8rem', cursor: 'pointer', color: '#000' }}
            />
          )
        ) : (
          <i
            className="bi bi-person"
            style={{ fontSize: '1.8rem', cursor: 'pointer', color: '#000' }}
          />
        )}

      </Dropdown.Toggle>

      <Dropdown.Menu>
        {!isLoggedIn ? (
          <>
            <Dropdown.Item onClick={() => handleNavigate('/login')}>
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Login
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNavigate('/register')}>
              <i className="bi bi-person-plus me-2"></i>
              Register
            </Dropdown.Item>
          </>
        ) : (
          <>
            <Dropdown.Header>
              {userData?.name || userData?.email || 'User'}
            </Dropdown.Header>
            <Dropdown.Divider />
            {/* <Dropdown.Item onClick={() => handleNavigate('/profile')}>
              <i className="bi bi-person me-2"></i>
              Profile
            </Dropdown.Item> */}
            <Dropdown.Item onClick={() => handleNavigate('/orders')}>
              <i className="bi bi-bag me-2"></i>
              My Orders
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNavigate('/wishlist')}>
              <i className="bi bi-heart me-2"></i>
              Wishlist
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleNavigate('/account-settings')}>
              <i className="bi bi-gear me-2"></i>
              Account Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}