import { createContext, useEffect, useState } from 'react';
import api, { clearAuthStorage, persistAuthSession, refreshAuthSession, shouldRefreshSession } from '../api/axios';

export const AuthContext = createContext();

const normalizeUser = (userData) => {
  if (!userData) return null;

  return {
    ...userData,
    specialty: userData.specialty || userData.specialite || '',
    name: userData.name || [userData.prenom, userData.nom].filter(Boolean).join(' ').trim() || '',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!savedToken || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        if (shouldRefreshSession()) {
          await refreshAuthSession();
        }

        const activeToken = localStorage.getItem('token');
        const activeUser = localStorage.getItem('user');

        if (!activeToken || !activeUser) {
          throw new Error('Session locale incomplete');
        }

        setToken(activeToken);
        setUser(normalizeUser(JSON.parse(activeUser)));

        const { data } = await api.get('/users/profile');
        if (data) {
          updateUser(data);
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (sessionData, userData) => {
    const normalizedUser = normalizeUser(userData);
    persistAuthSession({
      ...sessionData,
      user: normalizedUser,
    });
    setToken(sessionData.token);
    setUser(normalizedUser);
  };

  const updateUser = (userData) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
