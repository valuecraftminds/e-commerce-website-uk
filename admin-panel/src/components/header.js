import { useContext, useState, useEffect } from 'react';
import { Container, Navbar, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../App';
import { AuthContext } from '../context/AuthContext';
import '../styles/Header.css';
import AdminSidebar from './adminSidebar';

export default function Header() {   

  const navigate = useNavigate();
  const { isLoggedIn, userData } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebarCollapse } = useSidebar();
  const [companyLogo, setCompanyLogo] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const company_code = userData?.company_code;

  // Fetch company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!company_code) return;
      try {
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(`${BASE_URL}/api/admin/companies-by-code/${company_code}`);
        const data = await response.json();
        if (data.success && data.company && data.company.company_logo) {
          setCompanyLogo(`${BASE_URL}/uploads/company_logos/${data.company.company_logo}`);
        }
      } catch (err) {
        setCompanyLogo(null);
      }
    };
    fetchCompanyLogo();
  }, [company_code]);

  return (
    <>
      <Navbar className="header" expand={false}>
        <Container fluid className="d-flex justify-content-between align-items-center">
          <Navbar.Brand className="mb-0 text-muted d-flex align-items-center gap-2">
            {isLoggedIn && (
              <AdminSidebar 
                sidebarOpen={sidebarOpen} 
                toggleSidebar={toggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
            )}
          </Navbar.Brand>
          {/* Company Logo Avatar on right, fallback to default avatar if not available */}
          {isLoggedIn && (
            <Image
              src={companyLogo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              alt="Company Logo"
              roundedCircle
              width={50}
              height={50}
              className="company-avatar ms-2"
              style={{ objectFit: 'cover', border: '1px solid #ccc', background: '#fff' }}
            />
          )}
        </Container>
      </Navbar>
    </>
  );
}