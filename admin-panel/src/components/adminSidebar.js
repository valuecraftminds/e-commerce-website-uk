import { useContext, useRef, useState } from 'react';
import { Button, Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminSidebar.css';

export default function AdminSidebar({ sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useContext(AuthContext);

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
              { label: 'Add currency', path: '/finance/currency', icon: 'bi-wallet' },
              { label: 'Add supplier', path: '/finance/supplier', icon: 'bi-people' },
              { label: 'Add location', path: '/finance/location', icon: 'bi-geo-alt' }
            ]
          }
        ]
      },
      { label: 'Accounting', path: '/accounting', icon: 'bi-calculator' },
     {
        label: 'Approvements',
        icon: 'bi bi-patch-check me-2',
        dropdown: true,
        items: [
          { label: 'Approve PO', path: '/approve-po', icon: 'bi bi-file-check me-2' }
        ]
      },
     
      {
        label: 'Settings',
        icon: 'bi bi-gear me-2',
        dropdown: true,
        items: [
          { label: 'Profile settings', path: '/settings', icon: 'bi bi-person-gear me-2' },
          { label: 'Company settings', path: '/company-settings', icon: 'bi bi-building-gear me-2' },
          { label: 'Website settings', path: '/website-settings', icon: 'bi bi-globe2 me-2' }
        ]
      },
    ],

    PDC: [
      { label: 'Dashboard', path: '/pdcDashboard', icon: 'bi-speedometer2' },
      { label: 'Settings', path: '/settings', icon: 'bi bi-gear me-2' },
    ],
    Warehouse_GRN: [
      { label: 'Dashboard', path: '/warehouseGRNDashboard', icon: 'bi-speedometer2' },
      { label: 'Settings', path: '/settings', icon: 'bi bi-gear me-2' },
    ],
    Warehouse_Issuing: [
      { label: 'Dashboard', path: '/warehouseIssuingDashboard', icon: 'bi-speedometer2' },
      { label: 'Settings', path: '/settings', icon: 'bi bi-gear me-2' },
    ],
    order: [
      { label: 'Dashboard', path: '/orderingDashboard', icon: 'bi-speedometer2' },
      { label: 'Settings', path: '/settings', icon: 'bi bi-gear me-2' },
    ]
  };

  const sidebarOptionsMap = {
    dashboard: { label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
    users: { label: 'User Management', path: '/users', icon: 'bi-people' },
    category: { label: 'Categories', path: '/category', icon: 'bi-tags' },
    style: { label: 'Styles', path: '/style', icon: 'bi-palette' },
    
    // Dropdown parents
    warehouse: {
      label: 'Warehouse',
      icon: 'bi-building',
      dropdown: true,
      items: [
        { label: 'GRN', path: '/warehouse/grn', icon: 'bi-box-seam', value: 'warehouse_grn' },
        { label: 'Issuing', path: '/warehouse/issuing', icon: 'bi-box-arrow-up', value: 'warehouse_issuing' }
      ]
    },
    merchandising: {
      label: 'Merchandising',
      icon: 'bi-cart4',
      dropdown: true,
      items: [
        { label: 'Create PO', path: '/merchandising/po', icon: 'bi-box-seam', value: 'merchandising_po' }
      ]
    },
    finance: {
      label: 'Finance',
      icon: 'bi-currency-dollar',
      dropdown: true,
      items: [
        { label: 'Create currency', path: '/finance/currency', icon: 'bi-wallet', value: 'finance_currency' },
        { label: 'Create supplier', path: '/finance/supplier', icon: 'bi-people', value: 'finance_supplier' }
      ]
    },
    settings: {
      label: 'Settings',
      icon: 'bi bi-gear me-2',
      dropdown: true,
      items: [
        { label: 'Profile settings', path: '/settings', icon: 'bi bi-person-gear me-2', value: 'settings_profile' },
        { label: 'Company settings', path: '/company-settings', icon: 'bi bi-building-gear me-2', value: 'settings_company' },
        { label: 'Website settings', path: '/website-settings', icon: 'bi bi-globe2 me-2', value: 'settings_website' }
      ]
    },
    
    // Individual items (for backward compatibility)
    warehouse_grn: { label: 'GRN', path: '/warehouse/grn', icon: 'bi-box-seam' },
    warehouse_issuing: { label: 'Issuing', path: '/warehouse/issuing', icon: 'bi-box-arrow-up' },
    merchandising_po: { label: 'Create PO', path: '/merchandising/po', icon: 'bi-box-seam' },
    finance_currency: { label: 'Create currency', path: '/finance/currency', icon: 'bi-wallet' },
    finance_supplier: { label: 'Create supplier', path: '/finance/supplier', icon: 'bi-people' },
    accounting: { label: 'Accounting', path: '/accounting', icon: 'bi-calculator' },
    settings_profile: { label: 'Profile settings', path: '/settings', icon: 'bi bi-person-gear me-2' },
    settings_company: { label: 'Company settings', path: '/company-settings', icon: 'bi bi-building-gear me-2' },
    settings_website: { label: 'Website settings', path: '/website-settings', icon: 'bi bi-globe2 me-2' }
  };

  const role = userData?.role || '';
  const sideBarOptions = userData?.side_bar_options || [];

  const dashboardMap = {
    PDC: { label: 'Dashboard', path: '/pdcDashboard', icon: 'bi-speedometer2' },
    Warehouse_GRN: { label: 'Dashboard', path: '/warehouseGRNDashboard', icon: 'bi-speedometer2' },
    Warehouse_Issuing: { label: 'Dashboard', path: '/warehouseIssuingDashboard', icon: 'bi-speedometer2' },
    order: { label: 'Dashboard', path: '/orderingDashboard', icon: 'bi-speedometer2' },
    default: { label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' }
  };

  let menus = [];
  if (role === 'VCM_Admin' || role === 'Company_Admin') {
    menus = roleBasedMenuItems[role] || [];
  } else if (Array.isArray(sideBarOptions) && sideBarOptions.length > 0) {
    const dashboardItem = dashboardMap[role] || dashboardMap.default;
    
    // Define dropdown parent keys
    const dropdownParents = ['warehouse', 'merchandising', 'finance', 'settings'];
    
    // Build menu items
    const menuItems = [dashboardItem];
    
    // Process each selected sidebar option
    sideBarOptions.forEach(optionValue => {
      // Check if this is a dropdown parent
      if (dropdownParents.includes(optionValue)) {
        const dropdown = sidebarOptionsMap[optionValue];
        if (dropdown && dropdown.dropdown) {
          // Find which sub-items are also selected
          const selectedSubItems = dropdown.items.filter(subItem => 
            sideBarOptions.includes(subItem.value)
          );
          
          if (selectedSubItems.length > 0) {
            // Add dropdown with only selected sub-items
            menuItems.push({
              ...dropdown,
              items: selectedSubItems
            });
          }
        }
      } else {
        // Check if this is a regular (non-dropdown) item
        const regularItem = sidebarOptionsMap[optionValue];
        if (regularItem && !regularItem.dropdown) {
          // Make sure this isn't already covered by a dropdown
          const isSubItemOfDropdown = dropdownParents.some(parentKey => {
            const parent = sidebarOptionsMap[parentKey];
            return parent && parent.dropdown && 
                   parent.items.some(subItem => subItem.value === optionValue);
          });
          
          if (!isSubItemOfDropdown) {
            menuItems.push(regularItem);
          }
        }
      }
    });
    
    // Remove duplicates based on label
    const uniqueMenuItems = [];
    const seenLabels = new Set();
    
    menuItems.forEach(item => {
      if (!seenLabels.has(item.label)) {
        seenLabels.add(item.label);
        uniqueMenuItems.push(item);
      }
    });
    
    menus = uniqueMenuItems;
  }

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

  // Get the current user's role from context
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