import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  Clock, 
  ChevronRight,
  Trash2,
  X,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { saveJournalEntry, getJournalEntries, deleteJournalEntry } from '../services/firestoreService';
import { analyzeSentiment } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import type { JournalEntry } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import './Journal.css';

const PROMPTS = [
  "What made you smile today?",
  "What's something you're grateful for right now?",
  "How are you really feeling in this moment?",
  "What's been on your mind lately?",
  "Describe a recent challenge and how you handled it.",
  "What would you tell your younger self today?",
  "What's one small win you've had recently?",
  "What emotions have you been avoiding?",
  "What does self-care look like for you today?",
  "Write about something that's been weighing on you."
];

const Journal: React.FC = () => {
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    if (user) {
      loadEntries();
    }
    generateNewPrompt();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    const data = await getJournalEntries(user.id, 50);
    setEntries(data);
  };

  const generateNewPrompt = () => {
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setCurrentPrompt(randomPrompt);
  };

  const handleStartWriting = (withPrompt: boolean = false) => {
    setIsWriting(true);
    setTitle(withPrompt ? currentPrompt : '');
    setContent('');
    generateNewPrompt();
  };

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    
    setIsAnalyzing(true);
    
    // Analyze sentiment
    const sentiment = await analyzeSentiment(content);
    
    const entry: Omit<JournalEntry, 'id'> = {
      userId: user.id,
      title: title.trim() || format(new Date(), 'MMMM d, yyyy'),
      content: content.trim(),
      timestamp: new Date(),
      sentimentAnalysis: sentiment
    };
    
    await saveJournalEntry(entry);
    
    setIsAnalyzing(false);
    setIsWriting(false);
    setTitle('');
    setContent('');
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteJournalEntry(id);
      setSelectedEntry(null);
      loadEntries();
    }
  };

  const getSentimentColor = (label?: string) => {
    switch (label) {
      case 'Very Positive': return '#22c55e';
      case 'Positive': return '#4ade80';
      case 'Neutral': return '#eab308';
      case 'Negative': return '#f97316';
      case 'Very Negative': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getSentimentEmoji = (label?: string) => {
    switch (label) {
      case 'Very Positive': return '😊';
      case 'Positive': return '🙂';
      case 'Neutral': return '😐';
      case 'Negative': return '😔';
      case 'Very Negative': return '😢';
      default: return '📝';
    }
  };

  return (
    <div className="journal-container">
      <AnimatePresence mode="wait">
        {selectedEntry ? (
          // Entry Detail View
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="entry-detail"
          >
            <div className="detail-header">
              <button className="back-btn" onClick={() => setSelectedEntry(null)}>
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(selectedEntry.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="detail-content">
              <h2>{selectedEntry.title}</h2>
              <div className="detail-meta">
                <span className="detail-date">
                  <Clock size={14} />
                  {format(new Date(selectedEntry.timestamp), 'MMMM d, yyyy • h:mm a')}
                </span>
                {selectedEntry.sentimentAnalysis && (
                  <span 
                    className="sentiment-badge"
                    style={{ background: `${getSentimentColor(selectedEntry.sentimentAnalysis.label)}20`, color: getSentimentColor(selectedEntry.sentimentAnalysis.label) }}
                  >
                    {getSentimentEmoji(selectedEntry.sentimentAnalysis.label)} {selectedEntry.sentimentAnalysis.label}
                  </span>
                )}
              </div>
              
              <div className="detail-body">
                {selectedEntry.content.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              
              {selectedEntry.sentimentAnalysis?.insights && (
                <div className="insights-section">
                  <h4><Lightbulb size={18} /> AI Insights</h4>
                  <ul>
                    {selectedEntry.sentimentAnalysis.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ) : isWriting ? (
          // Writing View
          <motion.div
            key="writing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="writing-view"
          >
            <div className="writing-header">
              <button className="close-btn" onClick={() => setIsWriting(false)}>
                <X size={24} />
              </button>
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={!content.trim() || isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Save'}
              </button>
            </div>
            
            <div className="writing-content">
              <input
                type="text"
                className="title-input"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="content-input"
                placeholder="Start writing your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
            </div>
            
            {isAnalyzing && (
              <div className="analyzing-overlay">
                <Sparkles className="spinning" size={24} />
                <p>Analyzing your entry...</p>
              </div>
            )}
          </motion.div>
        ) : (
          // List View
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="journal-header">
              <div className="header-text">
                <h2><BookOpen size={28} /> Journal</h2>
                <p>Reflect, process, and grow</p>
              </div>
            </div>

            {/* Writing Prompt */}
            <motion.div 
              className="prompt-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="prompt-header">
                <Sparkles size={18} />
                <span>Today's Prompt</span>
              </div>
              <p className="prompt-text">"{currentPrompt}"</p>
              <div className="prompt-actions">
                <button 
                  className="prompt-btn primary"
                  onClick={() => handleStartWriting(true)}
                >
                  Write About This
                </button>
                <button 
                  className="prompt-btn secondary"
                  onClick={generateNewPrompt}
                >
                  New Prompt
                </button>
              </div>
            </motion.div>

            {/* New Entry Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="new-entry-btn"
              onClick={() => handleStartWriting(false)}
            >
              <Plus size={22} />
              <span>New Entry</span>
            </motion.button>

            {/* Entries List */}
            <div className="entries-list">
              <h3>Recent Entries</h3>
              {entries.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={48} />
                  <p>Your journal is empty</p>
                  <span>Start writing to track your thoughts and emotions</span>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="entry-card"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="entry-left">
                      <span 
                        className="entry-emoji"
                        style={{ background: `${getSentimentColor(entry.sentimentAnalysis?.label)}20` }}
                      >
                        {getSentimentEmoji(entry.sentimentAnalysis?.label)}
                      </span>
                    </div>
                    <div className="entry-info">
                      <h4>{entry.title}</h4>
                      <p className="entry-preview">
                        {entry.content.substring(0, 100)}
                        {entry.content.length > 100 ? '...' : ''}
                      </p>
                      <span className="entry-time">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <ChevronRight size={20} className="entry-arrow" />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Journal;

