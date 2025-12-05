import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Chatbot from './components/Chatbot';
import MoodTracker from './components/MoodTracker';
import Journal from './components/Journal';
import TherapistFinder from './components/TherapistFinder';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, user } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, user } = useUser();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useUser();
  const isLandingPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isSignUpPage = location.pathname === '/signup';
  const showNavigation = !isLandingPage && !isLoginPage && !isSignUpPage;

  if (!isLoading && user && (location.pathname === '/' || isLoginPage)) {
    // Logged-in users should not see landing or login page
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <div className="page-container chat-page">
                <Chatbot />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/mood" element={
            <ProtectedRoute>
              <div className="page-container">
                <MoodTracker />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/journal" element={
            <ProtectedRoute>
              <div className="page-container">
                <Journal />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/therapists" element={
            <ProtectedRoute>
              <div className="page-container therapist-page">
                <TherapistFinder />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {showNavigation && <Navigation />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
};

export default App;
