/*
 * Firestore Service for InnerPeace AI
 * 
 * IMPORTANT: Configure Firestore Security Rules
 * 
 * OPTION 1 - With Firebase Anonymous Auth (Recommended):
 * Enable Anonymous Auth in Firebase Console > Authentication > Sign-in method, then use:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     function isSignedIn() {
 *       return request.auth != null;
 *     }
 *     function isCreatingOwnDoc() {
 *       return isSignedIn() && request.auth.uid == request.resource.data.userId;
 *     }
 *     function isOwnerOfExisting() {
 *       return isSignedIn() && request.auth.uid == resource.data.userId;
 *     }
 *     match /moodEntries/{doc} {
 *       allow create: if isCreatingOwnDoc();
 *       allow read: if isOwnerOfExisting();
 *       allow update, delete: if isOwnerOfExisting();
 *     }
 *     match /journalEntries/{doc} {
 *       allow create: if isCreatingOwnDoc();
 *       allow read: if isOwnerOfExisting();
 *       allow update, delete: if isOwnerOfExisting();
 *     }
 *     match /chatSessions/{doc} {
 *       allow create: if isCreatingOwnDoc();
 *       allow read: if isOwnerOfExisting();
 *       allow update, delete: if isOwnerOfExisting();
 *     }
 *   }
 * }
 * 
 * OPTION 2 - Without Anonymous Auth (Fallback, less secure):
 * If you can't enable Anonymous Auth yet, use this temporarily:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     function hasValidUserId() {
 *       return request.resource.data.userId is string && 
 *              request.resource.data.userId.size() > 0;
 *     }
 *     match /moodEntries/{doc} {
 *       allow create: if hasValidUserId();
 *       allow read, update, delete: if resource.data.userId == request.auth.uid ||
 *                                       (request.auth == null && resource.data.userId is string);
 *     }
 *     match /journalEntries/{doc} {
 *       allow create: if hasValidUserId();
 *       allow read, update, delete: if resource.data.userId == request.auth.uid ||
 *                                       (request.auth == null && resource.data.userId is string);
 *     }
 *     match /chatSessions/{doc} {
 *       allow create: if hasValidUserId();
 *       allow read, update, delete: if resource.data.userId == request.auth.uid ||
 *                                       (request.auth == null && resource.data.userId is string);
 *     }
 *   }
 * }
 * 
 * WARNING: Option 2 allows unauthenticated access. Use only for development/testing.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MoodEntry, JournalEntry, ChatSession, Message, UserProfile } from '../types';

// In-memory storage for demo mode (when Firebase is not configured)
let localMoodEntries: MoodEntry[] = [];
let localJournalEntries: JournalEntry[] = [];
let localChatSessions: ChatSession[] = [];

const isDemoMode = () => {
  return !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key';
};

// Log which storage mode we're using so you can verify Firebase connectivity
const DEMO_MODE = isDemoMode();
if (DEMO_MODE) {
  // eslint-disable-next-line no-console
  console.warn(
    '[InnerPeace] Firebase is not fully configured (demo mode ON). ' +
      'Mood, journal, and chat data are NOT stored in Firestore.'
  );
} else {
  // eslint-disable-next-line no-console
  console.log(
    '[InnerPeace] Connected to Firebase Firestore project:',
    import.meta.env.VITE_FIREBASE_PROJECT_ID || '(projectId not set)'
  );
}

// Utility to strip undefined values before sending data to Firestore
const removeUndefined = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: Record<string, any> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) return;
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof Timestamp)
    ) {
      cleaned[key] = removeUndefined(value);
    } else {
      cleaned[key] = value;
    }
  });
  return cleaned as T;
};

// Timeout wrapper to prevent hanging Firestore requests
async function withTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      console.error(`[InnerPeace] Firestore operation timed out after ${ms}ms: ${context}`);
      reject(new Error('timeout'));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Mood Entries
export const saveMoodEntry = async (entry: Omit<MoodEntry, 'id'>): Promise<string> => {
  if (isDemoMode()) {
    const id = `mood-${Date.now()}`;
    localMoodEntries.push({ ...entry, id });
    console.log('[InnerPeace] Saved mood entry to local storage (demo mode)');
    return id;
  }
  
  try {
    const payload = removeUndefined({
      ...entry,
      timestamp: Timestamp.fromDate(entry.timestamp)
    });
    console.log('[InnerPeace] Saving mood entry to Firestore...', { userId: entry.userId, mood: entry.mood });
    const docRef = await withTimeout(
      addDoc(collection(db, 'moodEntries'), payload),
      8000,
      'addDoc(moodEntries)'
    );
    console.log('[InnerPeace] ✓ Mood entry saved successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[InnerPeace] Error saving mood entry to Firestore:', error);
    console.log('[InnerPeace] Falling back to local storage');
    const id = `mood-${Date.now()}`;
    localMoodEntries.push({ ...entry, id });
    return id;
  }
};

export const getMoodEntries = async (userId: string, limitCount: number = 30): Promise<MoodEntry[]> => {
  if (isDemoMode()) {
    const filtered = localMoodEntries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
    console.log('[InnerPeace] Retrieved', filtered.length, 'mood entries from local storage (demo mode)');
    return filtered;
  }
  
  try {
    console.log('[InnerPeace] Fetching mood entries from Firestore for user:', userId);
    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await withTimeout(getDocs(q), 8000, 'getDocs(moodEntries)');
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as MoodEntry[];
    console.log('[InnerPeace] ✓ Retrieved', entries.length, 'mood entries from Firestore');
    return entries;
  } catch (error) {
    console.error('[InnerPeace] Error getting mood entries from Firestore:', error);
    console.log('[InnerPeace] Falling back to local storage');
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
    const payload = removeUndefined({
      ...entry,
      timestamp: Timestamp.fromDate(entry.timestamp)
    });
    const docRef = await withTimeout(
      addDoc(collection(db, 'journalEntries'), payload),
      8000,
      'addDoc(journalEntries)'
    );
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
    
    const snapshot = await withTimeout(getDocs(q), 8000, 'getDocs(journalEntries)');
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
    const payload = removeUndefined(updates as Record<string, any>);
    await withTimeout(updateDoc(doc(db, 'journalEntries', id), payload), 8000, 'updateDoc(journalEntries)');
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
    await withTimeout(deleteDoc(doc(db, 'journalEntries', id)), 8000, 'deleteDoc(journalEntries)');
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
    const payload = removeUndefined({
      ...session,
      startedAt: Timestamp.fromDate(session.startedAt),
      lastMessageAt: Timestamp.fromDate(session.lastMessageAt),
      messages: session.messages.map(m =>
        removeUndefined({
          ...m,
          timestamp: Timestamp.fromDate(m.timestamp)
        })
      )
    });
    const docRef = await withTimeout(
      addDoc(collection(db, 'chatSessions'), payload),
      8000,
      'addDoc(chatSessions)'
    );
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
    const payload = {
      messages: messages.map(m =>
        removeUndefined({
          ...m,
          timestamp: Timestamp.fromDate(m.timestamp)
        })
      ),
      lastMessageAt: Timestamp.now()
    };
    await withTimeout(updateDoc(doc(db, 'chatSessions', id), payload), 8000, 'updateDoc(chatSessions)');
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
    
    const snapshot = await withTimeout(getDocs(q), 8000, 'getDocs(chatSessions)');
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

// User Profile Management
let localUserProfiles: Record<string, UserProfile> = {};

export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
  if (isDemoMode()) {
    localUserProfiles[userId] = profile;
    console.log('[InnerPeace] Saved user profile to local storage (demo mode)');
    return;
  }

  try {
    const payload = removeUndefined({
      ...profile,
      completedAt: Timestamp.fromDate(profile.completedAt)
    });
    console.log('[InnerPeace] Saving user profile to Firestore...', { userId });
    await withTimeout(
      setDoc(doc(db, 'userProfiles', userId), payload),
      8000,
      'setDoc(userProfiles)'
    );
    console.log('[InnerPeace] ✓ User profile saved successfully');
  } catch (error) {
    console.error('[InnerPeace] Error saving user profile to Firestore:', error);
    console.log('[InnerPeace] Falling back to local storage');
    localUserProfiles[userId] = profile;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (isDemoMode()) {
    const profile = localUserProfiles[userId] || null;
    console.log('[InnerPeace] Retrieved user profile from local storage (demo mode)');
    return profile;
  }

  try {
    console.log('[InnerPeace] Fetching user profile from Firestore for user:', userId);
    const docRef = doc(db, 'userProfiles', userId);
    const docSnap = await withTimeout(getDoc(docRef), 8000, 'getDoc(userProfiles)');
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile: UserProfile = {
        ...data,
        completedAt: data.completedAt?.toDate() || new Date()
      } as UserProfile;
      console.log('[InnerPeace] ✓ User profile retrieved successfully');
      return profile;
    } else {
      console.log('[InnerPeace] No user profile found');
      return null;
    }
  } catch (error) {
    console.error('[InnerPeace] Error fetching user profile from Firestore:', error);
    console.log('[InnerPeace] Falling back to local storage');
    return localUserProfiles[userId] || null;
  }
};

