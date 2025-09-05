import { useContext, useRef, useState, useEffect } from 'react';
import { Button, Nav, Offcanvas } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminSidebar.css';

export default function AdminSidebar({ sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapse }) {
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
     
       {
        label: 'Product Management',
        icon: 'bi-box-seam',
        dropdown: true,
        items: [
          { label: 'Categories', path: '/category', icon: 'bi-tags' },
          { label: 'Styles', path: '/style', icon: 'bi-palette' },
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
        label: 'Warehouse',
        icon: 'bi-building',
        dropdown: true,
        items: [
          { label: 'GRN', path: '/warehouse/grn', icon: 'bi-box-seam' },
          { label: 'Issuing', path: '/warehouse/issuing', icon: 'bi-box-arrow-up' },
          { label: 'Stock', path: '/warehouse/stock', icon: 'bi-collection', value: 'warehouse_stock' },
        { label: 'Offers', path: '/warehouse/offers', icon: 'bi-percent', value: 'warehouse_offers' }

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
        label: 'Approvals',
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
          { label: 'Website settings', path: '/website-settings', icon: 'bi bi-globe2 me-2', dropdown: true,
            items: [
              { label: 'Add banners', path: '/website-settings/banners', icon: 'bi-wallet' },
              { label: 'Add footer', path: '/website-settings/footer', icon: 'bi-people' },
            ]
           }
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
        { label: 'Issuing', path: '/warehouse/issuing', icon: 'bi-box-arrow-up', value: 'warehouse_issuing' },
        { label: 'Stock', path: '/warehouse/stock', icon: 'bi-collection', value: 'warehouse_stock' },
        { label: 'Offers', path: '/warehouse/offers', icon: 'bi-percent', value: 'warehouse_offers' }

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

  // Dashboard path mapping based on role
  const dashboardMap = {
    VCM_Admin: { label: 'Dashboard', path: '/vcm-admin-dashboard', icon: 'bi-speedometer2' },
    Company_Admin: { label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
    // Add more mappings as needed
  };

  let menus = [];
  if (role === 'VCM_Admin' || role === 'Company_Admin') {
    menus = roleBasedMenuItems[role] || [];
  } else if (Array.isArray(sideBarOptions) && sideBarOptions.length > 0) {
    // Use dashboardMap if available, else fallback to a generic dashboard
    const dashboardItem = dashboardMap[role] || { label: 'Dashboard', path: `/${role}`, icon: 'bi-speedometer2' };

    const dropdownParents = ['warehouse', 'merchandising', 'finance', 'settings'];

    const menuItems = [dashboardItem];

    sideBarOptions.forEach(optionValue => {
      if (dropdownParents.includes(optionValue)) {
        const dropdown = sidebarOptionsMap[optionValue];
        if (dropdown && dropdown.dropdown) {
          const selectedSubItems = dropdown.items.filter(subItem => 
            sideBarOptions.includes(subItem.value)
          );
          if (selectedSubItems.length > 0) {
            menuItems.push({
              ...dropdown,
              items: selectedSubItems
            });
          }
        }
      } else {
        const regularItem = sidebarOptionsMap[optionValue];
        if (regularItem && !regularItem.dropdown) {
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

  // Collapse sidebar when clicking outside
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (!sidebarCollapsed) {
          toggleSidebarCollapse();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, sidebarCollapsed, toggleSidebarCollapse]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toggleSidebar();
  };

  const handleDropdownClick = (idx) => {
    if (sidebarCollapsed) {
      toggleSidebarCollapse();
      setTimeout(() => {
        setOpenDropdown(openDropdown === idx ? null : idx);
      }, 100);
    } else {
      setOpenDropdown(openDropdown === idx ? null : idx);
    }
  };

  const handleNestedDropdownClick = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenNestedDropdown(openNestedDropdown === idx ? null : idx);
  };

  return (
    <>
      {/* Mobile menu button in header */}
      <Button
        variant="none"
        className="sidebar-toggle d-lg-none position-fixed"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
        title="Toggle Sidebar"
        style={{
          top: '10px',
          left: '10px',
          zIndex: 1040,
          fontSize: '1.4rem',
          borderRadius: '8px',
          minWidth: '40px',
          minHeight: '40px'
        }}
      >
        &#9776;
      </Button>

      <Offcanvas
        show={sidebarOpen}
        onHide={toggleSidebar}
        responsive="lg"
        placement="start"
        className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div ref={sidebarRef} style={{height: '100%'}}>
        <Offcanvas.Header closeButton className="d-lg-none">
          <Offcanvas.Title>Admin Panel</Offcanvas.Title>
        </Offcanvas.Header>
        
        <div className="sidebar-header d-flex flex-column align-items-stretch gap-2 position-relative d-none d-lg-block">
          <div className="d-flex align-items-center justify-content-between w-100">
            <h5 className="sidebar-title m-0">Admin Panel</h5>
            <Button
              variant="none"
              className="sidebar-collapse-toggle"
              onClick={toggleSidebarCollapse}
              aria-label="Toggle Sidebar Collapse"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              style={{ fontSize: '1.2rem', borderRadius: '8px', minWidth: '36px', minHeight: '36px' }}
            >
              {sidebarCollapsed ? '☰' : '⟨'}
            </Button>
          </div>
        </div>

        <Offcanvas.Body>
          <Nav defaultActiveKey='/dashboard' className="flex-column sidebar-nav">
            {menus.map((item, idx) => {
              if (item.dropdown) {
                return (
                  <Nav.Item key={idx}>
                    <Nav.Link
                      onClick={() => handleDropdownClick(idx)}
                      className={`nav-link dropdown-toggle ${openDropdown === idx ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <i className={`bi ${item.icon} me-2`}></i>
                      <span className={`nav-text ${sidebarCollapsed ? 'collapsed' : ''}`}>
                        {item.label}
                      </span>
                    </Nav.Link>
                    <div className={`collapse ${openDropdown === idx && !sidebarCollapsed ? 'show' : ''}`}>
                      {item.items.map((subItem, subIdx) => (
                        subItem.dropdown ? (
                          <Nav.Item key={subIdx}>
                            <Nav.Link
                              className={`nav-link sub-nav-link dropdown-toggle ${openNestedDropdown === subIdx ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
                              onClick={(e) => handleNestedDropdownClick(subIdx, e)}
                              title={sidebarCollapsed ? subItem.label : ''}
                            >
                              <i className={`bi ${subItem.icon} me-2`}></i>
                              <span className={`nav-text ${sidebarCollapsed ? 'collapsed' : ''}`}>
                                {subItem.label}
                              </span>
                            </Nav.Link>
                            <div className={`collapse ${openNestedDropdown === subIdx && !sidebarCollapsed ? 'show' : ''}`}>
                              {subItem.items.map((nestedItem, nestedIdx) => (
                                <Nav.Link
                                  key={nestedIdx}
                                  as={Link}
                                  to={nestedItem.path}
                                  className={`nav-link nested-nav-link ${location.pathname === nestedItem.path ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
                                  onClick={toggleSidebar}
                                  title={sidebarCollapsed ? nestedItem.label : ''}
                                >
                                  <i className={`bi ${nestedItem.icon} me-2`}></i>
                                  <span className={`nav-text ${sidebarCollapsed ? 'collapsed' : ''}`}>
                                    {nestedItem.label}
                                  </span>
                                </Nav.Link>
                              ))}
                            </div>
                          </Nav.Item>
                        ) : (
                          <Nav.Link
                            key={subIdx}
                            as={Link}
                            to={subItem.path}
                            className={`nav-link sub-nav-link ${location.pathname === subItem.path ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
                            onClick={toggleSidebar}
                            title={sidebarCollapsed ? subItem.label : ''}
                          >
                            <i className={`bi ${subItem.icon} me-2`}></i>
                            <span className={`nav-text ${sidebarCollapsed ? 'collapsed' : ''}`}>
                              {subItem.label}
                            </span>
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
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
                    onClick={toggleSidebar}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <i className={`bi ${item.icon} me-2`}></i>
                    <span className={`nav-text ${sidebarCollapsed ? 'collapsed' : ''}`}>
                      {item.label}
                    </span>
                  </Nav.Link>
                );
              }
            })}

 <Nav.Link
 
               onClick={handleLogout}
>
   <i className="bi bi-box-arrow-right me-2"></i>
   <span className={`nav-text ${sidebarCollapsed ? 'collapsed' : ''}`}>
     Logout
   </span>
 </Nav.Link>
           
          </Nav>
        </Offcanvas.Body>
        </div>
      </Offcanvas>
    </>
  );
}