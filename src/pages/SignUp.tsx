import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Eye, EyeOff, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import './SignUp.css';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { completeProfile, register, user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    relationshipStatus: '',
    occupation: '',
    currentMood: '',
    medicalHistory: '',
    physicalActivities: [] as string[],
    mentalActivities: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const relationshipOptions = ['Single', 'In a relationship', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];
  const moodOptions = [
    { label: 'Anxious', emoji: '😰' },
    { label: 'Stressed', emoji: '😓' },
    { label: 'Neutral', emoji: '😐' },
    { label: 'Happy', emoji: '😊' },
    { label: 'Excited', emoji: '🤩' }
  ];
  const physicalActivityOptions = ['Walking', 'Running', 'Yoga', 'Gym', 'Swimming', 'Dancing', 'Sports', 'None'];
  const mentalActivityOptions = ['Reading', 'Meditation', 'Journaling', 'Therapy', 'Art', 'Music', 'Learning', 'None'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (category: 'physicalActivities' | 'mentalActivities', value: string) => {
    setFormData(prev => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  useEffect(() => {
    if (user && user.profile) {
      const profile = user.profile;
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        age: profile.age ? String(profile.age) : prev.age,
        gender: profile.gender || prev.gender,
        relationshipStatus: profile.relationshipStatus || prev.relationshipStatus,
        occupation: profile.occupation || prev.occupation,
        currentMood: profile.currentMood || prev.currentMood,
        medicalHistory: profile.medicalHistory || prev.medicalHistory,
        physicalActivities: profile.physicalActivities?.length
          ? [...profile.physicalActivities]
          : prev.physicalActivities,
        mentalActivities: profile.mentalActivities?.length
          ? [...profile.mentalActivities]
          : prev.mentalActivities,
      }));
    }
  }, [user]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!user) {
        if (!formData.password.trim()) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (!formData.confirmPassword.trim()) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
      if (!formData.age) newErrors.age = 'Age is required';
      else if (parseInt(formData.age) < 13 || parseInt(formData.age) > 120) {
        newErrors.age = 'Please enter a valid age';
      }
      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    if (step === 2) {
      if (!formData.relationshipStatus) newErrors.relationshipStatus = 'Relationship status is required';
      if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
      if (!formData.currentMood) newErrors.currentMood = 'Current mood is required';
    }

    if (step === 3) {
      if (!formData.medicalHistory.trim()) newErrors.medicalHistory = 'Required (or type "None")';
      if (formData.physicalActivities.length === 0) newErrors.physicalActivities = 'Select at least one';
      if (formData.mentalActivities.length === 0) newErrors.mentalActivities = 'Select at least one';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === 1 && !user) {
      try {
        await register(formData.name, formData.email, formData.password);
      } catch (error: any) {
        let message = 'Failed to create account. Please try again.';
        if (error?.code === 'auth/email-already-in-use') {
          message = 'This email is already in use. Try logging in instead.';
        } else if (error?.code === 'auth/weak-password') {
          message = 'Password is too weak. Please choose a stronger password.';
        }
        setErrors(prev => ({ ...prev, submit: message }));
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      await completeProfile({
        name: formData.name,
        email: formData.email,
        profile: {
          age: parseInt(formData.age),
          gender: formData.gender,
          relationshipStatus: formData.relationshipStatus,
          occupation: formData.occupation,
          currentMood: formData.currentMood,
          medicalHistory: formData.medicalHistory,
          physicalActivities: formData.physicalActivities,
          mentalActivities: formData.mentalActivities
        }
      });
      navigate('/home');
    } catch (error) {
      console.error('Error completing profile:', error);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    }
  };

  const renderStep1 = () => (
    <div className="signup-step">
      <div className="input-group">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Full Name"
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div className="input-group">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email"
          className={errors.email ? 'error' : ''}
          disabled={!!user}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      {!user && (
        <>
          <div className="input-row">
            <div className="input-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="input-group">
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>
        </>
      )}

      <div className="input-row">
        <div className="input-group">
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            placeholder="Age"
            min="13"
            max="120"
            className={errors.age ? 'error' : ''}
          />
          {errors.age && <span className="error-text">{errors.age}</span>}
        </div>

        <div className="input-group">
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className={`select-input ${errors.gender ? 'error' : ''} ${!formData.gender ? 'placeholder' : ''}`}
          >
            <option value="" disabled>Gender</option>
            {genderOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.gender && <span className="error-text">{errors.gender}</span>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="signup-step">
      <div className="input-group">
        <select
          name="relationshipStatus"
          value={formData.relationshipStatus}
          onChange={handleInputChange}
          className={`select-input ${errors.relationshipStatus ? 'error' : ''} ${!formData.relationshipStatus ? 'placeholder' : ''}`}
        >
          <option value="" disabled>Relationship Status</option>
          {relationshipOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {errors.relationshipStatus && <span className="error-text">{errors.relationshipStatus}</span>}
      </div>

      <div className="input-group">
        <input
          type="text"
          name="occupation"
          value={formData.occupation}
          onChange={handleInputChange}
          placeholder="Occupation (e.g., Student, Engineer)"
          className={errors.occupation ? 'error' : ''}
        />
        {errors.occupation && <span className="error-text">{errors.occupation}</span>}
      </div>

      <div className="input-group">
        <label className="field-label">How are you feeling today?</label>
        <div className="mood-grid">
          {moodOptions.map(mood => (
            <button
              key={mood.label}
              type="button"
              className={`mood-chip ${formData.currentMood === mood.label ? 'selected' : ''}`}
              onClick={() => {
                setFormData(prev => ({ ...prev, currentMood: mood.label }));
                if (errors.currentMood) setErrors(prev => ({ ...prev, currentMood: '' }));
              }}
            >
              <span className="mood-emoji">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
        {errors.currentMood && <span className="error-text">{errors.currentMood}</span>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="signup-step">
      <div className="input-group">
        <textarea
          name="medicalHistory"
          value={formData.medicalHistory}
          onChange={handleInputChange}
          placeholder="Medical/Mental health history (or type 'None')"
          rows={3}
          className={errors.medicalHistory ? 'error' : ''}
        />
        {errors.medicalHistory && <span className="error-text">{errors.medicalHistory}</span>}
        <small className="hint-text">🔒 Your privacy is important. This information is secure.</small>
      </div>

      <div className="input-group">
        <label className="field-label">Physical Activities</label>
        <div className="chip-grid">
          {physicalActivityOptions.map(activity => (
            <button
              key={activity}
              type="button"
              className={`activity-chip ${formData.physicalActivities.includes(activity) ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('physicalActivities', activity)}
            >
              {formData.physicalActivities.includes(activity) && <Check size={14} />}
              <span>{activity}</span>
            </button>
          ))}
        </div>
        {errors.physicalActivities && <span className="error-text">{errors.physicalActivities}</span>}
      </div>

      <div className="input-group">
        <label className="field-label">Mental Wellness Activities</label>
        <div className="chip-grid">
          {mentalActivityOptions.map(activity => (
            <button
              key={activity}
              type="button"
              className={`activity-chip ${formData.mentalActivities.includes(activity) ? 'selected' : ''}`}
              onClick={() => handleCheckboxChange('mentalActivities', activity)}
            >
              {formData.mentalActivities.includes(activity) && <Check size={14} />}
              <span>{activity}</span>
            </button>
          ))}
        </div>
        {errors.mentalActivities && <span className="error-text">{errors.mentalActivities}</span>}
      </div>
    </div>
  );

  return (
    <div className="auth-container signup-container">
      <div className="auth-card signup-card">
        {/* Left - Form */}
        <div className="auth-form-section">
          <div className="auth-form-content signup-form-content">
            <h1>{user ? 'Update Profile' : 'Create Account'}</h1>
            <p className="auth-subtitle">
              {currentStep === 1 && 'Let\'s get started with your basic info'}
              {currentStep === 2 && 'Tell us about your current life context'}
              {currentStep === 3 && 'Almost done! Help us personalize your experience'}
            </p>

            {/* Progress Steps */}
            <div className="step-progress">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={`step-indicator ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                >
                  {step < currentStep ? <Check size={14} /> : step}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {errors.submit && <div className="error-banner">{errors.submit}</div>}

              <div className="signup-actions">
                {currentStep > 1 && (
                  <button type="button" onClick={handlePrevious} className="btn-auth-secondary">
                    <ChevronLeft size={18} />
                    Back
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button type="button" onClick={handleNext} className="btn-auth-primary">
                    Continue
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="submit" className="btn-auth-primary">
                    Complete Setup
                    <Check size={18} />
                  </button>
                )}
              </div>
            </form>

            {!user && (
              <p className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            )}
          </div>
        </div>
        {/* Right - Illustration */}
        <div className="auth-illustration-section signup-illustration">
          <div className="illustration-content">
            <div className="illustration-image">
              <img
                src="/meditation-concept_23-2148520004.jpg"
                alt="Meditation illustration"
                className="auth-illustration-img"
              />
            </div>
            <div className="carousel-dots">
              <span className={`dot ${currentStep === 1 ? 'active' : ''}`}></span>
              <span className={`dot ${currentStep === 2 ? 'active' : ''}`}></span>
              <span className={`dot ${currentStep === 3 ? 'active' : ''}`}></span>
            </div>
            <h2>Begin your wellness journey</h2>
            <p>Personalized mental health support powered by <strong>InnerPeace AI</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
