import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AuthCallback from './pages/AuthCallback';
import SetPassword from './pages/SetPassword';

import Overview from './pages/Overview';
import DocumentList from './pages/DocumentList';
import AiAnalysis from './pages/AiAnalysis';
import GraphView from './pages/GraphView';
import DocumentDetail from './pages/DocumentDetail';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

const AppContent = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        <Route path="/" element={<PrivateRoute><Overview /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><DocumentList /></PrivateRoute>} />
        <Route path="/documents/:id" element={<PrivateRoute><DocumentDetail /></PrivateRoute>} />
        <Route path="/ai" element={<PrivateRoute><AiAnalysis /></PrivateRoute>} />
        <Route path="/graph" element={<PrivateRoute><GraphView /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/users" element={user && user.role === 'admin' ? <PrivateRoute><UserManagement /></PrivateRoute> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
         style: {
           background: '#333',
           color: '#fff',
           fontSize: '14px',
         },
      }}/>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
