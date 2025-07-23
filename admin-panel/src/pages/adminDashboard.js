import React from 'react';
import { Card, Container } from 'react-bootstrap';
import { Route, Routes } from 'react-router-dom';
import '../styles/AdminDashboard.css';
import Category from './Category';
import Style from './Style';
import ViewAdmins from './Company_Admin/ViewAdmins';

export default function AdminDashboard() {
  return (
    <div className="dashboard-container">
      
      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<DashboardHome />} />
          <Route path="users" element={<ViewAdmins />} />
          <Route path="category" element={<Category />} />
          <Route path="style" element={<Style />} />
          
        </Routes>
      </main>
    </div>
  );
}

function DashboardHome() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to Admin Dashboard</h1>
            <p className="welcome-subtitle">
              Manage your e-commerce platform efficiently with our comprehensive admin tools
            </p>
            
            {/* <Row className="stats-grid">
              <Col xl={3} lg={6} md={6} sm={6} xs={12} className="mb-4">
                <Card className="stat-card h-100">
                  <Card.Body className="text-center">
                    <div className="stat-number">12</div>
                    <div className="stat-label">Total Users</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6} md={6} sm={6} xs={12} className="mb-4">
                <Card className="stat-card h-100">
                  <Card.Body className="text-center">
                    <div className="stat-number">45</div>
                    <div className="stat-label">Categories</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6} md={6} sm={6} xs={12} className="mb-4">
                <Card className="stat-card h-100">
                  <Card.Body className="text-center">
                    <div className="stat-number">128</div>
                    <div className="stat-label">Products</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6} md={6} sm={6} xs={12} className="mb-4">
                <Card className="stat-card h-100">
                  <Card.Body className="text-center">
                    <div className="stat-number">89</div>
                    <div className="stat-label">Orders</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row> */}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

