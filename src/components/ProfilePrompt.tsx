import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './ProfilePrompt.css';

const ProfilePrompt: React.FC = () => {
  const { hasCompletedProfile } = useUser();
  const [isDismissed, setIsDismissed] = React.useState(() => {
    return localStorage.getItem('profile_prompt_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('profile_prompt_dismissed', 'true');
  };

  if (hasCompletedProfile || isDismissed) {
    return null;
  }

  return (
    <div className="profile-prompt">
      <div className="profile-prompt-content">
        <div className="profile-prompt-icon">✨</div>
        <div className="profile-prompt-text">
          <h3>Get Personalized Support</h3>
          <p>Complete your profile to receive AI responses tailored to your unique situation and needs.</p>
        </div>
        <div className="profile-prompt-actions">
          <Link to="/signup" className="profile-prompt-btn-primary">
            Complete Profile
          </Link>
          <button onClick={handleDismiss} className="profile-prompt-btn-secondary">
            Maybe Later
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="profile-prompt-close" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
};

export default ProfilePrompt;
