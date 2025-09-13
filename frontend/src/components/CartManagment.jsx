import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../api/api.js";

const CartManagement = () => {
  const { 
    cart, 
    loading, 
    error, 
    serverOnline, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    refreshCart 
  } = useCart();
  
  const items = Array.isArray(cart) ? cart : cart?.items || [];
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  const handleQuantityChange = async (cartItem, newQuantity) => {
    if (newQuantity < 1) return;
    
    if (!serverOnline) {
      toast.error("Server is offline. Cannot update cart.");
      return;
    }

    setUpdatingId(cartItem._id);
    try {
      const productId = cartItem.productId;
      if (!productId) {
        toast.error("Invalid product ID");
        return;
      }

      const updated = await updateCartItem(productId, newQuantity);
      if (updated.success) {
        toast.success("Quantity updated successfully");
      } else {
        toast.error(updated.message || "Failed to update quantity");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (cartItem) => {
    if (!serverOnline) {
      toast.error("Server is offline. Cannot remove item.");
      return;
    }

    setRemovingId(cartItem._id);
    try {
      const productId = cartItem.productId;
      if (!productId) {
        toast.error("Invalid product ID");
        return;
      }

      const result = await removeFromCart(productId);
      if (result.success) {
        toast.success("Item removed from cart");
      } else {
        toast.error(result.message || "Failed to remove item");
      }
    } catch (err) {
      console.error("Remove error:", err);
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) {
      toast.info("Cart is already empty");
      return;
    }

    if (!serverOnline) {
      toast.error("Server is offline. Cannot clear cart.");
      return;
    }

    setClearingCart(true);
    try {
      const result = await clearCart();
      if (result.success) {
        toast.success("Cart cleared successfully");
      } else {
        toast.error(result.message || "Failed to clear cart");
      }
    } catch (err) {
      console.error("Clear cart error:", err);
      toast.error("Failed to clear cart");
    } finally {
      setClearingCart(false);
    }
  };

  const handleCheckOut = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!serverOnline) {
      toast.error("Server is offline. Cannot proceed to checkout.");
      return;
    }

    try {
      setCheckingOut(true);
      navigate("/dashboard/checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleContinueShopping = () => {
    navigate("/products");
  };

  const getSafeImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
    return '/placeholder-product.jpg';
    }
    
    const firstImage = images[0];
    
    if (typeof firstImage === 'object' && firstImage.url) {
      return getImageUrl(firstImage.url);
    }
    
    return getImageUrl(firstImage);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 0 ? 0 : 0;
  const tax = subtotal * 0.00;
  const total = subtotal + shipping + tax;

  if (!serverOnline) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center py-12">
          <div className={`p-6 rounded-lg ${
            theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
          } border-2`}>
            <h2 className="text-2xl font-bold mb-4">Server Offline</h2>
            <p className="text-lg mb-4">
              Cannot connect to the server. Your cart data may not be saved.
            </p>
            <p>
              Please check your internet connection and ensure the backend server is running.
            </p>
            {error && (
              <p className={`mt-4 text-sm ${
                theme === 'dark' ? 'text-red-300' : 'text-red-600'
              }`}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center py-12">
          <div className={`p-8 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
            <p className="text-lg mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <button
              onClick={handleContinueShopping}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Shopping Cart ({items.length})</h1>
            <button
              onClick={handleClearCart}
              disabled={clearingCart}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50`}
            >
              {clearingCart ? 'Clearing...' : 'Clear Cart'}
            </button>
          </div>

          {items.map((item) => (
            <div
              key={item._id}
              className={`p-4 rounded-lg shadow-sm border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={getSafeImageUrl(item.images)}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>

                {/* Product Details */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ₹{item.price} each
                  </p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {item.available} available
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    disabled={updatingId === item._id || item.quantity <= 1}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    -
                  </button>
                  
                  <span className="w-12 text-center font-medium">
                    {updatingId === item._id ? '...' : item.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    disabled={updatingId === item._id || item.quantity >= item.available}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    +
                  </button>
                </div>

                {/* Item Total & Remove */}
                <div className="text-right">
                  <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => handleRemoveItem(item)}
                    disabled={removingId === item._id}
                    className={`mt-2 text-sm ${
                      theme === 'dark' 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-red-600 hover:text-red-800'
                    } disabled:opacity-50`}
                  >
                    {removingId === item._id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-lg shadow-lg sticky top-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <hr className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <button
                onClick={handleContinueShopping}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartManagement;