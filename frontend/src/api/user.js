import { apiRequest } from "./api.js";
import { setToken } from "./token.js";

/* Get user profile */
const getProfile = async () => {
  try {
    const response = await apiRequest.get(`/users/profile`); 
    return {
      success: true,
      user: response.user
    };
  } catch (error) {
    console.error("Profile fetch error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch profile"
    };
  }
};

/* Update user profile */
const updateProfile = async (profileData) => {
  try {
    const response = await apiRequest.put(`/users/profile`, profileData);
    return {
      success: true,
      message: response.message,
      user: response.user,
      ...(response.token && { token: response.token })
    };
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      message: error.message || "Failed to update profile"
    };
  }
};

/* Upload profile image */
const uploadProfileImage = async (formData) => {
  try {
    const response = await apiRequest.post(`/users/profile/image`, formData);
    return {
      success: true,
      filename: response.filename,
      path: response.path,
      message: response.message
    };
  } catch (error) {
    console.error("Profile image upload error:", error);
    return {
      success: false,
      message: error.message || "Failed to upload profile image"
    };
  }
};

/* Update user settings */
const updateSettings = async (settings) => {
  try {
    const response = await apiRequest.put(`/users/settings`, settings);
    return {
      success: true,
      message: response.message,
      user: response.user
    };
  } catch (error) {
    console.error("Settings update error:", error);
    return {
      success: false,
      message: error.message || "Failed to update settings"
    };
  }
};

/* Change user password */
const changePassword = async (data) => {
  try {
    const response = await apiRequest.put(`/users/change-password`, data);
    return {
      success: true,
      message: response.message
    };
  } catch (error) {
    console.error("Password change error:", error);
    return {
      success: false,
      message: error.message || "Failed to change password"
    };
  }
};

/* Switch Role */
const switchRole = async ({ role, companyName, rememberMe = false } = {}) => {
  try {
    const response = await apiRequest.post(`/users/switch-role`, { role, companyName });
    
    if (response.token) {
      setToken(response.token, rememberMe);
    }

    return {
      success: true,
      message: response.message,
      token: response.token,
      user: response.user
    };
  } catch (error) {
    console.error("Role switch error:", error);
    return { 
      success: false, 
      message: error.message || "Failed to switch role" 
    };
  }
};

/* Delete User */
const deleteUser = async () => {
  try {
    const response = await apiRequest.delete(`/users`);
    return {
      success: true,
      message: response.message
    };
  } catch (error) {
    console.error("Account deletion error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete account"
    };
  }
};

const userApi = { getProfile, updateProfile, uploadProfileImage, updateSettings, changePassword, switchRole, deleteUser };
export default userApi;
