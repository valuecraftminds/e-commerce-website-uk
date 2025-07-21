import React from 'react';
import Header from '../../components/Header';
import { Routes, Route } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

export default function VcmAdminDashboard() {
  return (
    <div className="dashboard-container">
      <Header role='VCM_Admin' data-testid="header-toggle-button" />

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<VcmAdminHome />} />
        </Routes>
      </main>
    </div>
  );
}

function VcmAdminHome() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to VCM Admin Dashboard</h1>
            {/* <p className="welcome-subtitle">
              Manage Company Admins
            </p> */}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
