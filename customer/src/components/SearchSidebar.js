import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import "../styles/SearchSidebar.css"; 

export default function SearchSidebar({ show, onClose, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (onSearch) {
      const delayDebounce = setTimeout(() => {
        onSearch(searchTerm);
      }, 300); 
      return () => clearTimeout(delayDebounce);
    }
  }, [searchTerm, onSearch]);

  return (
    <div className={`search-sidebar bg-white shadow position-fixed top-0 end-0 h-100 p-4 ${show ? "show" : ""}`} >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Type it. Find it. Love it</h5>
        <button className="btn-close" onClick={onClose} />
      </div>

      <Form>
        <Form.Group controlId="searchInput">
          <Form.Control
            type="text"
            placeholder="Search..."
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </Form.Group>
      </Form>
    </div>
  );
}
