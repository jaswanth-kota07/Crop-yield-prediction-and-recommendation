import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen text-primary"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen text-primary"><div className="loader"></div></div>;
  if (user) return <Navigate to="/dashboard" />;
  
  return children;
};

import Chatbot from './components/Chatbot';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Chatbot />
    </>
  );
}

export default App;
