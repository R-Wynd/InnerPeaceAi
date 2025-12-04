import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, 
  Meh, 
  Frown, 
  CloudRain, 
  Sun, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Check,
  Sparkles
} from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { saveMoodEntry, getMoodEntries, getMoodPatterns } from '../services/firestoreService';
import { useUser } from '../context/UserContext';
import type { MoodEntry } from '../types';
import { format, subDays, startOfDay, isToday } from 'date-fns';
import './MoodTracker.css';

const MOODS = [
  { value: 1, label: 'Terrible', icon: CloudRain, color: '#ef4444', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },
  { value: 2, label: 'Bad', icon: Frown, color: '#f97316', gradient: 'linear-gradient(135deg, #ea580c, #f97316)' },
  { value: 3, label: 'Okay', icon: Meh, color: '#eab308', gradient: 'linear-gradient(135deg, #ca8a04, #eab308)' },
  { value: 4, label: 'Good', icon: Smile, color: '#22c55e', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)' },
  { value: 5, label: 'Great', icon: Sun, color: '#06b6d4', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' }
];

const EMOTIONS = [
  'Happy', 'Calm', 'Grateful', 'Hopeful', 'Energetic',
  'Anxious', 'Sad', 'Stressed', 'Angry', 'Tired',
  'Confused', 'Lonely', 'Overwhelmed', 'Peaceful', 'Motivated'
];

const MoodTracker: React.FC = () => {
  const { user } = useUser();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [patterns, setPatterns] = useState<{
    averageMood: number;
    moodTrend: 'improving' | 'stable' | 'declining';
    commonEmotions: string[];
    entriesCount: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setTodayLogged] = useState(false);

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  const loadMoodData = async () => {
    if (!user) return;
    
    const entries = await getMoodEntries(user.id, 30);
    setMoodEntries(entries);
    
    const todayEntry = entries.find(e => isToday(new Date(e.timestamp)));
    setTodayLogged(!!todayEntry);
    
    const patternData = await getMoodPatterns(user.id, 30);
    setPatterns(patternData);
  };

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSubmit = async () => {
    if (!selectedMood || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const entry: Omit<MoodEntry, 'id'> = {
        userId: user.id,
        mood: selectedMood,
        moodLabel: MOODS.find(m => m.value === selectedMood)?.label || '',
        emotions: selectedEmotions,
        note: note.trim() || undefined,
        timestamp: new Date()
      };
      
      await saveMoodEntry(entry);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedMood(null);
        setSelectedEmotions([]);
        setNote('');
        loadMoodData();
      }, 2000);
    } catch (error) {
      console.error('Error submitting mood entry:', error);
      // Optional: surface a gentle UI message here if desired
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const entry = moodEntries.find(e => 
        startOfDay(new Date(e.timestamp)).getTime() === dayStart.getTime()
      );
      return {
        date: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        mood: entry?.mood || null
      };
    });
    return last7Days;
  };

  const getTrendIcon = () => {
    if (!patterns) return <Minus size={18} />;
    switch (patterns.moodTrend) {
      case 'improving': return <TrendingUp size={18} />;
      case 'declining': return <TrendingDown size={18} />;
      default: return <Minus size={18} />;
    }
  };

  const getTrendColor = () => {
    if (!patterns) return '#9ca3af';
    switch (patterns.moodTrend) {
      case 'improving': return '#22c55e';
      case 'declining': return '#ef4444';
      default: return '#eab308';
    }
  };

  return (
    <div className="mood-tracker-container">
      <div className="mood-header">
        <div className="header-content">
          <h2>How are you feeling?</h2>
          <p>Track your emotional journey</p>
        </div>
        <div className="streak-badge">
          <Calendar size={16} />
          <span>{patterns?.entriesCount || 0} entries</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="success-message"
          >
            <div className="success-icon">
              <Check size={40} />
            </div>
            <h3>Mood Logged!</h3>
            <p>Great job taking care of yourself</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Mood Selection */}
            <div className="mood-selection">
              <h3>Select your mood</h3>
              <div className="mood-buttons">
                {MOODS.map((mood, index) => {
                  const Icon = mood.icon;
                  return (
                    <motion.button
                      key={mood.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`mood-btn ${selectedMood === mood.value ? 'selected' : ''}`}
                      style={{ 
                        '--mood-color': mood.color,
                        '--mood-gradient': mood.gradient
                      } as React.CSSProperties}
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <Icon size={32} />
                      <span>{mood.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Emotion Tags */}
            <div className="emotions-section">
              <h3>What emotions are you experiencing?</h3>
              <div className="emotion-tags">
                {EMOTIONS.map((emotion) => (
                  <motion.button
                    key={emotion}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`emotion-tag ${selectedEmotions.includes(emotion) ? 'selected' : ''}`}
                    onClick={() => handleEmotionToggle(emotion)}
                  >
                    {emotion}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="note-section">
              <h3>Add a note (optional)</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!selectedMood || isSubmitting}
            >
              <Sparkles size={20} />
              <span>{isSubmitting ? 'Saving...' : 'Log Mood'}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Chart */}
      <div className="mood-chart-section">
        <div className="chart-header">
          <h3>Your Week</h3>
          {patterns && (
            <div className="trend-indicator" style={{ color: getTrendColor() }}>
              {getTrendIcon()}
              <span>{patterns.moodTrend}</span>
            </div>
          )}
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis 
                domain={[1, 5]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                ticks={[1, 2, 3, 4, 5]}
              />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(30, 30, 50, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value: any) => {
                  if (value === null) return ['No entry', 'Mood'];
                  const mood = MOODS.find(m => m.value === value);
                  return [mood?.label || value, 'Mood'];
                }}
                labelFormatter={(label: any, payload: any) => {
                  if (payload?.[0]?.payload?.fullDate) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#moodGradient)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patterns Insights */}
      {patterns && patterns.commonEmotions.length > 0 && (
        <div className="patterns-section">
          <h3>Your Patterns</h3>
          <div className="pattern-cards">
            <div className="pattern-card">
              <span className="pattern-label">Average Mood</span>
              <span className="pattern-value">{patterns.averageMood.toFixed(1)}/5</span>
            </div>
            <div className="pattern-card">
              <span className="pattern-label">Common Emotions</span>
              <div className="common-emotions">
                {patterns.commonEmotions.slice(0, 3).map(e => (
                  <span key={e} className="emotion-chip">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;

