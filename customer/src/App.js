
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import ProductCategory from './pages/ProductCategory';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Cart from './components/Cart';
import UserMenu from './pages/UserMenu';
import ProtectedRoute from './components/ProtectedRoute';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Axios interceptors setup
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Let ProtectedRoute handle the redirect
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="App">
          <NavBar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop/:category" element={<Shop />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/shop/:category/:productType" element={<ProductCategory />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cart" element={<Cart />} />
              
              {/* Protected Routes */}
              {/* <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } /> */}
              
              <Route path="/usermenu" element={
                <ProtectedRoute>
                  <UserMenu />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserMenu />
                </ProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <ProtectedRoute>
                  <div className="container mt-4">
                    <h2>My Orders</h2>
                    <p>Orders page coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/wishlist" element={
                <ProtectedRoute>
                  <div className="container mt-4">
                    <h2>My Wishlist</h2>
                    <p>Wishlist page coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/account-settings" element={
                <ProtectedRoute>
                  <div className="container mt-4">
                    <h2>Account Settings</h2>
                    <p>Account settings page coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;