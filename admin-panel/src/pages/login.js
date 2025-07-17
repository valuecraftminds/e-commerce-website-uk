import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Form submitted:", formData);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Login successful:", data);
        login(data.token); // Call the login function from AuthContext
        navigate('/dashboard');
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container p-4" style={{ maxWidth: '600px' }}>
      <h1 className="mb-4">Sign In</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label"> Email:</label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-control"
            // autoComplete="email"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-control"
            // autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">Sign In</button>
      </form>
    </div>
  );
}

