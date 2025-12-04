import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Chatbot from './components/Chatbot';
import MoodTracker from './components/MoodTracker';
import Journal from './components/Journal';
import TherapistFinder from './components/TherapistFinder';
import './App.css';

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
        <div className="app">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={
                <div className="page-container chat-page">
                  <Chatbot />
                </div>
              } />
              <Route path="/mood" element={
                <div className="page-container">
                  <MoodTracker />
                </div>
              } />
              <Route path="/journal" element={
                <div className="page-container">
                  <Journal />
                </div>
              } />
              <Route path="/therapists" element={
                <div className="page-container therapist-page">
                  <TherapistFinder />
      </div>
              } />
            </Routes>
          </main>
          <Navigation />
      </div>
      </Router>
    </UserProvider>
  );
};

export default App;
