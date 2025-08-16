import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../styles/SearchSidebar.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function SearchSidebar({ show, onClose }) {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchTerm.length > 2 && COMPANY_CODE) {
      const delayDebounce = setTimeout(async () => {
        setLoading(true);
        setError("");
        try {
          const response = await axios.get(`${BASE_URL}/api/customer/search`, {
            params: { 
              q: searchTerm,
              company_code: COMPANY_CODE
            },
            timeout: 10000, // 10 second timeout
          });
          
          setResults(response.data);
        } catch (error) {
          console.error("Error fetching search results:", error);
          
          if (error.code === 'ECONNABORTED') {
            setError("Request timed out. Please try again.");
          } else if (error.response) {
            setError(error.response.data?.error || `Server error: ${error.response.status}`);
          } else if (error.request) {
            setError("Network error. Please check your connection.");
          } else {
            setError("An unexpected error occurred.");
          }
          
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setResults([]);
      setError("");
      if (searchTerm.length > 2 && !COMPANY_CODE) {
        setError("Company code not configured");
      }
    }
  }, [searchTerm]);

  const handleResultClick = (item) => {
    navigate(`/product/${item.style_id}`);
    onClose();
    setSearchTerm("");
  };

  return (
    <div className={`search-sidebar bg-white shadow position-fixed top-0 end-0 h-100 p-4 ${show ? "show" : ""}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Type it. Find it. Love it</h5>
        <button className="btn-close" onClick={onClose} />
      </div>

      <Form>
        <Form.Group controlId="searchInput">
          <Form.Control
            type="text"
            placeholder="Search styles..."
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </Form.Group>
      </Form>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-3 text-center">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      {/* No results message */}
      {searchTerm.length > 2 && !loading && results.length === 0 && !error && (
        <div className="mt-3 text-muted text-center">
          <p>No results found for "{searchTerm}"</p>
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="mt-3">
          <h6 className="text-muted mb-2">Search Results ({results.length})</h6>
          <div className="search-results">
            {results.map(item => (
              <div 
                key={item.style_id} 
                className="search-result-item p-3 border-bottom cursor-pointer hover-bg-light"
                onClick={() => handleResultClick(item)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleResultClick(item);
                  }
                }}
              >
                <div className="d-flex align-items-start">
                  {/* Product image */}
                  {item.image && (
                    <div className="flex-shrink-0 me-3">
                      <img 
                        src={`${BASE_URL}/uploads/styles/${item.image}`}
                        alt={item.name}
                        className="search-result-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Product details */}
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-semibold">{item.name}</h6>
                    {item.description && (
                      <p className="mb-0 small text-muted mt-1">
                        {item.description.length > 100 
                          ? `${item.description.substring(0, 100)}...` 
                          : item.description
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
