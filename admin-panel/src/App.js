import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import DeleteAdmin from './components/DeleteAdmin';
import Header from './components/Header';
import Settings from './components/Setting';
import AdminDashboard from './pages/AdminDashboard';
import Category from './pages/Category';
import EditAdmin from './pages/Company_Admin/EditAdmins';
import RegisterPage from './pages/Company_Admin/RegisterPage';
import ViewAdmins from './pages/Company_Admin/ViewAdmins';
import Currency from './pages/Currency';
import LoginPage from './pages/LoginPage';
import OrderingDashboard from './pages/OrderingDashboard';
import PdcDashboard from './pages/PdcDashboard';
import Style from './pages/Style';
import ColorManagement from './pages/Style_Management/ColorManagement';
import FitManagement from './pages/Style_Management/FitManagement';
import MaterialManagement from './pages/Style_Management/MaterialManagement';
import SizeManagement from './pages/Style_Management/SizeManagement';
import Supplier from './pages/Supplier';
import EditCompanyAdmin from './pages/VCM_Admin/EditCompanyAdmin';
import RegisterCompanyAdmins from './pages/VCM_Admin/RegisterCompanyAdmins';
import VcmAdminDashboard from './pages/VCM_Admin/VcmAdminDashboard';
import ViewCompanyAdmins from './pages/VCM_Admin/ViewCompanyAdmins';
import WarehouseGRN from './pages/WarehouseGRN';
import WarehouseGRNDashboard from './pages/WarehouseGRNDashboard';
import WarehouseIssuingDashboard from './pages/WarehouseIssuingDashboard';
import PurchaseOrder from './pages/PurchaseOrder';


function App() {
  const location = useLocation();

  // hide header on specific routes
  const hideHeaderRoutes = ['/', '/login'];
  
  const hideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/vcm-admin-dashboard' element={<VcmAdminDashboard />} />
        <Route path='/vcm-admin/register-company-admins/*' element={<RegisterCompanyAdmins />} />
        <Route path='/vcm-admin/view-company-admins/*' element={<ViewCompanyAdmins />} />
        <Route path='ViewAdmins' element={<ViewAdmins />} />
        <Route path='register' element={<RegisterPage />} />
        <Route path='EditAdmins/:id' element={<EditAdmin />} />
        <Route path='DleteAdmin/:id' element={<DeleteAdmin />} />
        <Route path="edit-company-admin/:id" element={<EditCompanyAdmin />} />
        <Route path='dashboard' element={<AdminDashboard />} />
        <Route path='/OrderingDashboard/*' element={<OrderingDashboard />} />
        <Route path='/PdcDashboard/*' element={<PdcDashboard />} />
        <Route path='/WarehouseGRNDashboard/*' element={<WarehouseGRNDashboard />} />
        <Route path='/WarehouseIssuingDashboard/*' element={<WarehouseIssuingDashboard />} />
        <Route path="users" element={<ViewAdmins />} />
        <Route path="category" element={<Category />} />
        <Route path="style" element={<Style />} />
        <Route path="warehouse/grn" element={<WarehouseGRN />} />
                  
        <Route path='/settings/*' element={<Settings />} />
        <Route path="/colors" element={<ColorManagement />} />
        <Route path="/sizes" element={<SizeManagement />} />
        <Route path="/materials" element={<MaterialManagement />} />
        <Route path="/fits" element={<FitManagement />} />

        <Route path="/finance/currency" element={<Currency />} />
        <Route path="/finance/supplier" element={<Supplier />} />
        <Route path="/merchandising/po" element={<PurchaseOrder />} />
        

      </Routes>  
    </>
  );
}

export default App;
