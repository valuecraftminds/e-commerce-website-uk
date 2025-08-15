import { Card, Container } from 'react-bootstrap';

export default function WarehouseIssuingDashboard() {
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
