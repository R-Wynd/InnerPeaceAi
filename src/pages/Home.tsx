import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Smile, 
  BookOpen, 
  MapPin, 
  Sparkles,
  Heart,
  Sun,
  Moon,
  ArrowRight,
  User
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getMoodPatterns } from '../services/firestoreService';
import './Home.css';

const Home: React.FC = () => {
  const { user, login, logout } = useUser();
  const [greeting, setGreeting] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [moodInsight, setMoodInsight] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    if (user) {
      loadMoodInsights();
    }
  }, [user]);

  const loadMoodInsights = async () => {
    if (!user) return;
    const patterns = await getMoodPatterns(user.id, 7);
    if (patterns.entriesCount > 0) {
      if (patterns.moodTrend === 'improving') {
        setMoodInsight("Your mood has been improving! Keep up the great work. 🌟");
      } else if (patterns.moodTrend === 'declining') {
        setMoodInsight("It looks like things have been tough lately. Remember, it's okay to ask for help. 💙");
      } else {
        setMoodInsight("Your mood has been stable. Consistency is a strength! 🌱");
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      login(name.trim(), email.trim());
      setShowLogin(false);
      setName('');
      setEmail('');
    }
  };

  const features = [
    {
      path: '/chat',
      icon: MessageCircle,
      title: 'AI Support Chat',
      description: 'Talk to our empathetic AI trained in CBT & DBT techniques',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#a5b4fc'
    },
    {
      path: '/mood',
      icon: Smile,
      title: 'Mood Tracker',
      description: 'Track your emotions and discover patterns',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      color: '#f9a8d4'
    },
    {
      path: '/journal',
      icon: BookOpen,
      title: 'Smart Journal',
      description: 'AI-powered journaling with sentiment insights',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
      color: '#86efac'
    },
    {
      path: '/therapists',
      icon: MapPin,
      title: 'Find Therapists',
      description: 'Connect with licensed professionals near you',
      gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      color: '#fdba74'
    }
  ];

  const TimeIcon = new Date().getHours() >= 18 || new Date().getHours() < 6 ? Moon : Sun;

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="greeting-section">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="greeting"
          >
            <TimeIcon size={24} className="time-icon" />
            <span>{greeting}</span>
          </motion.div>
          {user ? (
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {user.name.split(' ')[0]}
            </motion.h1>
          ) : (
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Welcome
            </motion.h1>
          )}
        </div>
        
        {user ? (
          <button className="user-btn" onClick={() => logout()}>
            <User size={20} />
          </button>
        ) : (
          <button className="login-btn" onClick={() => setShowLogin(true)}>
            Sign In
          </button>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="login-overlay"
          onClick={() => setShowLogin(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="login-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Welcome to InnerPeace</h2>
            <p>Sign in to save your progress</p>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Get Started</button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="hero-section"
      >
        <div className="hero-content">
          <Sparkles className="hero-icon" size={32} />
          <h2>Your Mental Health Companion</h2>
          <p>
            Begin your journey to inner peace with AI-powered support, 
            mood tracking, and connection to professional care.
          </p>
        </div>
        <div className="hero-decoration">
          <div className="deco-circle c1"></div>
          <div className="deco-circle c2"></div>
          <div className="deco-circle c3"></div>
        </div>
      </motion.div>

      {/* Mood Insight */}
      {moodInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="insight-card"
        >
          <Heart size={18} />
          <span>{moodInsight}</span>
        </motion.div>
      )}

      {/* Feature Cards */}
      <div className="features-section">
        <h3>Start Your Journey</h3>
        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Link to={feature.path} className="feature-card">
                  <div 
                    className="feature-icon"
                    style={{ background: feature.gradient }}
                  >
                    <Icon size={26} />
                  </div>
                  <div className="feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                  <ArrowRight 
                    size={20} 
                    className="feature-arrow"
                    style={{ color: feature.color }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="quick-start"
      >
        <Link to="/chat" className="quick-start-btn">
          <MessageCircle size={22} />
          <span>Start a conversation</span>
          <ArrowRight size={18} />
        </Link>
      </motion.div>

      {/* Footer Note */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="footer-note"
      >
        InnerPeace is not a replacement for professional mental health care.
        If you're in crisis, please call <strong>988</strong>.
      </motion.p>
    </div>
  );
};

export default Home;

