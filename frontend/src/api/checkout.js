import { apiRequest } from "./api.js";

export const buildOrderItems = async (data) => {
  try {
    const res = await apiRequest.post("/checkout/build", data);
    return res.data;
  } catch (err) {
    console.error("Build Order Items Error:", err);
    return { success: false, message: err.message };
  }
};
