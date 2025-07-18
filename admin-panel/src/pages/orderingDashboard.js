import React from 'react';
import Header from '../components/header';
import { Routes, Route } from 'react-router-dom';
import { Container, Card} from 'react-bootstrap';

export default function OrderingDashboard() {
  return (
    <div className="dashboard-container">
      <Header role='order' data-testid="header-toggle-button" />

      <main className="dashboard-content">
        <Routes>
          <Route path="" element={<OrderHome />} />
        </Routes>     
      </main>
    </div>
  );
}

function OrderHome() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to Ordering Admin Dashboard</h1>
            <p className="welcome-subtitle">
              Manage orders efficiently
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
