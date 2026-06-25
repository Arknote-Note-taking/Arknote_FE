import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ConfirmProvider } from './context/ConfirmContext';
import MainLayout from './layouts/MainLayout';

// Initialize dark mode from localStorage before anything renders
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AuthCallback from './pages/AuthCallback';
import SetPassword from './pages/SetPassword';

import LandingPage from './pages/LandingPage';
import Overview from './pages/Overview';
import DocumentList from './pages/DocumentList';
import AiAnalysis from './pages/AiAnalysis';
import GraphView from './pages/GraphView';
import DocumentDetail from './pages/DocumentDetail';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import OnboardingModal from './components/OnboardingModal';
import QuizHistory from './pages/QuizHistory';
import TakeQuiz from './pages/TakeQuiz';
import Flashcards from './pages/Flashcards';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main.custom-scrollbar');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <Router>
      <ScrollToTop />
      <OnboardingModal />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        <Route path="/" element={user && user.role === 'admin' ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/dashboard" element={<PrivateRoute><Overview /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><DocumentList /></PrivateRoute>} />
        <Route path="/documents/:id" element={<PrivateRoute><DocumentDetail /></PrivateRoute>} />
        <Route path="/ai" element={<PrivateRoute><AiAnalysis /></PrivateRoute>} />
        <Route path="/graph" element={<PrivateRoute><GraphView /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
        <Route path="/payment-cancel" element={<PrivateRoute><PaymentCancel /></PrivateRoute>} />
        <Route path="/quizzes" element={<PrivateRoute><QuizHistory /></PrivateRoute>} />
        <Route path="/quizzes/:id" element={<PrivateRoute><TakeQuiz /></PrivateRoute>} />
        <Route path="/flashcards" element={<PrivateRoute><Flashcards /></PrivateRoute>} />
        <Route path="/users" element={user && user.role === 'admin' ? <PrivateRoute><UserManagement /></PrivateRoute> : <Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{
         style: {
           background: '#333',
           color: '#fff',
           fontSize: '14px',
         },
      }}/>
      <ConfirmProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
