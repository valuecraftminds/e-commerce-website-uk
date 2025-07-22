import React from 'react';
import { Container, Card } from 'react-bootstrap';

export default function WarehouseGRNDashboard() {
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
