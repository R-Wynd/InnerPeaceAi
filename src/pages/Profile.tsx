import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { 
  User as UserIcon, 
  Briefcase, 
  Heart, 
  Calendar, 
  Activity, 
  Brain,
  FileText,
  LogOut,
  Edit
} from 'lucide-react';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, logout, completeProfile } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    relationshipStatus: '',
    occupation: '',
    currentMood: '',
    medicalHistory: '',
    physicalActivities: [] as string[],
    mentalActivities: [] as string[]
  });

  // Pre-fill form with current user data when available
  useEffect(() => {
    if (user) {
      const profile = user.profile;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        age: profile?.age ? String(profile.age) : '',
        gender: profile?.gender || '',
        relationshipStatus: profile?.relationshipStatus || '',
        occupation: profile?.occupation || '',
        currentMood: profile?.currentMood || '',
        medicalHistory: profile?.medicalHistory || '',
        physicalActivities: profile?.physicalActivities || [],
        mentalActivities: profile?.mentalActivities || []
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxToggle = (field: 'physicalActivities' | 'mentalActivities', value: string) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      const updated = exists ? prev[field].filter((v) => v !== value) : [...prev[field], value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    // Minimal validation: require name/email and age if provided
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and email are required.');
      return;
    }
    const ageNumber = formData.age ? parseInt(formData.age, 10) : undefined;
    try {
      await completeProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        profile: {
          age: ageNumber || 0,
          gender: formData.gender,
          relationshipStatus: formData.relationshipStatus,
          occupation: formData.occupation,
          currentMood: formData.currentMood,
          medicalHistory: formData.medicalHistory,
          physicalActivities: formData.physicalActivities,
          mentalActivities: formData.mentalActivities
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const profile = user.profile;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <UserIcon size={48} />
        </div>
        <h1>{user.name}</h1>
        <p className="profile-email">{user.email}</p>
        <div className="profile-actions">
          <button onClick={handleToggleEdit} className="btn-edit-profile">
            <Edit size={18} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          {isEditing && (
            <button onClick={handleSave} className="btn-edit-profile">
              Save
            </button>
          )}
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Basic Information</h2>
          <div className="profile-grid">
            <div className="profile-item">
              <Calendar className="profile-icon" size={20} />
              <div>
                <label>Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Age"
                  />
                ) : (
                  <p>{profile?.age ? `${profile.age} years old` : 'Not provided'}</p>
                )}
              </div>
            </div>
            <div className="profile-item">
              <UserIcon className="profile-icon" size={20} />
              <div>
                <label>Gender</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    placeholder="Gender"
                  />
                ) : (
                  <p>{profile?.gender || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Life Context</h2>
          <div className="profile-grid">
            <div className="profile-item">
              <Heart className="profile-icon" size={20} />
              <div>
                <label>Relationship Status</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="relationshipStatus"
                    value={formData.relationshipStatus}
                    onChange={handleInputChange}
                    placeholder="Relationship Status"
                  />
                ) : (
                  <p>{profile?.relationshipStatus || 'Not provided'}</p>
                )}
              </div>
            </div>
            <div className="profile-item">
              <Briefcase className="profile-icon" size={20} />
              <div>
                <label>Occupation</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="Occupation"
                  />
                ) : (
                  <p>{profile?.occupation || 'Not provided'}</p>
                )}
              </div>
            </div>
            <div className="profile-item">
              <Activity className="profile-icon" size={20} />
              <div>
                <label>Current Mood</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="currentMood"
                    value={formData.currentMood}
                    onChange={handleInputChange}
                    placeholder="Current Mood"
                  />
                ) : (
                  <p>{profile?.currentMood || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Health & Wellness</h2>
          <div className="profile-item profile-item-full">
            <FileText className="profile-icon" size={20} />
            <div>
              <label>Medical History</label>
              {isEditing ? (
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Medical history"
                />
              ) : (
                <p className="profile-text-area">
                  {profile?.medicalHistory || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Activities</h2>
          <div className="profile-item profile-item-full">
            <Activity className="profile-icon" size={20} />
            <div>
              <label>Physical Activities</label>
              {isEditing ? (
                <div className="profile-tags">
                  {['Walking', 'Running', 'Yoga', 'Gym', 'Swimming', 'Dancing', 'Sports', 'None'].map((activity) => (
                    <label key={activity} className="profile-tag editable-tag">
                      <input
                        type="checkbox"
                        checked={formData.physicalActivities.includes(activity)}
                        onChange={() => handleCheckboxToggle('physicalActivities', activity)}
                      />
                      <span>{activity}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="profile-tags">
                  {profile?.physicalActivities?.length
                    ? profile.physicalActivities.map((activity, index) => (
                        <span key={index} className="profile-tag">
                          {activity}
                        </span>
                      ))
                    : <span className="profile-tag">Not provided</span>}
                </div>
              )}
            </div>
          </div>
          <div className="profile-item profile-item-full">
            <Brain className="profile-icon" size={20} />
            <div>
              <label>Mental Wellness Activities</label>
              {isEditing ? (
                <div className="profile-tags">
                  {['Reading', 'Meditation', 'Journaling', 'Therapy', 'Art', 'Music', 'Learning', 'None'].map((activity) => (
                    <label key={activity} className="profile-tag editable-tag">
                      <input
                        type="checkbox"
                        checked={formData.mentalActivities.includes(activity)}
                        onChange={() => handleCheckboxToggle('mentalActivities', activity)}
                      />
                      <span>{activity}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="profile-tags">
                  {profile?.mentalActivities?.length
                    ? profile.mentalActivities.map((activity, index) => (
                        <span key={index} className="profile-tag">
                          {activity}
                        </span>
                      ))
                    : <span className="profile-tag">Not provided</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <p>
            {profile?.completedAt
              ? `Details saved on ${new Date(profile.completedAt).toLocaleDateString()}`
              : 'Profile details will appear here after signup.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
