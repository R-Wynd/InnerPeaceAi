import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Smile, 
  BookOpen, 
  MapPin, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import './Landing.css';

const Landing: React.FC = () => {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <motion.div 
          className="landing-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="landing-logo">
            <Sparkles size={48} />
          </div>
          <h1 className="landing-title">Welcome to InnerPeace</h1>
          <p className="landing-subtitle">
            Your personal mental wellness companion powered by AI
          </p>
          <p className="landing-description">
            Get personalized support through evidence-based therapy techniques, 
            track your moods, journal your thoughts, and connect with professional therapists.
          </p>
          
          <div className="landing-cta">
            <Link to="/signup" className="btn-cta-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn-cta-secondary">
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="landing-features"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="feature-card">
            <div className="feature-icon">
              <MessageCircle size={32} />
            </div>
            <h3>AI Therapy Chatbot</h3>
            <p>Get instant support with CBT and DBT-based guidance tailored to your needs</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Smile size={32} />
            </div>
            <h3>Mood Tracking</h3>
            <p>Monitor your emotional patterns and gain insights into your mental health journey</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <BookOpen size={32} />
            </div>
            <h3>Journal & Reflect</h3>
            <p>Write your thoughts, analyze patterns, and understand yourself better</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <MapPin size={32} />
            </div>
            <h3>Find Therapists</h3>
            <p>Discover licensed therapists near you when you need professional support</p>
          </div>
        </motion.div>

        <div className="landing-footer">
          <p>Start your journey to better mental health today</p>
          <ChevronRight className="landing-arrow" size={24} />
        </div>
      </div>
    </div>
  );
};

export default Landing;
