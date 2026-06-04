import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  departmentOrId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: 'teacher' | 'admin') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials database
const MOCK_CREDENTIALS = {
  admin: [
    { email: 'admin@hudur.edu', password: 'admin123', id: 'admin-1', name: 'Dr. Sarah Admin' },
    { email: 'principal@hudur.edu', password: 'principal123', id: 'admin-2', name: 'Mr. John Principal' },
  ],
  teacher: [
    { email: 'sara@hudur.edu', password: 'teacher123', id: 'teach-sara', name: 'Sara Khan', department: 'Science' },
    { email: 'ahmed@hudur.edu', password: 'teacher123', id: 'teach-ahmed', name: 'Ahmed Hassan', department: 'Mathematics' },
    { email: 'fatima@hudur.edu', password: 'teacher123', id: 'teach-fatima', name: 'Fatima Ali', department: 'English' },
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('hudur_auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to restore auth user from localStorage:', error);
        localStorage.removeItem('hudur_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'teacher' | 'admin'): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const credentials = MOCK_CREDENTIALS[role] as any[];
      const foundUser = credentials.find(
        cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
      );

      if (foundUser) {
        const authUser: AuthUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role,
          departmentOrId: foundUser.department || foundUser.id,
        };
        setUser(authUser);
        localStorage.setItem('hudur_auth_user', JSON.stringify(authUser));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hudur_auth_user');
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
