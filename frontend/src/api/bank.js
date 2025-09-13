import { apiRequest } from "./api.js";

export const getBankAccounts = async () => {
  try {
    const res = await apiRequest.get("/bank-accounts");
    return res;
  } catch (err) {
    console.error("Get bank accounts error:", err);
    throw err;
  }
};

export const addBankAccount = async (data) => {
  try {
    const res = await apiRequest.post("/bank-accounts", data);
    return res;
  } catch (err) {
    console.error("Add bank account error:", err);
    throw err;
  }
};

export const updateBankAccount = async (id, data) => {
  try {
    const res = await apiRequest.put(`/bank-accounts/${id}`, data);
    return res;
  } catch (err) {
    console.error("Update bank account error:", err);
    throw err;
  }
};

export const deleteBankAccount = async (id) => {
  try {
    const res = await apiRequest.delete(`/bank-accounts/${id}`);
    return res;
  } catch (err) {
    console.error("Delete bank account error:", err);
    throw err;
  }
};
