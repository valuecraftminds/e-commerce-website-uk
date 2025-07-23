import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import VcmAdminDashboard from './pages/VCM_Admin/VcmAdminDashboard';
import RegisterCompanyAdmins from './pages/VCM_Admin/RegisterCompanyAdmins';
import ViewCompanyAdmins from './pages/VCM_Admin/ViewCompanyAdmins';
import AdminDashboard from './pages/AdminDashboard';
import DeleteAdmin from './components/DeleteAdmin';
import EditAdmin from './pages/Company_Admin/EditAdmins';
import LoginPage from './pages/LoginPage';
import OrderingDashboard from './pages/OrderingDashboard';
import PdcDashboard from './pages/PdcDashboard';
import RegisterPage from './pages/Company_Admin/RegisterPage';
import ViewAdmins from './pages/Company_Admin/ViewAdmins';
import WarehouseGRNDashboard from './pages/WarehouseGRNDashboard';
import WarehouseIssuingDashboard from './pages/WarehouseIssuingDashboard';
import Settings from './components/Setting';
import Header from './components/Header';


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
        <Route path='/vcm-admin-dashboard/*' element={<VcmAdminDashboard />} />
        <Route path='/vcm-admin-dashboard/register-company-admins/*' element={<RegisterCompanyAdmins />} />
        <Route path='/vcm-admin-dashboard/view-company-admins/*' element={<ViewCompanyAdmins />} />
        <Route path='ViewAdmins' element={<ViewAdmins />} />
        <Route path='register' element={<RegisterPage />} />
        <Route path='EditAdmins/:id' element={<EditAdmin />} />
        <Route path='DleteAdmin/:id' element={<DeleteAdmin />} />
        <Route path='dashboard/*' element={<AdminDashboard />} />
        <Route path='/OrderingDashboard/*' element={<OrderingDashboard />} />
        <Route path='/PdcDashboard/*' element={<PdcDashboard />} />
        <Route path='/WarehouseGRNDashboard/*' element={<WarehouseGRNDashboard />} />
        <Route path='/WarehouseIssuingDashboard/*' element={<WarehouseIssuingDashboard />} />
        <Route path='/dashboard/settings/*' element={<Settings />} />

      </Routes>  
    </>
  );
}

export default App;
