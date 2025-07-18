import React from 'react';
import Header from '../components/header';
import { Routes, Route } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

export default function WarehouseIssuingDashboard() {
  return (
    <div className="dashboard-container">
      <Header role='Warehouse_Issuing' data-testid="header-toggle-button" />

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<WarehouseIssuingHome />} />
        </Routes>
      </main>
    </div>
  );
}

function WarehouseIssuingHome() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to Warehouse Issuing Admin Dashboard</h1>
            <p className="welcome-subtitle">
              Manage warehouse issuing operations efficiently
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
