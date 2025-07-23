import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";


import '../styles/NavBar.css';
import logo from '../assets/logo.png';

export default function NavigationBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold fs-4" href="/">
            <img src={logo} alt="Company logo" style={{ height: "40px", objectFit: "contain" }} />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className="collapse navbar-collapse d-flex justify-content-between w-100"
          id="navbarSupportedContent"
        >
          {/* Left side */}
          <ul className="navbar-nav d-flex align-items-center flex-grow-1">
            <li className="nav-item">
              <a className="nav-link mx-2" href="/women">
                Women
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link mx-2" href="/men">
                Men
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link mx-2" href="/kids">
                Kids
              </a>
            </li>
          </ul>

          {/* Right side */}
          <form className="d-flex me-3" role="search" style={{ maxWidth: 280 }}>
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </form>
          <ul className="navbar-nav d-flex align-items-center">
            <li className="nav-item me-3">
              <a className="nav-link" href="/cart">
                🛒 Cart
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/signup">
                Signup
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
