import { Card, Container } from 'react-bootstrap';

export default function OrderingDashboard() {
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
