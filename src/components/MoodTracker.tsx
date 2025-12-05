import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { saveMoodEntry, getMoodEntries, getMoodPatterns } from '../services/firestoreService';
import type { MoodEntry } from '../types';
import { moodIllustrations } from '../assets/illustrations';
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
  const [moodChangePercent, setMoodChangePercent] = useState<number | null>(null);

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

    if (entriesData.length >= 2) {
      const midpoint = Math.floor(entriesData.length / 2);
      const recentEntries = entriesData.slice(0, midpoint);
      const olderEntries = entriesData.slice(midpoint);

      const recentAvg =
        recentEntries.length > 0
          ? recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length
          : 0;
      const olderAvg =
        olderEntries.length > 0
          ? olderEntries.reduce((sum, e) => sum + e.mood, 0) / olderEntries.length
          : 0;

      if (olderAvg > 0) {
        const diff = recentAvg - olderAvg;
        const percent = Math.max(-100, Math.min(100, (diff / olderAvg) * 100));
        setMoodChangePercent(percent);
      } else {
        setMoodChangePercent(null);
      }
    } else {
      setMoodChangePercent(null);
    }
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

  const chartData = useMemo(() => {
    if (!entries.length) return [];
    // Oldest first for a left-to-right line
    const sorted = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return sorted.slice(-7).map((entry) => ({
      label: entry.timestamp.toLocaleDateString('en-US', { weekday: 'short' }),
      mood: entry.mood
    }));
  }, [entries]);

  const chartPath = useMemo(() => {
    if (!chartData.length) return '';
    const maxX = chartData.length > 1 ? chartData.length - 1 : 1;
    return chartData
      .map((point, index) => {
        const x = (index / maxX) * 100;
        // map mood 1-5 into svg Y (5 at top, 1 at bottom)
        const minY = 10;
        const maxY = 38;
        const t = (point.mood - 1) / 4; // 0-1
        const y = maxY - t * (maxY - minY);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [chartData]);

  const averageMoodRounded =
    patterns && patterns.averageMood ? Math.round(patterns.averageMood) : null;
  const illustrationSrc =
    averageMoodRounded && averageMoodRounded >= 1 && averageMoodRounded <= 5
      ? moodIllustrations[averageMoodRounded as 1 | 2 | 3 | 4 | 5]
      : null;

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
      <div className="mood-layout">
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

        {/* Insights / Illustration column */}
        {patterns && patterns.entriesCount > 0 && (
          <div className="mood-insights">
            <div className="mood-hero-card">
              {illustrationSrc && (
                <div className="mood-hero-illustration">
                  <img src={illustrationSrc} alt="Mood illustration" />
                </div>
              )}
              <div className="mood-hero-text">
                <span className="mood-hero-label">This week</span>
                <h2>
                  You’ve been feeling{' '}
                  <span>
                    {MOODS[averageMoodRounded ? averageMoodRounded - 1 : 3]?.label || 'Okay'}
                  </span>
                </h2>
                {moodChangePercent !== null && (
                  <p
                    className={`mood-change-pill ${
                      moodChangePercent >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {moodChangePercent >= 0 ? '▲' : '▼'}{' '}
                    {Math.abs(Math.round(moodChangePercent))}% vs earlier check-ins
                  </p>
                )}
              </div>
            </div>

            {chartData.length > 1 && (
              <div className="mood-chart-card">
                <div className="mood-chart-header">
                  <span>Mood over time</span>
                  <span className="mood-chart-scale">Awful → Great</span>
                </div>
                <div className="mood-chart-wrapper">
                  <svg
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                    className="mood-chart-svg"
                  >
                    <defs>
                      <linearGradient id="moodLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    <path
                      d={chartPath}
                      fill="none"
                      stroke="url(#moodLine)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    {chartData.map((point, index) => {
                      const maxX = chartData.length > 1 ? chartData.length - 1 : 1;
                      const x = (index / maxX) * 100;
                      const minY = 10;
                      const maxY = 38;
                      const t = (point.mood - 1) / 4;
                      const y = maxY - t * (maxY - minY);
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r={1.6}
                          className="mood-chart-dot"
                        />
                      );
                    })}
                  </svg>
                  <div className="mood-chart-labels">
                    {chartData.map((point, index) => (
                      <span key={index}>{point.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary row */}
      {step === 1 && (entries.length > 0 || (patterns && patterns.entriesCount > 0)) && (
        <div className="mood-summary">
          {/* Recent Entries */}
          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="recent-section"
            >
              <div className="section-header-row">
                <div>
                  <h3>Recent Check-Ins 📅</h3>
                  <p className="section-subtitle">Your last 5 moods and emotions</p>
                </div>
              </div>
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
          {patterns && patterns.entriesCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="stats-card"
            >
              <div className="section-header-row">
                <div>
                  <h3>This Week 📊</h3>
                  <p className="section-subtitle">Snapshot of your check-ins</p>
                </div>
              </div>
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
              <p className="stats-note">
                {patterns.moodTrend === 'improving' &&
                  'Nice work—your mood is trending up compared to earlier days 💫'}
                {patterns.moodTrend === 'declining' &&
                  "It's been a tougher stretch. Be gentle with yourself and keep checking in 💜"}
                {patterns.moodTrend === 'stable' &&
                  'Your mood has been steady. Small routines can keep that stability going 🌱'}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
