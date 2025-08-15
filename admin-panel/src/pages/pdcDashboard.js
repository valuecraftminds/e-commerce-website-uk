import { Card, Container } from 'react-bootstrap';

export default function PdcDashboard() {
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
