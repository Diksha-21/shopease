import { removeToken, setToken } from "./token.js";
import { apiRequest } from "./api.js";

/* Register User */
const register = async (formDataObj) => {
  try {
    const response = await apiRequest.post(`/auth/register`, formDataObj);
    const { token, user } = response;
    setToken(token);
    return {
      success: true,
      token,
      user,
      message: "Registration successful",
    };
  } catch (err) {
    console.error("Registration error:", err);
    return {
      success: false,
      message: err.message || "Registration failed. Please try again.",
    };
  }
};

/* Login User */
const login = async (credentials, rememberMe = false) => {
  try {
    const { username, password } = credentials;
    const response = await apiRequest.post(`/auth/login`, {
      username,
      password,
      rememberMe,
    });
    if (!response.success || !response.token || !response.user) {
      throw new Error(response.message || "Login failed");
    }
    setToken(response.token, rememberMe);
    return {
      success: true,
      token: response.token,
      user: response.user,
      message: "Logged in successfully!",
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      success: false,
      message: err.message || "Invalid credentials. Please try again.",
    };
  }
};

/* Forgot Password */
const forgotPassword = async (email) => {
  try {
    const res = await apiRequest.post(`/auth/forgot-password`, { email });
    return { success: true, ...res }; // ✅ forward resetToken/resetLink
  } catch (err) {
    console.error("Forgot password error:", err);
    return {
      success: false,
      message: err.message || "Failed to send password reset.",
    };
  }
};


/* Logout */
const logout = () => {
  try {
    removeToken();
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return { success: true, message: "Logged out successfully" };
  } catch (err) {
    console.error("Logout error:", err);
    return { success: false, message: err.message || "Logout failed" };
  }
};

const authApi = { register, login, logout, forgotPassword };
export default authApi;
