import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Container, Card, Row, Col } from 'react-bootstrap';
import RegisterPage from './RegisterPage';
import Header from '../components/Header';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <Header role='Admin' data-testid="header-toggle-button" />
      
      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<DashboardHome />} />
          <Route path="users" element={<RegisterPage />} />
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
            
            <Row className="stats-grid">
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
            </Row>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

