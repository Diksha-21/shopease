import { createContext, useContext, useState, useEffect, useCallback } from "react";
import cartApi from "../api/cart.js";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], cartTotal: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartApi.getCart();
      console.log("Cart API response:", response);

      if (response.success) {
        if (response.data && Array.isArray(response.data)) {
          setCart({ 
            items: response.data, 
            cartTotal: response.data.reduce((total, item) => total + (item.price * item.quantity), 0),
            totalItems: response.data.reduce((total, item) => total + item.quantity, 0)
          });
        } else if (response.data && response.data.items) {
          setCart(response.data);
        } else if (response.data) {
          setCart(response.data);
        } else {
          setCart({ items: [], cartTotal: 0, totalItems: 0 });
        }
        setServerOnline(true);
      } else {
        setCart({ items: [], cartTotal: 0, totalItems: 0 });
        setError(response.message);
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
      setCart({ items: [], cartTotal: 0, totalItems: 0 });
      setError(err.message);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await cartApi.addToCart(productId, quantity);
      if (response.success) {
        await fetchCart();
        return response;
      }
      return response;
    } catch (err) {
      console.error("Add to cart error:", err);
      return { success: false, message: err.message };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await cartApi.updateCartItem(productId, quantity);
      if (response.success) {
        await fetchCart();
        return response;
      }
      return response;
    } catch (err) {
      console.error("Update cart error:", err);
      return { success: false, message: err.message };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await cartApi.removeFromCart(productId);
      if (response.success) {
        await fetchCart();
        return response;
      }
      return response;
    } catch (err) {
      console.error("Remove from cart error:", err);
      return { success: false, message: err.message };
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartApi.clearCart();
      if (response.success) {
        setCart({ items: [], cartTotal: 0, totalItems: 0 });
      }
      return response;
    } catch (err) {
      console.error("Clear cart error:", err);
      return { success: false, message: err.message };
    }
  };

  const refreshCart = useCallback(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        serverOnline,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);