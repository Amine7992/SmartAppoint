import { createContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

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
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const decoded = jwtDecode(savedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(savedToken);
          setUser(normalizeUser(JSON.parse(savedUser)));

          api.get('/users/profile')
            .then(({ data }) => {
              if (data) {
                updateUser(data);
              }
            })
            .catch(() => {
              // Keep the cached user if the refresh endpoint is temporarily unavailable.
            });
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (nextToken, userData) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(nextToken);
    setUser(normalizedUser);
  };

  const updateUser = (userData) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
