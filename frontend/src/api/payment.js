import { getToken } from "./token.js";

const API_URL = "http://localhost:5000/api/payments"; 

const coreFetch = async (url, options = {}) => {
  try {
    const token = getToken(); // from localStorage/sessionStorage
    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "API Error");
    return data;
  } catch (err) {
    console.error("Network/API Request Error:", err.message);
    return { success: false, message: err.message };
  }
};

// Create payment
export const createPayment = async (payload) => {
  return coreFetch("/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const verifyPayment = async (verificationData) => {
  return coreFetch("/verify", {
    method: "POST",
    body: JSON.stringify(verificationData),
  });
};


