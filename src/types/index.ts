export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  exerciseType?: 'CBT' | 'DBT' | 'general';
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number; // 1-5 scale
  moodLabel: string;
  emotions: string[];
  note?: string;
  timestamp: Date;
  sentimentScore?: number;
  sentimentLabel?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  timestamp: Date;
  prompt?: string;
  mood?: number;
  emotions?: string[];
  sentimentScore?: number;
  sentimentLabel?: string;
  updatedAt?: Date;
  sentimentAnalysis?: {
    score: number;
    label: string;
    insights: string[];
  };
  patterns?: string[];
}

export interface Therapist {
  id: string;
  name: string;
  specialty?: string;
  specialties: string[];
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  distance?: number;
  location: {
    lat: number;
    lng: number;
  };
  openNow?: boolean;
  photoUrl?: string;
}

export interface CBTExercise {
  id: string;
  name: string;
  description: string;
  type: 'thought-record' | 'cognitive-restructuring' | 'behavioral-activation' | 'exposure';
  steps: string[];
  duration: string;
}

export interface DBTExercise {
  id: string;
  name: string;
  description: string;
  type: 'mindfulness' | 'distress-tolerance' | 'emotion-regulation' | 'interpersonal-effectiveness';
  steps: string[];
  duration: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  startedAt: Date;
  lastMessageAt: Date;
}
