import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('krishi_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('krishi_token');
          }
        } catch (error) {
          localStorage.removeItem('krishi_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('krishi_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('krishi_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
