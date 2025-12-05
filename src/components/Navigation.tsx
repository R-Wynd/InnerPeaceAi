import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Smile, BookOpen, User } from 'lucide-react';
import './Navigation.css';

const navItems = [
  { path: '/home', label: 'Home', Icon: Home },
  { path: '/chat', label: 'Chat', Icon: MessageCircle },
  { path: '/mood', label: 'Mood', Icon: Smile },
  { path: '/journal', label: 'Journal', Icon: BookOpen },
  { path: '/profile', label: 'Profile', Icon: User }
];

const Navigation: React.FC = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <item.Icon 
                size={24} 
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="active-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
