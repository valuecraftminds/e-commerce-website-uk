import { useContext, useState } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../App';
import { AuthContext } from '../context/AuthContext';
import '../styles/Header.css';
import AdminSidebar from './adminSidebar';

export default function Header() {   
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebarCollapse } = useSidebar();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <Navbar className="header" expand={false}>
        <Container fluid>
          <Navbar.Brand className="mb-0 text-muted">
             
      {isLoggedIn && (
        <AdminSidebar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebarCollapse={toggleSidebarCollapse}
        />
      )}
          </Navbar.Brand>

          <div>
            {isLoggedIn && (
              <Button 
                variant="none"
                onClick={handleLogout} 
                className="logout-btn"
                title="Logout"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                <span className="d-none d-sm-inline">Logout</span>
              </Button>
            )}
          </div>
        </Container>
      </Navbar>
    
    </>
  );
}