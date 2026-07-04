import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const localUser = localStorage.getItem('user');
      return localUser ? JSON.parse(localUser) : null;
    } catch {
      return null;
    }
  });

  // Sync user state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (userData) => {
    setUser((prevUser) => {
      return {
        ...prevUser,
        ...userData,
        // Ensure token is preserved if it exists in previous state and is missing in new data
        token: userData?.token || prevUser?.token
      };
    });
  };

  const logout = () => {
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const localUserStr = localStorage.getItem('user');
      const localUser = localUserStr ? JSON.parse(localUserStr) : null;
      if (localUser && localUser.token) {
        const res = await API.get('/users/profile');
        if (res.data) {
          login(res.data);
        }
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  useEffect(() => {
    const fetchLatestProfile = async () => {
      await refreshProfile();
    };

    fetchLatestProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
