import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'ADMIN' | 'EMPLOYEE_OPS' | 'EMPLOYEE_SUPPORT' | 'CUSTOMER';

interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

interface AuthResult {
  success: boolean;
  isNewUser?: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  firebaseLoginHandle: (uid: string, phoneNumber: string, password?: string) => Promise<AuthResult>;
  registerUser: (email: string, password: string, username: string, role?: Role) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = localStorage.getItem('rustic_user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          
          // Fetch latest user data in background to sync multiple device changes
          try {
            const res = await fetch(`/api/auth/profile/${parsedUser.id}`);
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              localStorage.setItem('rustic_user', JSON.stringify(data.user));
            } else if (res.status === 404) {
              // User was deleted
              setUser(null);
              localStorage.removeItem('rustic_user');
            }
          } catch (e) {
            // Silently fail auth fetch if network is unavailable
          }
        }
      } catch (e) {
        // Suppress parsing error
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rustic_user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const firebaseLoginHandle = async (uid: string, phoneNumber: string, password?: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, phoneNumber, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('rustic_user', JSON.stringify(data.user));
        return { success: true, isNewUser: data.isNewUser };
      }
      return { success: false };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('rustic_user', JSON.stringify(data.user));
        return { success: true, isNewUser: data.isNewUser };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error.message || 'An error occurred' };
    }
  };

  const registerUser = async (email: string, password: string, username: string, role: string = 'CUSTOMER'): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, role })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('rustic_user', JSON.stringify(data.user));
        return { success: true, isNewUser: data.isNewUser };
      }
      return { success: false };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {}
    setUser(null);
    localStorage.removeItem('rustic_user');
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('rustic_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, firebaseLoginHandle, registerUser, logout, updateUser, loading }}>
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
