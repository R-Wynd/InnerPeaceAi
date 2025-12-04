import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { saveMoodEntry, getMoodEntries, getMoodPatterns } from '../services/firestoreService';
import type { MoodEntry } from '../types';
import './MoodTracker.css';

const MOODS = [
  { value: 1, label: 'Awful', emoji: '😢', color: '#ef4444', bgColor: '#fef2f2' },
  { value: 2, label: 'Bad', emoji: '😔', color: '#f97316', bgColor: '#fff7ed' },
  { value: 3, label: 'Okay', emoji: '😐', color: '#eab308', bgColor: '#fefce8' },
  { value: 4, label: 'Good', emoji: '😊', color: '#22c55e', bgColor: '#f0fdf4' },
  { value: 5, label: 'Great', emoji: '🤗', color: '#8b5cf6', bgColor: '#f5f3ff' }
];

const EMOTIONS = [
  { name: 'Anxious', emoji: '😰' },
  { name: 'Stressed', emoji: '😤' },
  { name: 'Sad', emoji: '😢' },
  { name: 'Tired', emoji: '😴' },
  { name: 'Calm', emoji: '😌' },
  { name: 'Happy', emoji: '😄' },
  { name: 'Grateful', emoji: '🙏' },
  { name: 'Excited', emoji: '🎉' },
  { name: 'Lonely', emoji: '🥺' },
  { name: 'Hopeful', emoji: '✨' },
  { name: 'Motivated', emoji: '💪' },
  { name: 'Peaceful', emoji: '🕊️' }
];

const MoodTracker: React.FC = () => {
  const { user } = useUser();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [patterns, setPatterns] = useState<{ averageMood: number; moodTrend: string; entriesCount: number } | null>(null);

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    const userId = user?.id || 'anonymous';
    const [entriesData, patternsData] = await Promise.all([
      getMoodEntries(userId, 7),
      getMoodPatterns(userId, 7)
    ]);
    setEntries(entriesData);
    setPatterns(patternsData);
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSaveMood = async () => {
    if (selectedMood === null) return;

    setIsSaving(true);
    const selectedMoodData = MOODS.find(m => m.value === selectedMood)!;

    try {
      await saveMoodEntry({
        userId: user?.id || 'anonymous',
        mood: selectedMood,
        moodLabel: selectedMoodData.label,
        emotions: selectedEmotions,
        note: note.trim() || undefined,
        timestamp: new Date()
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        loadEntries();
      }, 2000);
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedMood(null);
    setSelectedEmotions([]);
    setNote('');
    setStep(1);
  };

  const getTrendEmoji = () => {
    if (!patterns) return '📊';
    if (patterns.moodTrend === 'improving') return '📈';
    if (patterns.moodTrend === 'declining') return '📉';
    return '➡️';
  };

  const getMoodColor = (mood: number) => MOODS[mood - 1]?.color || '#8b5cf6';

  return (
    <div className="mood-tracker">
      {/* Header */}
      <div className="mood-header">
        <div>
          <h1>Mood Check-In</h1>
          <p>How are you feeling right now? 🌸</p>
        </div>
        {patterns && patterns.entriesCount > 0 && (
          <div className="streak-badge">
            <span>{getTrendEmoji()}</span>
            <span>{patterns.entriesCount}</span>
          </div>
        )}
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="success-overlay"
          >
            <div className="success-card">
              <span className="success-emoji">✨</span>
              <h2>Saved!</h2>
              <p>Great job checking in with yourself</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="mood-content">
        {/* Step 1: Mood Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mood-step"
          >
            <h2 className="step-title">How are you feeling? 💭</h2>
            <div className="mood-options">
              {MOODS.map((mood) => (
                <motion.button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
                  style={{
                    backgroundColor: selectedMood === mood.value ? mood.bgColor : undefined,
                    borderColor: selectedMood === mood.value ? mood.color : undefined
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{mood.label}</span>
                </motion.button>
              ))}
            </div>
            {selectedMood && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="continue-btn"
                onClick={() => setStep(2)}
              >
                Continue →
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Step 2: Emotions */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mood-step"
          >
            <h2 className="step-title">What emotions? 💜</h2>
            <p className="step-subtitle">Select all that apply</p>
            <div className="emotions-grid">
              {EMOTIONS.map((emotion) => (
                <motion.button
                  key={emotion.name}
                  onClick={() => toggleEmotion(emotion.name)}
                  className={`emotion-chip ${selectedEmotions.includes(emotion.name) ? 'selected' : ''}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{emotion.emoji}</span>
                  <span>{emotion.name}</span>
                </motion.button>
              ))}
            </div>
            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="continue-btn" onClick={() => setStep(3)}>
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Note */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mood-step"
          >
            <h2 className="step-title">Any notes? 📝</h2>
            <p className="step-subtitle">Optional - share what's on your mind</p>
            <textarea
              className="note-input"
              placeholder="What's happening in your life right now..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button 
                className="save-btn"
                onClick={handleSaveMood}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Check-In ✨'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Entries */}
      {entries.length > 0 && step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="recent-section"
        >
          <h3>Recent Check-Ins 📅</h3>
          <div className="entries-list">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-mood">
                  <span className="entry-emoji">
                    {MOODS[entry.mood - 1]?.emoji}
                  </span>
                </div>
                <div className="entry-details">
                  <div className="entry-header">
                    <span 
                      className="entry-label"
                      style={{ color: getMoodColor(entry.mood) }}
                    >
                      {entry.moodLabel}
                    </span>
                    <span className="entry-date">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {entry.emotions.length > 0 && (
                    <div className="entry-emotions">
                      {entry.emotions.slice(0, 3).map(e => {
                        const emotionData = EMOTIONS.find(em => em.name === e);
                        return (
                          <span key={e} className="emotion-tag">
                            {emotionData?.emoji} {e}
                          </span>
                        );
                      })}
                      {entry.emotions.length > 3 && (
                        <span className="emotion-more">+{entry.emotions.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Stats */}
      {patterns && patterns.entriesCount > 0 && step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stats-card"
        >
          <h3>This Week 📊</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{patterns.entriesCount}</span>
              <span className="stat-label">Check-ins</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {MOODS[Math.round(patterns.averageMood) - 1]?.emoji || '😊'}
              </span>
              <span className="stat-label">Avg Mood</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{getTrendEmoji()}</span>
              <span className="stat-label">
                {patterns.moodTrend === 'improving' ? 'Improving' : 
                 patterns.moodTrend === 'declining' ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MoodTracker;
