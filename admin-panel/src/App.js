import React from 'react';
import { Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Home from './pages/home';
import Header from './components/header';
import Login from './pages/login';
import AdminDashboard from './pages/adminDashboard';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />

        {/* <Route path='signup' element={<Signup />} /> */}
        <Route path='login' element={<Login />} />
        <Route path='dashboard/*' element={<AdminDashboard />} />
      </Routes>
      </>
  );
}

export default App;
