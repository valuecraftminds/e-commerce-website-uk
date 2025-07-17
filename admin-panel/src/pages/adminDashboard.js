import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminSidebar from '../components/adminSidebar';
import AdminRegistration from './adminRegistration';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="d-flex">
      
      {/* Sidebar component */}
      <AdminSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content wrapper */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: sidebarOpen ? '250px' : '0',
          transition: 'margin-left 0.3s ease-in-out',
          minHeight: '100vh',
        }}
      >
        {/* toggle button */}
        <nav className="navbar">
          {!sidebarOpen && (
            <button
              className="btn btn-primary"
              onClick={toggleSidebar}
            >
              &#9776;
            </button>
          )}
        </nav>

        <main className="col-12 col-md-9 p-4">
          <Routes>
            <Route path="" element={<h2>Admin Dashboard</h2>} />
            <Route path="users" element={<AdminRegistration />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

