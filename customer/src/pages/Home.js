import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import DataFile from "../assets/DataFile";
import "../styles/Shop.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getProductDetails = (id) => {
    navigate(`/product/${id}`);
  };

  // Fetch product listings from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/customer/all-styles`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching product listings:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Helper function to format price display
  const formatPrice = (minPrice, maxPrice) => {
    if (!minPrice && !maxPrice) return "Price on request";
    if (minPrice === maxPrice) return `$${minPrice}`;
    return `$${minPrice} - $${maxPrice}`;
  };

  const handleQuickView = (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking quick view
    // Add your quick view logic here
    console.log('Quick view:', product);
  };

  return (
    <>
      {/* Banner Section */}
      <div className="banner mb-4">
        <img
          src={DataFile.banner[3].image}
          className="banner-img"
          alt={`${DataFile.banner[3].category} banner`}
        />
      </div>

      <Container className="my-5">
        {/* Display products */}
        <h2 className="mb-4">Explore Your Fashion</h2>
        
        {loading ? (
          <div className="text-center my-5">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center my-5">
            <h5 className="text-danger">{error}</h5>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.style_id} 
                className="product-card"
                onClick={() => getProductDetails(product.style_id)}
              >
                <div className="product-image-container">
                  <img 
                    src={product.image || '/placeholder-image.jpg'} 
                    alt={product.name}
                    className="product-image"
                  />
                  
                  <div className="product-overlay">
                    <button 
                      className="quick-view-btn"
                      onClick={(e) => handleQuickView(e, product)}
                    >
                      Quick View
                    </button>
                  </div>
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">
                    {product.description && product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                  <div className="product-price">
                    <span className={product.min_price && product.max_price ? "price-range" : "current-price"}>
                      {formatPrice(product.min_price, product.max_price)}
                    </span>
                  </div>
                  
                  {product.variant_count && (
                    <div className="product-variants">
                      <span className="variants-label">
                        {product.variant_count} variant{product.variant_count !== 1 ? 's' : ''} available
                      </span>
                    </div>
                  )}
                  
                  {product.category_name && (
                    <div className="product-category">
                      <span className="category-badge">
                        {product.category_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* no products */}
        {!loading && !error && products.length === 0 && (
          <div className="no-products">
            <div className="no-products-content">
              <i className="fas fa-search fa-3x"></i>
              <h3>No products found</h3>
              <p>No products available at the moment.</p>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}