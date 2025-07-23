import React, { useContext, useRef } from 'react';
import { Button, Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminSidebar.css';


export default function AdminSidebar({ sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useContext(AuthContext);
  const role = userData?.role || '';

  const sidebarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    toggleSidebar();
  };

//   Sidebar menu items for role
  const roleBasedMenuItems = {
    VCM_Admin: [
      {label: 'Dashboard', path: '/vcm-admin-dashboard', icon: 'bi-speedometer2'},
      {label: 'Manage Company Admins', path: '/vcm-admin-dashboard/view-company-admins', icon: 'bi-people'},
    ],
     Company_Admin: [
    { label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
    { label: 'User Management', path: '/dashboard/users', icon: 'bi-people' },
    { label: 'Categories', path: '/dashboard/category', icon: 'bi-tags' },
    { label: 'Styles', path: '/dashboard/style', icon: 'bi-palette' },
    { label: 'Warehouse GRN', path: '/dashboard/warehouse/grn', icon: 'bi-box-seam' },
    { label: 'Warehouse Issuing', path: '/dashboard/warehouse/issuing', icon: 'bi-box-arrow-up' },
    { label: 'Merchandising', path: '/dashboard/merchandising', icon: 'bi-cart4' },
    { label: 'Orders', path: '/dashboard/orders', icon: 'bi-bag' },
    { label: 'Accounting', path: '/dashboard/accounting', icon: 'bi-calculator' },
  ],
    PDC: [
      {label: 'Dashboard', path: '/pdcDashboard', icon: 'bi-speedometer2'},
    ],
    Warehouse_GRN: [
      {label: 'Dashboard', path: '/warehouseGRNDashboard', icon: 'bi-speedometer2'},
    ],
    Warehouse_Issuing: [
      {label: 'Dashboard', path: '/warehouseIssuingDashboard', icon: 'bi-speedometer2'},
    ],
    order: [
      {label: 'Dashboard', path: '/orderingDashboard', icon: 'bi-speedometer2'},
    ]
  };

   // Get the current user's role from context
  const menus = roleBasedMenuItems[role] || [];
  console.log('Menus for current role:', menus);

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={toggleSidebar}
      />

      <div
        ref={sidebarRef}
        className={`sidebar position-fixed top-0 start-0 ${sidebarOpen ? 'open' : ''}`}
      >
      <div className="sidebar-header d-flex justify-content-between align-items-center">
        <h5 className="sidebar-title">Admin Panel</h5>
        <Button variant="none" className='sidebar-close' onClick={toggleSidebar}>
          &times;
        </Button>
      </div>

        <Nav defaultActiveKey='/dashboard' className="flex-column sidebar-nav">
          {menus.map((item, idx) => {
            if (item.dropdown) {
              return null;
            } else {
              return (
                <Nav.Link
                  as={Link}
                  to={item.path}
                  key={idx}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  {item.label}
                </Nav.Link>
              );
            }
          })}

          {/* settings */}
          <Nav.Link
            as={Link}
            to="/dashboard/settings"
            className={`nav-link ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}
            onClick={toggleSidebar}
          >
            <i className="bi bi-gear me-2"></i>
            Settings
          </Nav.Link>

          <hr className='my-2'/>

          <Button variant="link" className="text-start logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Button>
        </Nav>
      </div>
    </>
  );
}