import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MoodEntry, JournalEntry, ChatSession, Message } from '../types';

// In-memory storage for demo mode (when Firebase is not configured)
let localMoodEntries: MoodEntry[] = [];
let localJournalEntries: JournalEntry[] = [];
let localChatSessions: ChatSession[] = [];

const isDemoMode = () => {
  return !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key';
};

// Mood Entries
export const saveMoodEntry = async (entry: Omit<MoodEntry, 'id'>): Promise<string> => {
  if (isDemoMode()) {
    const id = `mood-${Date.now()}`;
    localMoodEntries.push({ ...entry, id });
    return id;
  }
  
  try {
    const docRef = await addDoc(collection(db, 'moodEntries'), {
      ...entry,
      timestamp: Timestamp.fromDate(entry.timestamp)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving mood entry:', error);
    const id = `mood-${Date.now()}`;
    localMoodEntries.push({ ...entry, id });
    return id;
  }
};

export const getMoodEntries = async (userId: string, limitCount: number = 30): Promise<MoodEntry[]> => {
  if (isDemoMode()) {
    return localMoodEntries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  }
  
  try {
    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as MoodEntry[];
  } catch (error) {
    console.error('Error getting mood entries:', error);
    return localMoodEntries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  }
};

// Journal Entries
export const saveJournalEntry = async (entry: Omit<JournalEntry, 'id'>): Promise<string> => {
  if (isDemoMode()) {
    const id = `journal-${Date.now()}`;
    localJournalEntries.push({ ...entry, id });
    return id;
  }
  
  try {
    const docRef = await addDoc(collection(db, 'journalEntries'), {
      ...entry,
      timestamp: Timestamp.fromDate(entry.timestamp)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    const id = `journal-${Date.now()}`;
    localJournalEntries.push({ ...entry, id });
    return id;
  }
};

export const getJournalEntries = async (userId: string, limitCount: number = 50): Promise<JournalEntry[]> => {
  if (isDemoMode()) {
    return localJournalEntries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  }
  
  try {
    const q = query(
      collection(db, 'journalEntries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as JournalEntry[];
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return localJournalEntries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  }
};

export const updateJournalEntry = async (id: string, updates: Partial<JournalEntry>): Promise<void> => {
  if (isDemoMode()) {
    const index = localJournalEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      localJournalEntries[index] = { ...localJournalEntries[index], ...updates };
    }
    return;
  }
  
  try {
    await updateDoc(doc(db, 'journalEntries', id), updates);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    const index = localJournalEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      localJournalEntries[index] = { ...localJournalEntries[index], ...updates };
    }
  }
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  if (isDemoMode()) {
    localJournalEntries = localJournalEntries.filter(e => e.id !== id);
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'journalEntries', id));
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    localJournalEntries = localJournalEntries.filter(e => e.id !== id);
  }
};

// Chat Sessions
export const saveChatSession = async (session: Omit<ChatSession, 'id'>): Promise<string> => {
  if (isDemoMode()) {
    const id = `chat-${Date.now()}`;
    localChatSessions.push({ ...session, id });
    return id;
  }
  
  try {
    const docRef = await addDoc(collection(db, 'chatSessions'), {
      ...session,
      startedAt: Timestamp.fromDate(session.startedAt),
      lastMessageAt: Timestamp.fromDate(session.lastMessageAt),
      messages: session.messages.map(m => ({
        ...m,
        timestamp: Timestamp.fromDate(m.timestamp)
      }))
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving chat session:', error);
    const id = `chat-${Date.now()}`;
    localChatSessions.push({ ...session, id });
    return id;
  }
};

export const updateChatSession = async (id: string, messages: Message[]): Promise<void> => {
  if (isDemoMode()) {
    const index = localChatSessions.findIndex(s => s.id === id);
    if (index !== -1) {
      localChatSessions[index].messages = messages;
      localChatSessions[index].lastMessageAt = new Date();
    }
    return;
  }
  
  try {
    await updateDoc(doc(db, 'chatSessions', id), {
      messages: messages.map(m => ({
        ...m,
        timestamp: Timestamp.fromDate(m.timestamp)
      })),
      lastMessageAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    const index = localChatSessions.findIndex(s => s.id === id);
    if (index !== -1) {
      localChatSessions[index].messages = messages;
      localChatSessions[index].lastMessageAt = new Date();
    }
  }
};

export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  if (isDemoMode()) {
    return localChatSessions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }
  
  try {
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt.toDate(),
      lastMessageAt: doc.data().lastMessageAt.toDate(),
      messages: doc.data().messages.map((m: any) => ({
        ...m,
        timestamp: m.timestamp.toDate()
      }))
    })) as ChatSession[];
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return localChatSessions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }
};

// Get mood patterns for analytics
export const getMoodPatterns = async (userId: string, days: number = 30): Promise<{
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  commonEmotions: string[];
  entriesCount: number;
}> => {
  const entries = await getMoodEntries(userId, days);
  
  if (entries.length === 0) {
    return {
      averageMood: 0,
      moodTrend: 'stable',
      commonEmotions: [],
      entriesCount: 0
    };
  }
  
  const averageMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  
  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(entries.length / 2);
  const recentEntries = entries.slice(0, midpoint);
  const olderEntries = entries.slice(midpoint);
  
  const recentAvg = recentEntries.length > 0 
    ? recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length 
    : averageMood;
  const olderAvg = olderEntries.length > 0 
    ? olderEntries.reduce((sum, e) => sum + e.mood, 0) / olderEntries.length 
    : averageMood;
  
  let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentAvg - olderAvg > 0.3) moodTrend = 'improving';
  else if (olderAvg - recentAvg > 0.3) moodTrend = 'declining';
  
  // Get common emotions
  const emotionCounts: Record<string, number> = {};
  entries.forEach(e => {
    e.emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
  });
  
  const commonEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion]) => emotion);
  
  return {
    averageMood,
    moodTrend,
    commonEmotions,
    entriesCount: entries.length
  };
};

