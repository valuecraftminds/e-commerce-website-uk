// ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { use } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = use(AuthProvider);
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login with return URL
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in, render the protected component
  return children;
};

export default ProtectedRoute;