import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import axios from "axios";

import "../styles/Shop.css";
import DataFile from "../assets/DataFile";

const BASEURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Shop() {
  const { category: currentCategory } = useParams(); // Get category from URL
  const [activePopup, setActivePopup] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const togglePopup = (id) => {
    setActivePopup(activePopup === id ? null : id);
  };

  const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASEURL}/customer/main-categories`);
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch products and product types when category changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCategory) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // If categories are not loaded yet, wait for them
        if (categories.length === 0) {
          return;
        }

        // Find the category ID based on the current category name
        const matchedCategory = categories.find(
          cat => cat.category_name.toLowerCase() === currentCategory.toLowerCase()
        );

        if (!matchedCategory) {
          setError(`Category "${currentCategory}" not found`);
          setLoading(false);
          return;
        }

        // Fetch products filtered by category
        const productsResponse = await axios.get(
          `${BASEURL}/customer/product-listings?category=${matchedCategory.category_id}`
        );
        setProducts(productsResponse.data);

        // Fetch product types for this category
        const typesResponse = await axios.get(
          `${BASEURL}/customer/product-types/${matchedCategory.category_id}`
        );
        setProductTypes(typesResponse.data);

      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCategory, categories]);

  // Handle case where no category is specified
  useEffect(() => {
    const fetchAllProducts = async () => {
      if (currentCategory || categories.length === 0) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all products if no category is specified
        const productsResponse = await axios.get(`${BASEURL}/customer/product-listings`);
        setProducts(productsResponse.data);

        // Clear product types since we're showing all products
        setProductTypes([]);

      } catch (err) {
        console.error('Error fetching all products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [currentCategory, categories]);

  // Get unique product types for display
  const uniqueProductTypes = Array.from(
    new Set(productTypes.map(item => item.category_name))
  ).map(name => productTypes.find(item => item.category_name === name));

  // Loading state
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <h3>Loading {currentCategory ? `${currentCategory} products` : 'products'}...</h3>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="my-5 text-center">
        <h2>Error</h2>
        <p>{error}</p>
      </Container>
    );
  }

  return (
    <>
      {/* Banner Section - only show if category is specified */}
      {currentCategory && (
        <div className="banner mb-4">
          {DataFile.banner
            .filter((item) => item.category === currentCategory)
            .map((item) => (
              <img
                key={item.id}
                src={item.image}
                className="banner-img"
                alt={`${currentCategory} banner`}
              />
            ))}
        </div>
      )}

      <Container className="my-5">
        {/* Products Section */}
        <h2 className="mb-4 text-capitalize">
          {currentCategory ? `${currentCategory} Collection` : 'All Products'}
        </h2>
        
        {/* Show product types if available */}
        {uniqueProductTypes.length > 0 && (
          <div className="mb-4">
            <h5>More to Explore</h5>
            <div className="d-flex flex-wrap gap-2">
              {uniqueProductTypes.map((type) => (
                <span key={type.category_id} className="badge bg-secondary">
                  {type.category_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 ? (
          <Row className="flex-nowrap overflow-auto mb-5">
            {products.map((item) => (
              <Col
                key={item.style_id}
                xs={8}
                sm={6}
                md={4}
                lg={3}
                className="position-relative"
                // toggle popup when hover
                onMouseEnter={() => togglePopup(`product-${item.style_id}`)}
                onMouseLeave={() => togglePopup(null)}
                // navigate to product details page
                onClick={() => getProductDetails(item.style_id)}
              >
                <Card className="h-100 card-hover-popup">
                  <Card.Img
                    variant="top"
                    src={item.image || '/placeholder-image.jpg'}
                    alt={item.name}
                    className="new-crd"
                  />
                  <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    {item.category_name && (
                      <Card.Text className="text-muted small">
                        {item.category_name}
                      </Card.Text>
                    )}
                  </Card.Body>
                  <div
                    className={`popup-details ${
                      activePopup === `product-${item.style_id}` ? "show" : ""
                    }`}
                  >
                    <p>{item.description}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center my-5">
            <p>
              No products found
              {currentCategory ? ` in ${currentCategory} category` : ''}.
            </p>
          </div>
        )}
      </Container>
    </>
  );
}