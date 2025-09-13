import { apiRequest } from './api.js';
import { getToken, removeToken } from './token.js';

const verifyToken = () => getToken() || null;

const getCart = async () => {
  try {
    const token = verifyToken();
    if (!token) {
      return { success: false, message: 'Not authenticated', data: { items: [], totalItems: 0 } };
    }
    
    const res = await apiRequest.get('/cart');
    console.log("Raw cart API response:", res);

    if (res.success) {
      return { 
        success: true, 
        data: res.data || res,
        message: res.message || 'Cart fetched successfully'
      };
    } else {
      return { 
        success: false, 
        message: res.message || 'Failed to fetch cart',
        data: { items: [], totalItems: 0 }
      };
    }
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      removeToken();
    }
    console.error('Failed to get cart:', err);
    return { 
      success: false, 
      message: err.message || 'Failed to load cart',
      data: { items: [], totalItems: 0 }
    };
  }
};

const addToCart = async (productId, quantity = 1) => {
  try {
    const token = verifyToken();
    if (!token) {
      return { success: false, message: 'User not authenticated' };
    }

    // Validate productId
    if (!productId || !productId.trim()) {
      return { success: false, message: 'Invalid product ID' };
    }

    if (quantity < 1) {
      return { success: false, message: 'Quantity must be at least 1' };
    }

    const res = await apiRequest.post('/cart/items', { productId, quantity });
    
    return {
      success: res.success, 
      data: res.data || res, 
      message: res.message || res.success ? 'Product added to cart successfully' : 'Failed to add product'
    };
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      removeToken();
    }
    console.error('Failed to add product to cart:', err);
    return {
      success: false, 
      message: err.message || 'Failed to add product to cart'
    };
  }
};

const updateCartItem = async (productId, quantity) => {
  try {
    const token = verifyToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    if (!productId || !productId.trim()) {
      return { success: false, message: 'Invalid product ID' };
    }

    if (quantity < 1) {
      return { success: false, message: 'Quantity must be at least 1' };
    }

    const res = await apiRequest.put(`/cart/items/${productId}`, { quantity });
    return { 
      success: res.success, 
      data: res.data || res, 
      message: res.message || res.success ? 'Cart item updated successfully' : 'Failed to update cart item'
    };
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      removeToken();
    }
    console.error('Failed to update cart item:', err);
    return {
      success: false, 
      message: err.message || 'Failed to update products in the cart'
    };
  }
};

const removeFromCart = async (productId) => {
  try {
    const token = verifyToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    if (!productId || !productId.trim()) {
      return { success: false, message: 'Invalid product ID' };
    }

    const res = await apiRequest.delete(`/cart/items/${productId}`);
    return { 
      success: res.success, 
      data: res.data || res, 
      message: res.message || res.success ? 'Item removed from cart successfully' : 'Failed to remove item'
    };
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      removeToken();
    }
    console.error('Failed to remove from cart:', err);
    return {
      success: false, 
      message: err.message || 'Failed to remove from cart'
    };
  }
};

const clearCart = async () => {
  try {
    const token = verifyToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const res = await apiRequest.delete(`/cart`);
    return { 
      success: res.success, 
      data: res.data || res, 
      message: res.message || res.success ? 'Cart cleared successfully' : 'Failed to clear cart'
    };
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      removeToken();
    }
    console.error('Failed to clear cart:', err);
    return {
      success: false, 
      message: err.message || 'Failed to clear cart'
    };
  }
};

const cartApi = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
export default cartApi;