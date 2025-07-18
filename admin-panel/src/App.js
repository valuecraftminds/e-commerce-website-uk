import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import AdminDashboard from './pages/adminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderingDashboard from './pages/orderingDashboard';
import PdcDashboard from './pages/pdcDashboard';
import WarehouseGRNDashboard from './pages/warehouseGRNDashboard';
import WarehouseIssuingDashboard from './pages/warehouseIssuingDashboard';


function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='register' element={<RegisterPage />} />
        <Route path='dashboard/*' element={<AdminDashboard />} />
        <Route path='/orderingDashboard/*' element={<OrderingDashboard />} />
        <Route path='/pdcDashboard/*' element={<PdcDashboard />} />
        <Route path='/warehouseGRNDashboard/*' element={<WarehouseGRNDashboard />} />
        <Route path='/warehouseIssuingDashboard/*' element={<WarehouseIssuingDashboard />} />

      </Routes>  
    </>
  );
}

export default App;
