import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export default function AdminSidebar({ sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className="bg-light border-end vh-100 position-fixed top-0 start-0 p-3"
      style={{
        width: '250px',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 1045,
      }}
    >
    <button className="btn btn-danger mb-3" onClick={toggleSidebar}>
      &times;
    </button>

    <h5 className="px-3 py-4">Admin Sidebar</h5>
      <nav>
        <ul className="nav flex-column px-3">
          <li className="nav-item mb-2">
            <Link to="/dashboard" className="nav-link text-dark" onClick={toggleSidebar}>
              Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/users" className="nav-link text-dark" onClick={toggleSidebar}>
              Add Admins
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/products" className="nav-link text-dark" onClick={toggleSidebar}>
              Products
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/orders" className="nav-link text-dark" onClick={toggleSidebar}>
              Orders
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/settings" className="nav-link text-dark" onClick={toggleSidebar}>
              Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/" className="nav-link text-danger" onClick={handleLogout}>
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
