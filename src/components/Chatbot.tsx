import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, generateCBTExercise, generateDBTSkill } from '../services/geminiService';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '../context/UserContext';
import './Chatbot.css';
import ChatbotHeroImage from '../../Chatbot Chat Message.jpg';
import ChatbotAvatar from '../../11064997.png';

const Chatbot: React.FC = () => {
  const { user } = useUser();
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
        response = await sendChatMessage(currentInput, conversationHistory, user?.profile);
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
      <div className="chat-shell">
        {/* Hero */}
        <header className="chat-hero">
          <div className="chat-hero-avatar">
            <img src={ChatbotHeroImage} alt="Chatbot" />
          </div>
          <div className="chat-hero-text">
            <p className="chat-hero-eyebrow">InnerPeace AI</p>
            <h1>Talk to InnerPeace and feel a little lighter.</h1>
            <p className="chat-hero-subtitle">
              Share what&apos;s on your mind and I&apos;ll respond with gentle, evidence‑based support.
            </p>
          </div>
        </header>

        <div className="chat-panel">
          {/* Messages */}
          <div className="messages-container">
            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="message assistant welcome-message"
            >
              <div className="message-avatar">
                <img src={ChatbotAvatar} alt="Chatbot" />
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <p>Hello! I&apos;m InnerPeace AI 🌱</p>
                  <p>I&apos;m here to support you with:</p>
                  <ul>
                    <li>💬 Empathetic conversations</li>
                    <li>🧠 CBT thought exercises</li>
                    <li>🌊 DBT emotion skills</li>
                    <li>🧘 Mindfulness & coping</li>
                  </ul>
                  <p>What would you like to talk about today? ✨</p>
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
                    {message.role === 'assistant' ? (
                      <img src={ChatbotAvatar} alt="Chatbot" />
                    ) : (
                      <span style={{ fontSize: '18px' }}>😊</span>
                    )}
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
                  <img src={ChatbotAvatar} alt="Chatbot" />
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
        </div>

        {/* Input Area pushed slightly below the chat panel for a floating feel */}
        <div className="input-container">
          {selectedExercise && (
            <div className="exercise-banner">
              <span className="exercise-icon">
                {selectedExercise === 'cbt' ? '🧠' : '🌊'}
              </span>
              <span className="exercise-text">
                {selectedExercise === 'cbt'
                  ? 'Describe a thought or situation you want to analyze.'
                  : 'Share the emotion or situation you need help coping with.'}
              </span>
              <button
                className="exercise-close"
                onClick={() => setSelectedExercise(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div className="input-shell">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to InnerPeace AI about anything on your mind..."
                rows={1}
                disabled={isLoading}
              />
              <div className="input-right-controls">
                <button
                  type="button"
                  className="voice-btn"
                  aria-label="Voice input (coming soon)"
                >
                  <span className="voice-wave"></span>
                </button>
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="input-footer-row">
              <div className="quick-actions">
                <button
                  className={`quick-btn primary ${selectedExercise === 'cbt' ? 'active' : ''}`}
                  onClick={() => handleQuickAction('cbt')}
                >
                  <span>🧠</span>
                  <span>CBT exercise</span>
                </button>
                <button
                  className={`quick-btn secondary ${selectedExercise === 'dbt' ? 'active' : ''}`}
                  onClick={() => handleQuickAction('dbt')}
                >
                  <span>🌊</span>
                  <span>DBT skills</span>
                </button>
                <button
                  className="quick-btn"
                  onClick={() => {
                    setInput("I need to talk about how I'm feeling");
                    inputRef.current?.focus();
                  }}
                >
                  <span>💬</span>
                  <span>Just talk</span>
                </button>
              </div>
            </div>
          </div>

          <p className="chat-disclaimer">
            💜 InnerPeace AI offers supportive conversations, but it&apos;s not a replacement for professional help or emergency services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
