import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import ProductCategory from './pages/ProductCategory';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Cart from './components/Cart';
import UserMenu from './components/UserMenu';
import ProtectedRoute from './components/ProtectedRoute';
import AccountSettings from './pages/AccountSettings';
import Wishlist from './pages/Wishlist';
import OrdersHistory from './pages/OrdersHistory';
import OrderDetails from './pages/OrderDetails';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import './App.css';

// Axios interceptors setup
// axios.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem('authToken');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );
//
// axios.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response?.status === 401) {
//             localStorage.removeItem('authToken');
//             localStorage.removeItem('userData');
//         }
//         return Promise.reject(error);
//     }
// );

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Listen for sidebar state changes from NavBar
    useEffect(() => {
        const handleSidebarStateChange = (event) => {
            setSidebarOpen(event.detail.isOpen);
        };

        window.addEventListener('sidebarStateChange', handleSidebarStateChange);

        return () => {
            window.removeEventListener('sidebarStateChange', handleSidebarStateChange);
        };
    }, []);

    return (
        <AuthProvider>
            <CartProvider>
                <div className="App">
                    <NavBar onSidebarStateChange={setSidebarOpen} />

                    {/* Main Content Wrapper */}
                    <div className={`main-content-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
                        <main>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/shop/:category" element={<Shop />} />
                                <Route path="/product/:id" element={<ProductDetails />} />
                                <Route path="/shop/:category/:productType" element={<ProductCategory />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/account-settings" element={<AccountSettings />} />
                                <Route path="/wishlist" element={<Wishlist />} />
                                <Route path="/orders-history" element={<OrdersHistory />} />
                                <Route path="/orders/:orderId" element={<OrderDetails />} />

                                {/* Protected Routes */}
                                <Route path="/usermenu" element={
                                    <ProtectedRoute>
                                        <UserMenu />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </div>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;