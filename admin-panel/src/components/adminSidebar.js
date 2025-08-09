import { useContext, useRef, useState } from 'react';
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
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openNestedDropdown, setOpenNestedDropdown] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    toggleSidebar();
  };

  const handleDropdownClick = (idx) => {
    setOpenDropdown(openDropdown === idx ? null : idx);
  };

  const handleNestedDropdownClick = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenNestedDropdown(openNestedDropdown === idx ? null : idx);
  };

  // Sidebar menu items for role
  const roleBasedMenuItems = {
    VCM_Admin: [
      { label: 'Dashboard', path: '/vcm-admin-dashboard', icon: 'bi-speedometer2' },
      {
        label: 'Company Management',
         path: '/vcm-admin/view-companies',
        icon: 'bi-buildings'
        
      },
    ],
    Company_Admin: [
      { label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
      { label: 'User Management', path: '/users', icon: 'bi-people' },
      { label: 'Categories', path: '/category', icon: 'bi-tags' },
      { label: 'Styles', path: '/style', icon: 'bi-palette' },
      {
        label: 'Warehouse',
        icon: 'bi-building',
        dropdown: true,
        items: [
          { label: 'GRN', path: '/warehouse/grn', icon: 'bi-box-seam' },
          { label: 'Issuing', path: '/warehouse/issuing', icon: 'bi-box-arrow-up' }
        ]
      },
      {
        label: 'Merchandising',
        icon: 'bi-cart4',
        dropdown: true,
        items: [
          { label: 'Create PO', path: '/merchandising/po', icon: 'bi-box-seam' },
        ]
      },
      {
        label: 'Finance',
        icon: 'bi-currency-dollar',
        dropdown: true,
        items: [
          { label: 'Admin', icon: 'bi-person-gear', dropdown: true,
            items: [
              { label: 'Create currency', path: '/finance/currency', icon: 'bi-wallet' },
              { label: 'Create supplier', path: '/finance/supplier', icon: 'bi-people' }
            ]
          }
        ]
      },
      { label: 'Accounting', path: '/accounting', icon: 'bi-calculator' },
    ],
    PDC: [
      { label: 'Dashboard', path: '/pdcDashboard', icon: 'bi-speedometer2' },
    ],
    Warehouse_GRN: [
      { label: 'Dashboard', path: '/warehouseGRNDashboard', icon: 'bi-speedometer2' },
    ],
    Warehouse_Issuing: [
      { label: 'Dashboard', path: '/warehouseIssuingDashboard', icon: 'bi-speedometer2' },
    ],
    order: [
      { label: 'Dashboard', path: '/orderingDashboard', icon: 'bi-speedometer2' },
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
              return (
                <Nav.Item key={idx}>
                  <Nav.Link
                    onClick={() => handleDropdownClick(idx)}
                    className={`nav-link dropdown-toggle ${openDropdown === idx ? 'show' : ''}`}
                  >
                    <i className={`bi ${item.icon} me-2`}></i>
                    {item.label}
                  </Nav.Link>
                  <div className={`collapse ${openDropdown === idx ? 'show' : ''}`}>
                    {item.items.map((subItem, subIdx) => (
                      subItem.dropdown ? (
                        <Nav.Item key={subIdx}>
                          <Nav.Link
                            className={`nav-link sub-nav-link dropdown-toggle ${openNestedDropdown === subIdx ? 'show' : ''}`}
                            onClick={(e) => handleNestedDropdownClick(subIdx, e)}
                          >
                            <i className={`bi ${subItem.icon} me-2`}></i>
                            {subItem.label}
                          </Nav.Link>
                          <div className={`collapse ${openNestedDropdown === subIdx ? 'show' : ''}`}>
                            {subItem.items.map((nestedItem, nestedIdx) => (
                              <Nav.Link
                                key={nestedIdx}
                                as={Link}
                                to={nestedItem.path}
                                className={`nav-link nested-nav-link ${location.pathname === nestedItem.path ? 'active' : ''}`}
                                onClick={toggleSidebar}
                              >
                                <i className={`bi ${nestedItem.icon} me-2`}></i>
                                {nestedItem.label}
                              </Nav.Link>
                            ))}
                          </div>
                        </Nav.Item>
                      ) : (
                        <Nav.Link
                          key={subIdx}
                          as={Link}
                          to={subItem.path}
                          className={`nav-link sub-nav-link ${location.pathname === subItem.path ? 'active' : ''}`}
                          onClick={toggleSidebar}
                        >
                          <i className={`bi ${subItem.icon} me-2`}></i>
                          {subItem.label}
                        </Nav.Link>
                      )
                    ))}
                  </div>
                </Nav.Item>
              );
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
            to="/settings"
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={toggleSidebar}
          >
            <i className="bi bi-gear me-2"></i>
            Settings
          </Nav.Link>

          <hr className='my-2' />

          <Button variant="link" className="text-start logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Button>
        </Nav>
      </div>
    </>
  );
}