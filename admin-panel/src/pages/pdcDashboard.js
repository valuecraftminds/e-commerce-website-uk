import React from 'react';
import Header from '../components/header';
import { Routes, Route } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

export default function PdcDashboard() {
  return (
    <div className="dashboard-container">
      <Header role='PDC' data-testid="header-toggle-button" />

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<PdcHome />} />
        </Routes>
      </main>
    </div>
  );
}

function PdcHome() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to PDC Admin Dashboard</h1>
            <p className="welcome-subtitle">
              Manage product distribution center operations efficiently
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
