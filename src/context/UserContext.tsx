import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (name: string, email: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
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

  useEffect(() => {
    let isMounted = true;
    
    const initializeUser = async () => {
      console.log('[InnerPeace] Initializing user authentication...');
      
      // Try Firebase Auth first
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        
        const savedData = localStorage.getItem('innerpeace_user_data');
        let userData: { name?: string; email?: string } = {};
        if (savedData) {
          try {
            userData = JSON.parse(savedData);
          } catch (e) {
            console.error('[InnerPeace] Error parsing user data:', e);
          }
        }
        
        if (firebaseUser) {
          // Firebase Auth user exists
          console.log('[InnerPeace] ✓ Firebase Auth user:', firebaseUser.uid);
          setUser({
            id: firebaseUser.uid,
            name: userData.name || 'User',
            email: userData.email || '',
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now())
          });
          setIsLoading(false);
        } else {
          // Try to sign in anonymously
          try {
            console.log('[InnerPeace] Attempting anonymous sign-in...');
            const credential = await signInAnonymously(auth);
            console.log('[InnerPeace] ✓ Anonymous sign-in successful:', credential.user.uid);
            // onAuthStateChanged will be triggered with the new user
          } catch (error: any) {
            console.warn('[InnerPeace] Anonymous auth failed:', error.code);
            console.log('[InnerPeace] Falling back to local UUID-based auth');
            
            // Fallback: use persistent UUID stored in localStorage
            let fallbackId = localStorage.getItem('innerpeace_fallback_uid');
            if (!fallbackId) {
              fallbackId = uuidv4();
              localStorage.setItem('innerpeace_fallback_uid', fallbackId);
              console.log('[InnerPeace] ✓ Generated new fallback UID:', fallbackId);
            } else {
              console.log('[InnerPeace] ✓ Using existing fallback UID:', fallbackId);
            }
            
            setUser({
              id: fallbackId,
              name: userData.name || 'User',
              email: userData.email || '',
              createdAt: new Date()
            });
            setIsLoading(false);
          }
        }
      });

      return unsubscribe;
    };
    
    const unsubscribePromise = initializeUser();

    return () => {
      isMounted = false;
      unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, []);

  const login = (name: string, email: string) => {
    // Store name/email in localStorage (user.id comes from Firebase Auth)
    const userData = { name, email };
    localStorage.setItem('innerpeace_user_data', JSON.stringify(userData));
    
    if (user) {
      // Update existing user with new name/email
      const updatedUser = { ...user, name, email };
      setUser(updatedUser);
    }
  };

  const logout = () => {
    // Clear user data but keep anonymous auth (or could call auth.signOut())
    localStorage.removeItem('innerpeace_user_data');
    if (user) {
      setUser({
        ...user,
        name: 'User',
        email: ''
      });
    }
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

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

