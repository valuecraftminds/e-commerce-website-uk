import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

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

      {/* Custom CSS for page content */}
      <style jsx>{`
        .page-content h1, .page-content h2, .page-content h3, .page-content h4, .page-content h5, .page-content h6 {
          color: #2c3e50;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .page-content h1 {
          font-size: 2.5rem;
          font-weight: 600;
        }
        
        .page-content h2 {
          font-size: 2rem;
          font-weight: 600;
        }
        
        .page-content h3 {
          font-size: 1.75rem;
          font-weight: 500;
        }
        
        .page-content p {
          margin-bottom: 1.5rem;
        }
        
        .page-content ul, .page-content ol {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
        }
        
        .page-content li {
          margin-bottom: 0.5rem;
        }
        
        .page-content blockquote {
          border-left: 4px solid #007bff;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          background-color: #f8f9fa;
          padding: 1rem 1.5rem;
          border-radius: 0.375rem;
        }
        
        .page-content code {
          background-color: #f1f3f4;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        
        .page-content pre {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .page-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        
        .page-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        
        .page-content th, .page-content td {
          border: 1px solid #dee2e6;
          padding: 0.75rem;
          text-align: left;
        }
        
        .page-content th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        
        .page-content a {
          color: #007bff;
          text-decoration: none;
        }
        
        .page-content a:hover {
          color: #0056b3;
          text-decoration: underline;
        }
        
        .page-content hr {
          margin: 2rem 0;
          border-color: #dee2e6;
        }
      `}</style>
    </>
  );
}
