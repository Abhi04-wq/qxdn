import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import api from '../lib/api.js';

const TOKEN_KEY = 'qndx_token';
const USER_KEY = 'qndx_user';

export const AuthContext = createContext(null);

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const cachedUser = storedUser();

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);
      setUser(cachedUser);

      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const persist = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    setToken(data.token);
    return data;
  }, []);

  // Member login - POST /api/auth/member-login (requires verified email server-side)
  const loginMember = useCallback(
    async (email, password) => {
      const { data } = await api.post('/api/auth/member-login', { email, password });
      return persist(data.data);
    },
    [persist]
  );

  // Admin login - POST /api/auth/admin-login (role enforced server-side)
  const loginAdmin = useCallback(
    async (email, password) => {
      const { data } = await api.post('/api/auth/admin-login', { email, password });
      return persist(data.data);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, loginMember, loginAdmin, logout }),
    [user, token, isLoading, loginMember, loginAdmin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
