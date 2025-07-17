import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export default function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="d-flex justify-content-between align-items-center p-3 bg-light flex-wrap">
      <nav>
        <Link to="/" className="me-3 text-decoration-none text-dark">Home</Link>
        <Link to="/about" className="text-decoration-none text-dark">About</Link>
      </nav>

      <div>
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="me-2">
              <button className="btn btn-outline-primary btn-sm">Sign In</button>
            </Link>
            <Link to="/signup">
              <button className="btn btn-primary btn-sm">Sign Up</button>
            </Link>
          </>
        ) : (
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
