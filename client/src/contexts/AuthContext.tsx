
import * as React from 'react';

interface AuthContextType {
  token: string | null;
  user: { id: number; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: { id: number; email: string }) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = React.useState<{ id: number; email: string } | null>(() => {
    const storedUser = localStorage.getItem('authUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // This effect is just to manage the loading state on initial mount.
    // The initial state is already set from localStorage.
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: { id: number; email: string }) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
