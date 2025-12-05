import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import type { User, UserProfile } from '../types';
import { saveUserProfile, getUserProfile } from '../services/firestoreService';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  /**
   * Sign in an existing user with email and password.
   */
  login: (email: string, password: string) => Promise<void>;
  /**
   * Register a new user with email and password, then sync with context.
   */
  register: (name: string, email: string, password: string) => Promise<void>;
  /**
   * Sign out the current user.
   */
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completeProfile: (data: { name: string; email: string; profile: Omit<UserProfile, 'completedAt'> }) => Promise<void>;
  hasCompletedProfile: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);

  const buildUserFromFirebase = async (firebaseUser: FirebaseUser): Promise<User> => {
    // Try to fetch profile from Firestore
    const profile = await getUserProfile(firebaseUser.uid);

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      profile: profile || undefined,
    };
  };

  useEffect(() => {
    let isMounted = true;
    console.log('[InnerPeace] Initializing Firebase Auth listener...');
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        
        if (firebaseUser) {
        try {
          console.log('[InnerPeace] ✓ Firebase Auth user:', firebaseUser.uid);
          const builtUser = await buildUserFromFirebase(firebaseUser);
          setUser(builtUser);
          setHasCompletedProfile(!!builtUser.profile);
        } catch (error) {
          console.error('[InnerPeace] Error building user from Firebase:', error);
            setUser({
              id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
              createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            });
            setHasCompletedProfile(false);
          }
        } else {
        console.log('[InnerPeace] No authenticated user');
        setUser(null);
        setHasCompletedProfile(false);
      }

            setIsLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const register = async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    try {
      await updateFirebaseProfile(firebaseUser, { displayName: name });
    } catch (error) {
      console.warn('[InnerPeace] Failed to update Firebase displayName:', error);
    }

    const builtUser = await buildUserFromFirebase(firebaseUser);
    setUser(builtUser);
    setHasCompletedProfile(!!builtUser.profile);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will update the user state
  };

  const logout = async () => {
    localStorage.removeItem('innerpeace_user_data');
    localStorage.removeItem('profile_prompt_dismissed');
    await signOut(auth);
    // onAuthStateChanged will clear user state
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Update name/email in localStorage if provided
      if (updates.name || updates.email) {
        const savedData = localStorage.getItem('innerpeace_user_data');
        let userData: { name?: string; email?: string } = {};
        if (savedData) {
          try {
            userData = JSON.parse(savedData);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        userData = { ...userData, ...updates };
        localStorage.setItem('innerpeace_user_data', JSON.stringify(userData));
      }
    }
  };

  const completeProfile = async (data: { name: string; email: string; profile: Omit<UserProfile, 'completedAt'> }) => {
    if (!user) {
      throw new Error('User must be authenticated to complete profile');
    }

    const fullProfile: UserProfile = {
      ...data.profile,
      completedAt: new Date()
    };

    // Save to Firestore
    await saveUserProfile(user.id, fullProfile);

    // Update local user state
    const updatedUser: User = {
      ...user,
      name: data.name,
      email: data.email,
      profile: fullProfile
    };
    setUser(updatedUser);
    setHasCompletedProfile(true);

    // Optionally keep basic user data in localStorage for UX continuity
    const userData = { name: data.name, email: data.email };
    localStorage.setItem('innerpeace_user_data', JSON.stringify(userData));
  };

  return (
    <UserContext.Provider
      value={{ user, isLoading, login, register, logout, updateUser, completeProfile, hasCompletedProfile }}
    >
      {children}
    </UserContext.Provider>
  );
};

