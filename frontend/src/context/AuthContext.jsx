import { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUserType = localStorage.getItem('userType');
    const savedUserData = localStorage.getItem('userData');
    
    if (savedToken) {
      setToken(savedToken);
      setUser({ 
        type: savedUserType || 'employee', 
        ...(savedUserData ? JSON.parse(savedUserData) : {}) 
      });
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken, userType = 'employee', userData = null) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userType', userType);
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    setToken(newToken);
    setUser({ type: userType, ...userData });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
