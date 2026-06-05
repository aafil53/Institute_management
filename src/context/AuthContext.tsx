import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signIn as supabaseSignIn, signOut as supabaseSignOut, onAuthStateChange, getCurrentUser } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin' | 'student';
  departmentOrId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Supabase auth state changes on mount
  useEffect(() => {
    const subscription = onAuthStateChange(async (authUser) => {
      if (authUser) {
        // Fetch full user profile including role from database
        const userProfile = await getCurrentUser();
        if (userProfile) {
          setUser({
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role as 'teacher' | 'admin' | 'student',
            departmentOrId: userProfile.department || userProfile.id,
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Sign in with Supabase
      const result = await supabaseSignIn(email, password);
      
      if (!result.user) {
        console.error('Sign in error: No user returned');
        return false;
      }

      // Fetch user profile with role from database
      const userProfile = await getCurrentUser();
      if (userProfile) {
        setUser({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role as 'teacher' | 'admin' | 'student',
          departmentOrId: userProfile.department || userProfile.id,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
