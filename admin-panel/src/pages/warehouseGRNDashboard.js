import React from 'react';
import Header from '../components/header';
import { Routes, Route } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

export default function warehouseGRNDashboard() {
  return (
    <div className="dashboard-container">
      <Header role='Warehouse_GRN' data-testid="header-toggle-button" />

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<WarehouseGRNHome />} />
        </Routes>
      </main>
    </div>
  );
}

function WarehouseGRNHome() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to Warehouse GRN Admin Dashboard</h1>
            <p className="welcome-subtitle">
              Manage warehouse goods receipt notes efficiently
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
