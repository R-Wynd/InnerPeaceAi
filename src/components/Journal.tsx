import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { 
  saveJournalEntry, 
  getJournalEntries, 
  updateJournalEntry, 
  deleteJournalEntry 
} from '../services/firestoreService';
import { analyzeSentiment } from '../services/geminiService';
import type { JournalEntry } from '../types';
import './Journal.css';

const PROMPTS = [
  { emoji: '🌟', text: 'What are you grateful for today?' },
  { emoji: '💭', text: 'What\'s on your mind right now?' },
  { emoji: '🎯', text: 'What\'s one small win you had today?' },
  { emoji: '🌱', text: 'How are you taking care of yourself?' },
  { emoji: '💪', text: 'What challenge are you facing?' },
  { emoji: '✨', text: 'What made you smile recently?' }
];

const Journal: React.FC = () => {
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'entries'>('entries');

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    const userId = user?.id || 'anonymous';
    const data = await getJournalEntries(userId, 50);
    setEntries(data);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);

    try {
      const sentiment = await analyzeSentiment(content);
      const finalTitle = title.trim() || new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      if (editingEntry) {
        await updateJournalEntry(editingEntry.id, {
          title: finalTitle,
          content: content.trim(),
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label,
          updatedAt: new Date()
        });
      } else {
        await saveJournalEntry({
          userId: user?.id || 'anonymous',
          title: finalTitle,
          content: content.trim(),
          prompt: selectedPrompt || undefined,
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label,
          timestamp: new Date()
        });
      }

      resetForm();
      loadEntries();
      setActiveTab('entries');
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      loadEntries();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const startEditing = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedPrompt(entry.prompt || null);
    setActiveTab('write');
    setIsWriting(true);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedPrompt(null);
    setEditingEntry(null);
    setIsWriting(false);
  };

  const selectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setIsWriting(true);
    setActiveTab('write');
  };

  const getSentimentEmoji = (label?: string) => {
    switch (label) {
      case 'very_positive': return '🌟';
      case 'positive': return '😊';
      case 'neutral': return '😐';
      case 'negative': return '😔';
      case 'very_negative': return '😢';
      default: return '📝';
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="journal-container">
      {/* Header */}
      <div className="journal-header">
        <div>
          <h1>My Journal 📔</h1>
          <p>A safe space for your thoughts</p>
        </div>
        <div className="entry-count">
          <span>{entries.length}</span>
          <span>entries</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'entries' ? 'active' : ''}`}
          onClick={() => { setActiveTab('entries'); resetForm(); }}
        >
          📚 Entries
        </button>
        <button 
          className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
          onClick={() => setActiveTab('write')}
        >
          ✏️ Write
        </button>
      </div>

      {/* Write Tab */}
      {activeTab === 'write' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="write-section"
        >
          {/* Prompts */}
          {!isWriting && (
            <div className="prompts-section">
              <h3>Get inspired ✨</h3>
              <div className="prompts-grid">
                {PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="prompt-card"
                    onClick={() => selectPrompt(prompt.text)}
                  >
                    <span className="prompt-emoji">{prompt.emoji}</span>
                    <span className="prompt-text">{prompt.text}</span>
                  </motion.button>
                ))}
              </div>
              <button 
                className="free-write-btn"
                onClick={() => setIsWriting(true)}
              >
                Or start free writing →
              </button>
            </div>
          )}

          {/* Writing Area */}
          {isWriting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="writing-area"
            >
              {selectedPrompt && (
                <div className="selected-prompt">
                  <span>💭</span>
                  <span>{selectedPrompt}</span>
                  <button onClick={() => setSelectedPrompt(null)}>✕</button>
                </div>
              )}

              <input
                type="text"
                className="title-input"
                placeholder="Entry title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="content-input"
                placeholder="Start writing... let your thoughts flow freely 💜"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                autoFocus
              />

              <div className="writing-actions">
                <button className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={handleSave}
                  disabled={!content.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : editingEntry ? 'Update ✓' : 'Save Entry ✨'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Entries Tab */}
      {activeTab === 'entries' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="entries-section"
        >
          {entries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-emoji">📔</span>
              <h3>Your journal is empty</h3>
              <p>Start writing to capture your thoughts</p>
              <button 
                className="start-writing-btn"
                onClick={() => setActiveTab('write')}
              >
                Write First Entry ✨
              </button>
            </div>
          ) : (
            <div className="entries-list">
              <AnimatePresence>
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="entry-card"
                  >
                    {deleteConfirm === entry.id ? (
                      <div className="delete-confirm">
                        <p>Delete this entry?</p>
                        <div className="confirm-actions">
                          <button onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(entry.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="entry-header">
                          <span className="entry-sentiment">
                            {getSentimentEmoji(entry.sentimentLabel)}
                          </span>
                          <div className="entry-meta">
                            <h4>{entry.title}</h4>
                            <span className="entry-date">
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                          <div className="entry-actions">
                            <button 
                              className="edit-btn"
                              onClick={() => startEditing(entry)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-trigger"
                              onClick={() => setDeleteConfirm(entry.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        {entry.prompt && (
                          <p className="entry-prompt">💭 {entry.prompt}</p>
                        )}
                        <p className="entry-content">
                          {entry.content.length > 200 
                            ? entry.content.substring(0, 200) + '...' 
                            : entry.content}
                        </p>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Journal;
