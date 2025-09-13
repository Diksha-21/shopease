import { createContext, useState, useEffect, useContext } from "react";
import authApi from "../api/auth.js";
import { removeToken, setToken } from "../api/token.js";
import userApi from "../api/user.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const normalizeUser = (userObj) => {
    if (!userObj) return null;
    return { ...userObj, role: userObj.role || userObj.activeRole || "buyer" };
  };

  const login = async (credentials, rememberMe = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(credentials, rememberMe);
      if (result.success) {
        const updatedUser = normalizeUser(result.user);
        await setToken(result.token, rememberMe);
        setUser(updatedUser);
        setIsAuthenticated(true);
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        return { ...result, shouldRedirect: "/dashboard" };
      }
      return result;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.register(formData);
      if (result.success) {
        const updatedUser = normalizeUser(result.user);
        await setToken(result.token);
        setUser(updatedUser);
        setIsAuthenticated(true);
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      
        return { ...result, shouldRedirect: "/dashboard" };
      }
      return result;
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return { shouldRedirect: "/login" };
  };
  
  const updateUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const switchRole = async (targetRole, companyName = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.switchRole({ role: targetRole, companyName });
      if (!res.token || !res.user) throw new Error("Role switch failed");
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("user", JSON.stringify(res.user));
      return { success: true, user: res.user };
    } catch (err) {
      console.error("Role switch error:", err);
      setError(err.message || "Role switch failed");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const savedUser =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(sessionStorage.getItem("user"));
      if (savedUser) {
        setUser(normalizeUser(savedUser));
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Error: ",err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        setUser,
        login,
        register,
        logout,
        updateUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);