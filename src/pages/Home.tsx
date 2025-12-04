import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Smile, 
  BookOpen, 
  MapPin, 
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Heart
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getMoodPatterns, getMoodEntries } from '../services/firestoreService';
import type { MoodEntry } from '../types';
import { isToday } from 'date-fns';
import './Home.css';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '😊',
  5: '🤩'
};

const Home: React.FC = () => {
  const { user, login, logout } = useUser();
  const [greeting, setGreeting] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [moodTrend, setMoodTrend] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    const entries = await getMoodEntries(user.id, 7);
    const today = entries.find(e => isToday(new Date(e.timestamp)));
    setTodayMood(today || null);
    
    const patterns = await getMoodPatterns(user.id, 7);
    if (patterns.entriesCount > 0) {
      if (patterns.moodTrend === 'improving') {
        setMoodTrend("Your mood has been improving! Keep it up! 🌟");
      } else if (patterns.moodTrend === 'declining') {
        setMoodTrend("It's been a tough week. Remember to be kind to yourself 💜");
      } else {
        setMoodTrend("You're staying steady. That's strength! 💪");
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

  const TimeIcon = new Date().getHours() >= 18 || new Date().getHours() < 6 ? Moon : Sun;

  const features = [
    {
      path: '/chat',
      icon: MessageCircle,
      emoji: '💬',
      title: 'Talk to AI',
      subtitle: 'CBT & DBT exercises',
      color: 'var(--primary-500)',
      bg: 'var(--primary-100)'
    },
    {
      path: '/mood',
      icon: Smile,
      emoji: '😊',
      title: 'Track Mood',
      subtitle: 'Log how you feel',
      color: 'var(--accent-500)',
      bg: 'var(--accent-100)'
    },
    {
      path: '/journal',
      icon: BookOpen,
      emoji: '📝',
      title: 'Journal',
      subtitle: 'Write & reflect',
      color: 'var(--warm-500)',
      bg: 'var(--warm-100)'
    },
    {
      path: '/therapists',
      icon: MapPin,
      emoji: '🏥',
      title: 'Find Help',
      subtitle: 'Nearby therapists',
      color: '#6366f1',
      bg: '#e0e7ff'
    }
  ];

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="greeting-section">
          <div className="greeting-row">
            <TimeIcon size={20} className="time-icon" />
            <span className="greeting-text">{greeting}</span>
          </div>
          <h1 className="user-name">
            {user ? user.name.split(' ')[0] : 'Friend'} 👋
          </h1>
        </div>
        
        {user ? (
          <button className="profile-btn" onClick={() => logout()}>
            <span className="profile-initial">{user.name.charAt(0)}</span>
          </button>
        ) : (
          <button className="login-btn" onClick={() => setShowLogin(true)}>
            Sign In
          </button>
        )}
      </header>

      {/* Login Modal */}
      {showLogin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="login-overlay"
          onClick={() => setShowLogin(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="login-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="modal-emoji">🧘</span>
            <h2>Welcome to InnerPeace</h2>
            <p>Start your wellness journey</p>
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
              <button type="submit">Get Started ✨</button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-card"
      >
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Your Daily Check-in</span>
          </div>
          {todayMood ? (
            <>
              <h2>Today you felt {todayMood.moodLabel}</h2>
              <span className="hero-emoji">{MOOD_EMOJIS[todayMood.mood]}</span>
            </>
          ) : (
            <>
              <h2>How are you feeling today?</h2>
              <Link to="/mood" className="hero-cta">
                Log your mood <ChevronRight size={18} />
              </Link>
            </>
          )}
        </div>
        <div className="hero-illustration">
          <span className="floating-emoji e1">🌸</span>
          <span className="floating-emoji e2">✨</span>
          <span className="floating-emoji e3">🍃</span>
        </div>
      </motion.div>

      {/* Mood Insight */}
      {moodTrend && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="insight-card"
        >
          <Heart size={18} />
          <span>{moodTrend}</span>
        </motion.div>
      )}

      {/* Quick Actions */}
      <section className="features-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link to={feature.path} className="feature-card">
                <div 
                  className="feature-icon"
                  style={{ background: feature.bg, color: feature.color }}
                >
                  <span className="feature-emoji">{feature.emoji}</span>
                </div>
                <div className="feature-text">
                  <h4>{feature.title}</h4>
                  <p>{feature.subtitle}</p>
                </div>
                <ChevronRight size={18} className="feature-arrow" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Start Conversation CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="cta-section"
      >
        <Link to="/chat" className="cta-button">
          <MessageCircle size={20} />
          <span>Start a conversation</span>
          <ChevronRight size={18} />
        </Link>
      </motion.div>

      {/* Footer Note */}
      <p className="footer-note">
        🆘 If you're in crisis, call <strong>988</strong>
      </p>
    </div>
  );
};

export default Home;
