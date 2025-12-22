import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  login: (pin: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded user credentials (for internal tool)
const VALID_PIN = '5327';
const USER_NAME = 'Nick Panos';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Check localStorage for existing session
  useEffect(() => {
    const stored = localStorage.getItem('auth_session');
    if (stored === 'authenticated') {
      setIsAuthenticated(true);
      setUserName(USER_NAME);
    }
  }, []);

  const login = (pin: string): boolean => {
    if (pin === VALID_PIN) {
      setIsAuthenticated(true);
      setUserName(USER_NAME);
      localStorage.setItem('auth_session', 'authenticated');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserName(null);
    localStorage.removeItem('auth_session');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
