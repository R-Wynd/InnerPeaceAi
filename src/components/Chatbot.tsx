import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Brain, Heart, Loader2 } from 'lucide-react';
import { sendChatMessage, generateCBTExercise, generateDBTSkill } from '../services/geminiService';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import './Chatbot.css';

const INTRO_MESSAGE = `Hello! I'm InnerPeace AI, your compassionate mental health support companion. 🌱

I'm here to:
• Listen without judgment
• Guide you through CBT & DBT exercises
• Help you explore your thoughts and feelings
• Teach coping strategies and mindfulness

How are you feeling today? What's on your mind?`;

const Chatbot: React.FC = () => {
  // Only conversation messages are stored here (user + assistant),
  // the intro text is rendered separately so it never conflicts
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
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let response: string;
      
      if (selectedExercise === 'cbt') {
        response = await generateCBTExercise(input.trim());
        setSelectedExercise(null);
      } else if (selectedExercise === 'dbt') {
        response = await generateDBTSkill(input.trim());
        setSelectedExercise(null);
      } else {
        response = await sendChatMessage(input.trim(), conversationHistory);
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment. Remember, if you're in crisis, please contact the 988 Suicide & Crisis Lifeline.",
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
    const prompt = type === 'cbt' 
      ? "I'd like to try a CBT exercise. "
      : "I'd like to learn a DBT skill. ";
    setInput(prompt);
    inputRef.current?.focus();
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic text
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: line }} />
            {i < content.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-icon">
          <Bot size={28} />
        </div>
        <div className="header-text">
          <h2>InnerPeace AI</h2>
          <span className="status">
            <span className="status-dot"></span>
            Always here for you
          </span>
        </div>
      </div>

      <div className="quick-actions">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`quick-action-btn cbt ${selectedExercise === 'cbt' ? 'active' : ''}`}
          onClick={() => handleQuickAction('cbt')}
        >
          <Brain size={18} />
          <span>CBT Exercise</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`quick-action-btn dbt ${selectedExercise === 'dbt' ? 'active' : ''}`}
          onClick={() => handleQuickAction('dbt')}
        >
          <Heart size={18} />
          <span>DBT Skill</span>
        </motion.button>
      </div>

      <div className="messages-container">
        <AnimatePresence>
          {/* Static intro message at the top */}
          <motion.div
            key="intro-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="message assistant"
          >
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {formatMessage(INTRO_MESSAGE)}
              </div>
            </div>
          </motion.div>

          {/* Dynamic conversation messages */}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'assistant' ? (
                  <Bot size={20} />
                ) : (
                  <User size={20} />
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

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message assistant"
          >
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="message-bubble typing">
                <Loader2 className="spinning" size={18} />
                <span>Thinking with compassion...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        {selectedExercise && (
          <div className="exercise-indicator">
            <Sparkles size={14} />
            <span>
              {selectedExercise === 'cbt' ? 'CBT Exercise Mode' : 'DBT Skill Mode'}
            </span>
            <button onClick={() => setSelectedExercise(null)}>×</button>
          </div>
        )}
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            rows={1}
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} />
          </motion.button>
        </div>
        <p className="disclaimer">
          InnerPeace AI provides support but is not a replacement for professional mental health care.
          If you're in crisis, call 988.
        </p>
      </div>
    </div>
  );
};

export default Chatbot;

