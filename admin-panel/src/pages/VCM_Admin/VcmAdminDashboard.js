import { Card, Container } from 'react-bootstrap';

export default function VcmAdminDashboard() {
  return (
    <Container fluid>
      <Card className="dashboard-card">
        <Card.Body>
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome to VCM Admin Dashboard</h1>
           
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
