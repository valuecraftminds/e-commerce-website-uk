import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import '../styles/FooterPage.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function FooterPage() {
  const { slug } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/customer/page/${slug}`);
        
        if (response.data.success) {
          setPageData(response.data.data);
        } else {
          setError('Page not found');
        }
      } catch (err) {
        console.error('Error fetching page content:', err);
        if (err.response?.status === 404) {
          setError('Page not found');
        } else {
          setError('Failed to load page content');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPageContent();
    }
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading page content...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <h4>Oops! {error}</h4>
              <p>The page you're looking for might have been moved, deleted, or doesn't exist.</p>
              <Link to="/" className="btn btn-primary">
                Go to Homepage
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!pageData) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="warning" className="text-center">
              <h4>No content available</h4>
              <p>This page exists but has no content to display.</p>
              <Link to="/" className="btn btn-primary">
                Go to Homepage
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageData.page_title}</title>
        <meta property="og:title" content={pageData.page_title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <Container className="py-4">
        {/* Breadcrumb Navigation */}
        <Row>
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item linkAs={Link} linkProps={{to: "/"}}>
                Home
              </Breadcrumb.Item>
              <Breadcrumb.Item active>
                {pageData.page_title}
              </Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>

        {/* Page Content */}
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 p-md-5">
                {/* Page Header */}
                <div className="text-center mb-4">
                  <h1 className="display-5 fw-bold text-primary mb-3">
                    {pageData.page_title}
                  </h1>
                  {pageData.page_description && (
                    <p className="lead text-muted">
                      {pageData.page_description}
                    </p>
                  )}
                  <hr className="my-4" />
                </div>

                {/* Page Content */}
                <div 
                  className="page-content"
                  dangerouslySetInnerHTML={{ __html: pageData.page_content }}
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: '#333'
                  }}
                />

                {/* Page Footer */}
                <div className="mt-5 pt-4 border-top">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <small className="text-muted">
                        Last updated: {new Date(pageData.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </small>
                    </div>
                    <div className="col-md-6 text-md-end">
                      <Link to="/" className="btn btn-outline-primary btn-sm">
                        ← Back to Home
                      </Link>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      
    </>
  );
}
