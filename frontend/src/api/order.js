import { apiRequest } from "./api.js";

/* Place order */
const placeOrder = async (orderData) => {
  try {
    const res = await apiRequest.post(`/orders/place`, orderData); // ✅ Direct body passing
    return { success: true, data: res.data, message: res.message };
  } catch (err) {
    console.error("Order placement error:", err);
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to place order'
    };
  }
};

/* Get orders */
const getOrders = async () => {
  try {
    const res = await apiRequest.get(`/orders/buyer`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error fetching orders:', err);
    return { success: false, message: err.message || 'Failed to fetch orders' };
  }
};

/* Get order details */
const getOrderDetails = async (orderId) => {
  try {
    const res = await apiRequest.get(`/orders/${orderId}`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error fetching order details:', err);
    return { success: false, message: err.message || 'Failed to fetch order details' };
  }
};

/* Cancel order */
const cancelOrder = async (orderId) => {
  try {
    const res = await apiRequest.delete(`/orders/${orderId}/cancel`);
    return { success: true, data: res.data, message: res.message };
  } catch (err) {
    console.error('Error canceling order:', err);
    return { success: false, message: err.message };
  }
};

/* Get Seller orders */
const getSellerOrders = async () => {
  try {
    const res = await apiRequest.get(`/orders/seller`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Error fetching seller orders:', err);
    return { success: false, message: err.message || 'Failed to fetch seller orders' };
  }
};

const orderApi = {
  placeOrder, getOrders, getOrderDetails, cancelOrder, getSellerOrders
};

export default orderApi;
