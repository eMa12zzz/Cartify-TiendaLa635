import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUserType = localStorage.getItem('userType');
    
    if (savedToken) {
      setToken(savedToken);
      setUser({ type: savedUserType || 'employee' });
    }
    setLoading(false);
  }, []);

  const login = (newToken, userType = 'employee') => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userType', userType);
    setToken(newToken);
    setUser({ type: userType });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
