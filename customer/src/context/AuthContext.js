import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  const [userData, setUserData] = useState(
    JSON.parse(localStorage.getItem('userData')) || null
  );

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('authToken'));
      setUserData(JSON.parse(localStorage.getItem('userData')) || null);
    };

    // Listen to localStorage changes
    window.addEventListener('storage', syncAuth);

    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUserData(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};