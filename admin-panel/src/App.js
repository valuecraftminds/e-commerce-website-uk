import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import './App.css';

import Header from './components/Header';
import Settings from './components/Setting';
import AdminDashboard from './pages/AdminDashboard';
import Category from './pages/Category';
import EditAdmin from './pages/Company_Admin/RegisterPage';
import RegisterPage from './pages/Company_Admin/RegisterPage';
import ViewAdmins from './pages/Company_Admin/ViewAdmins';
import Currency from './pages/Currency';
import LoginPage from './pages/LoginPage';
import OrderingDashboard from './pages/OrderingDashboard';
import PdcDashboard from './pages/PdcDashboard';
import PurchaseOrder from './pages/PurchaseOrder';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import ViewPurchaseOrder from './pages/ViewPurchaseOrder';
import Style from './pages/Style_Management/Style';
import ColorManagement from './pages/Style_Management/ColorManagement';
import FitManagement from './pages/Style_Management/FitManagement';
import MaterialManagement from './pages/Style_Management/MaterialManagement';
import SizeManagement from './pages/Style_Management/SizeManagement';
import Supplier from './pages/Supplier';
import RegisterCompany from './pages/VCM_Admin/RegisterCompany';
import RegisterCompanyAdmins from './pages/VCM_Admin/RegisterCompanyAdmins';
import VcmAdminDashboard from './pages/VCM_Admin/VcmAdminDashboard';
import Companies from './pages/VCM_Admin/ViewCompanies';
import ViewCompanyAdmins from './pages/VCM_Admin/ViewCompanyAdmins';
import WarehouseGRN from './pages/WarehouseGRN';
import WarehouseGRNDashboard from './pages/WarehouseGRNDashboard';
import WarehouseIssuingDashboard from './pages/WarehouseIssuingDashboard';
import CompanySettings from './pages/Company_Admin/CompanySettings';
import ApprovePO from './pages/ApprovePO';
import GRNDetails from './components/GRNDetails';
import Location from './pages/Location';
import AddGRN from './pages/AddGRN';
import StyleAttributes from './pages/Style_Management/StyleAttributes';
import WarehouseIssuing from './pages/WarehouseIssuing';
import OrderDetails from './pages/OrderDetails';
import VerifyCompanyAdmin from './pages/VCM_Admin/VerifyCompanyAdmin';
import StockManagement from './pages/StockManagement';
import ProductOffers from './pages/ProductOffers';
import AddBanners from './pages/WebsiteSettings/AddBanners';
import AddFooter from './pages/WebsiteSettings/AddFooter';
import Tax from './pages/Tax';

// Create Sidebar Context for global sidebar state management
export const SidebarContext = createContext();

