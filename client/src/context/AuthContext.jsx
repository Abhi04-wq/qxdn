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
    sessionStorage.removeItem('qndx_admin_backup_token');
    sessionStorage.removeItem('qndx_admin_backup_user');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  // Admin Impersonation: Seamlessly login as member with full dashboard access
  const impersonateMember = useCallback((memberData) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const currentUser = localStorage.getItem(USER_KEY);
    if (currentToken && currentUser) {
      sessionStorage.setItem('qndx_admin_backup_token', currentToken);
      sessionStorage.setItem('qndx_admin_backup_user', currentUser);
    }
    return persist(memberData);
  }, [persist]);

  const exitImpersonation = useCallback(() => {
    const adminToken = sessionStorage.getItem('qndx_admin_backup_token');
    const adminUser = sessionStorage.getItem('qndx_admin_backup_user');
    sessionStorage.removeItem('qndx_admin_backup_token');
    sessionStorage.removeItem('qndx_admin_backup_user');

    if (adminToken && adminUser) {
      try {
        const parsed = JSON.parse(adminUser);
        return persist({ ...parsed, token: adminToken });
      } catch {
        // fallback
      }
    }
    logout();
  }, [persist, logout]);

  const isImpersonating = useMemo(() => {
    return Boolean(typeof window !== 'undefined' && sessionStorage.getItem('qndx_admin_backup_token'));
  }, [user, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      loginMember,
      loginAdmin,
      logout,
      impersonateMember,
      exitImpersonation,
      isImpersonating,
    }),
    [user, token, isLoading, loginMember, loginAdmin, logout, impersonateMember, exitImpersonation, isImpersonating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
