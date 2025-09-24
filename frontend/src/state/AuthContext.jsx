import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Create a default user without requiring login
  const [user, setUser] = useState({
    _id: 'default-user',
    name: 'Default User',
    email: 'user@example.com'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // No need to check login status anymore
  useEffect(() => {
    // Set default user immediately
    setLoading(false);
  }, []);

  // Simplified dummy functions that don't do anything
  const login = async () => {
    return user;
  };

  const register = async () => {
    return user;
  };

  const logout = () => {
    // Do nothing
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);