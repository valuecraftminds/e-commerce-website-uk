import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ViewAdmins from './pages/ViewAdmins';
import RegisterPage from './pages/RegisterPage';
import EditAdmin from './pages/EditAdmins';
import DeleteAdmin from './pages/DeleteAdmin';
import OrderingDashboard from './pages/OrderingDashboard';
import PdcDashboard from './pages/PdcDashboard';
import WarehouseGRNDashboard from './pages/WarehouseGRNDashboard';
import WarehouseIssuingDashboard from './pages/WarehouseIssuingDashboard';


function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='ViewAdmins' element={<ViewAdmins />} />
        <Route path='register' element={<RegisterPage />} />
        <Route path='EditAdmins/:id' element={<EditAdmin />} />
        <Route path='DleteAdmin/:id' element={<DeleteAdmin />} />
        <Route path='dashboard/*' element={<AdminDashboard />} />
        <Route path='/OrderingDashboard/*' element={<OrderingDashboard />} />
        <Route path='/PdcDashboard/*' element={<PdcDashboard />} />
        <Route path='/WarehouseGRNDashboard/*' element={<WarehouseGRNDashboard />} />
        <Route path='/WarehouseIssuingDashboard/*' element={<WarehouseIssuingDashboard />} />

      </Routes>  
    </>
  );
}

export default App;
