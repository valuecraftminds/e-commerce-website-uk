import React, { useContext, useState } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Header.css';
import AdminSidebar from './AdminSidebar';
import OrderSidebar from './OrderSidebar';
import PdcSidebar from './PdcSidebar';
import WarehouseGRNSidebar from './WarehouseGRNSidebar';
import WarehouseIssuingSidebar from './WarehouseIssuingSidebar';
import VcmAdminSidebar from './VcmAdminSidebar';

export default function Header( {role} ) {   
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <Navbar className="header" expand={false}>
        <Container fluid>
          <div className="d-flex align-items-center">
            {isLoggedIn && (
              <Button
                variant="none"
                className="sidebar-toggle me-3"
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
              >
                &#9776;
              </Button>
            )}
            
            <Navbar.Brand className="mb-0 text-muted">
              Admin Panel
            </Navbar.Brand>
          </div>

          <div>
            {isLoggedIn && (
              <Button 
                variant="none"
                onClick={handleLogout} 
                className="logout-btn"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
            )}
          </div>
        </Container>
      </Navbar>
      
      {isLoggedIn && (
        <>
          {role === 'VCM_Admin' && (
            <VcmAdminSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}
          {role === 'Company_Admin' && (
            <AdminSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}
          {role === 'order' && (
            <OrderSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}
          {role === 'PDC' && (
            <PdcSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}
          {role === 'Warehouse_GRN' && (
            <WarehouseGRNSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}
          {role === 'Warehouse_Issuing' && (
            <WarehouseIssuingSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          )}

        </>
    )}
    </>
  );
}