// Custom hook to manage body class, content, and header adjustment for sidebar
const useSidebarEffects = (sidebarCollapsed, isAuthenticated) => {
  useEffect(() => {
    const body = document.body;
    const mainContent = document.querySelector('.main-content');
    const header = document.querySelector('.main-header');

    // Helper to set left margin/width for header and main content
    const adjustLayout = () => {
      if (!isAuthenticated) {
        body.classList.remove('sidebar-collapsed');
        if (mainContent) mainContent.style.marginLeft = '0';
        if (header) header.style.left = '0';
        if (header) header.style.width = '100%';
        return;
      }
      if (window.innerWidth >= 992) {
        if (sidebarCollapsed) {
          body.classList.add('sidebar-collapsed');
          if (mainContent) mainContent.style.marginLeft = '80px';
          if (header) {
            header.style.left = '80px';
            header.style.width = 'calc(100% - 80px)';
          }
        } else {
          body.classList.remove('sidebar-collapsed');
          if (mainContent) mainContent.style.marginLeft = '280px';
          if (header) {
            header.style.left = '280px';
            header.style.width = 'calc(100% - 280px)';
          }
        }
      } else {
        body.classList.remove('sidebar-collapsed');
        if (mainContent) mainContent.style.marginLeft = '0';
        if (header) {
          header.style.left = '0';
          header.style.width = '100%';
        }
      }
    };

    adjustLayout();

    return () => {
      body.classList.remove('sidebar-collapsed');
      if (mainContent) mainContent.style.marginLeft = '0';
      if (header) header.style.left = '0';
      if (header) header.style.width = '100%';
    };
  }, [sidebarCollapsed, isAuthenticated]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const body = document.body;
      const mainContent = document.querySelector('.main-content');
      const header = document.querySelector('.main-header');
      if (!isAuthenticated) return;
      if (window.innerWidth < 992) {
        body.classList.remove('sidebar-collapsed');
        if (mainContent) mainContent.style.marginLeft = '0';
        if (header) {
          header.style.left = '0';
          header.style.width = '100%';
        }
      } else {
        if (sidebarCollapsed) {
          body.classList.add('sidebar-collapsed');
          if (mainContent) mainContent.style.marginLeft = '80px';
          if (header) {
            header.style.left = '80px';
            header.style.width = 'calc(100% - 80px)';
          }
        } else {
          if (mainContent) mainContent.style.marginLeft = '280px';
          if (header) {
            header.style.left = '280px';
            header.style.width = 'calc(100% - 280px)';
          }
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed, isAuthenticated]);
};

// Sidebar Context Provider Component
export const SidebarProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isAuthenticated = !['/', '/login'].includes(location.pathname);

  // Use the sidebar effects hook
  useSidebarEffects(sidebarCollapsed, isAuthenticated);
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  return (
    <SidebarContext.Provider value={{
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapse
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook to use sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

function App() {
  const location = useLocation();

  // Hide header on specific routes
  const hideHeaderRoutes = ['/', '/login','/verify-company-admin'];
  const hideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <SidebarProvider>
      {/* Add a class to the header for targeting in JS */}
      {!hideHeader && <div className="main-header" style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1030}}><Header /></div>}
      <div className={`main-content ${!hideHeader ? 'with-header' : ''}`} style={{paddingTop: !hideHeader ? 64 : 0}}>
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/vcm-admin-dashboard' element={<VcmAdminDashboard />} />
          <Route path='/vcm-admin/register-company-admins/*' element={<RegisterCompanyAdmins />} />
          <Route path='/vcm-admin/edit-company-admins/:id' element={<RegisterCompanyAdmins />} />
          <Route path='/vcm-admin/view-companies' element={<Companies />} />
          <Route path='/vcm-admin/view-company-admins/:companyCode' element={<ViewCompanyAdmins />} />
          <Route path='/vcm-admin/register-company' element={<RegisterCompany />} />
          <Route path='/vcm-admin/edit-company/:id' element={<RegisterCompany />} />

          <Route path='ViewAdmins' element={<ViewAdmins />} />
          <Route path='register' element={<RegisterPage />} />
          <Route path='EditAdmins/:id' element={<EditAdmin />} />
          <Route path='dashboard' element={<AdminDashboard />} />
          <Route path='/OrderingDashboard/*' element={<OrderingDashboard />} />
          <Route path='/PdcDashboard/*' element={<PdcDashboard />} />
          <Route path='/WarehouseGRNDashboard/*' element={<WarehouseGRNDashboard />} />
          <Route path='/WarehouseIssuingDashboard/*' element={<WarehouseIssuingDashboard />} />
          <Route path="users" element={<ViewAdmins />} />
          <Route path="category" element={<Category />} />
          <Route path="style" element={<Style />} />
                  <Route path="/styles/:style_number/attributes" element={<StyleAttributes />} />

          <Route path="/warehouse/grn" element={<WarehouseGRN />} />
          <Route path="/warehouse/add-grn" element={<AddGRN />} />

          <Route path="/warehouse/add-grn/:po_number" element={<AddGRN />} />
          <Route path="/warehouse/grn-details/:grn_id" element={<GRNDetails />} />
                    
          <Route path='/settings/*' element={<Settings />} />
          <Route path="/colors" element={<ColorManagement />} />
          <Route path="/sizes" element={<SizeManagement />} />
          <Route path="/materials" element={<MaterialManagement />} />
          <Route path="/fits" element={<FitManagement />} />

          <Route path="/finance/currency" element={<Currency />} />
          <Route path="/finance/supplier" element={<Supplier />} />
          <Route path="/finance/location" element={<Location />} />
          <Route path="/merchandising/po" element={<PurchaseOrder />} />
          <Route path="/merchandising/po/new" element={<PurchaseOrderForm />} />
          <Route path="/merchandising/po/:po_number/edit" element={<PurchaseOrderForm />} />
          <Route path="/merchandising/po/:po_number/view" element={<ViewPurchaseOrder />} />

          <Route path="/accounting/tax" element={<Tax />} />

          <Route path="/company-settings" element={<CompanySettings />} />
          <Route path="/website-settings/banners" element={<AddBanners />} />
          <Route path="/website-settings/footer" element={<AddFooter />} />
          <Route path="/approve-po" element={<ApprovePO />} />
          <Route path="/warehouse/issuing" element={<WarehouseIssuing />} />
          <Route path="/order-details/:order_id" element={<OrderDetails />} />
          <Route path="/verify-company-admin" element={<VerifyCompanyAdmin />} />
          <Route path="/warehouse/stock" element={<StockManagement />} />
          <Route path="/warehouse/offers" element={<ProductOffers />} />
        </Routes>
      </div>
    </SidebarProvider>
  );
}

export default App;