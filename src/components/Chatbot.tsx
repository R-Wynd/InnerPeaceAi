import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, generateCBTExercise, generateDBTSkill } from '../services/geminiService';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import './Chatbot.css';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<'cbt' | 'dbt' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let response: string;

      if (selectedExercise === 'cbt') {
        response = await generateCBTExercise(currentInput);
        setSelectedExercise(null);
      } else if (selectedExercise === 'dbt') {
        response = await generateDBTSkill(currentInput);
        setSelectedExercise(null);
      } else {
        const conversationHistory = messages.map(m => ({
          role: m.role,
          content: m.content
        }));
        response = await sendChatMessage(currentInput, conversationHistory);
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. 💜",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (type: 'cbt' | 'dbt') => {
    setSelectedExercise(type);
    inputRef.current?.focus();
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <header className="chatbot-header">
        <div className="header-content">
          <div className="bot-avatar">
            <span style={{ fontSize: '22px' }}>🌿</span>
          </div>
          <div className="header-text">
            <h1>InnerPeace AI</h1>
            <p>
              <span className="status-dot"></span>
              Always here for you
            </p>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className={`quick-btn primary ${selectedExercise === 'cbt' ? 'active' : ''}`}
          onClick={() => handleQuickAction('cbt')}
        >
          <span>🧠</span>
          <span>CBT Exercise</span>
        </button>
        <button
          className={`quick-btn secondary ${selectedExercise === 'dbt' ? 'active' : ''}`}
          onClick={() => handleQuickAction('dbt')}
        >
          <span>🌊</span>
          <span>DBT Skills</span>
        </button>
        <button
          className="quick-btn"
          onClick={() => {
            setInput("I need to talk about how I'm feeling");
            inputRef.current?.focus();
          }}
        >
          <span>💬</span>
          <span>Just Talk</span>
        </button>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="message assistant welcome-message"
        >
          <div className="message-avatar">
            <span style={{ fontSize: '18px' }}>🌿</span>
          </div>
          <div className="message-content">
            <div className="message-bubble">
              <p>Hello! I'm InnerPeace AI 🌱</p>
              <p>I'm here to support you with:</p>
              <ul>
                <li>💬 Empathetic conversations</li>
                <li>🧠 CBT thought exercises</li>
                <li>🌊 DBT emotion skills</li>
                <li>🧘 Mindfulness & coping</li>
              </ul>
              <p>How are you feeling today? ✨</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                <span style={{ fontSize: '18px' }}>
                  {message.role === 'assistant' ? '🌿' : '😊'}
                </span>
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {formatMessage(message.content)}
                </div>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="loading-indicator"
          >
            <div className="message-avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>
              <span style={{ fontSize: '18px' }}>🌿</span>
            </div>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        {selectedExercise && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: selectedExercise === 'cbt' ? 'var(--primary-50)' : 'var(--accent-50)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: selectedExercise === 'cbt' ? 'var(--primary-700)' : 'var(--accent-700)'
          }}>
            <span>{selectedExercise === 'cbt' ? '🧠' : '🌊'}</span>
            <span style={{ flex: 1 }}>
              {selectedExercise === 'cbt' 
                ? 'Describe a thought to analyze' 
                : 'Share what emotion you need help with'}
            </span>
            <button 
              onClick={() => setSelectedExercise(null)}
              style={{ 
                background: 'none', 
                padding: '4px',
                color: 'inherit',
                opacity: 0.6
              }}
            >✕</button>
          </div>
        )}
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={isLoading}
          />
          <button 
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '12px'
        }}>
          💜 This is supportive AI, not a replacement for professional help
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
