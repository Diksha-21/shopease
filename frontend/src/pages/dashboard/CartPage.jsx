import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getImageUrl } from "../../api/api.js";
import { 
  ShoppingCartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  ArrowLeftIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

const getProductId = (item) => item?.productId || item?.product?._id || item?._id || item?.id;

const CartPage = () => {
  const { cart, loading, error, serverOnline, updateCartItem, removeFromCart, clearCart, fetchCart } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  const [clearingCart, setClearingCart] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const cartItems = Array.isArray(cart) ? cart : cart?.items || [];

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (cartItems.length > 0) {
      console.log("Cart items structure:", cartItems);
      console.log("First item images:", cartItems[0]?.images);
    }
  }, [cartItems]);

  const calculateItemTotal = (item) => (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
  const calculateSubtotal = () => cartItems.reduce((t, it) => t + calculateItemTotal(it), 0);
  const calculateSelectedTotal = () =>
    cartItems
      .filter((it) => selectedItems.has(getProductId(it)))
      .reduce((t, it) => t + calculateItemTotal(it), 0);

  const handleQuantityChange = async (item, newQuantity) => {
    const available = item?.available ?? item?.product?.available ?? 100;
    if (newQuantity < 1 || newQuantity > available) return;
    
    const productId = getProductId(item);
    if (!productId) return toast.error("Invalid product ID");
    
    setUpdatingItems((prev) => new Set([...prev, productId]));
    
    try {
      const result = await updateCartItem(productId, newQuantity);
      
      if (result?.success) {
        toast.success("Quantity updated");
        await fetchCart();
      } else {
        toast.error(result?.message || "Failed to update");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItems((prev) => {
        const s = new Set(prev);
        s.delete(productId);
        return s;
      });
    }
  };

  const handleRemoveItem = async (item) => {
    const productId = getProductId(item);
    if (!productId) return toast.error("Invalid product ID");
    
    if (!window.confirm(`Remove ${item?.name || "item"} from cart?`)) return;
    
    setRemovingItems((prev) => new Set([...prev, productId]));
    
    try {
      const result = await removeFromCart(productId);
      
      if (result?.success) {
        toast.success("Item removed");
        setSelectedItems((prev) => {
          const s = new Set(prev);
          s.delete(productId);
          return s;
        });
        await fetchCart();
      } else {
        toast.error(result?.message || "Failed to remove");
      }
    } catch (err) {
      console.error("Remove error:", err);
      toast.error("Failed to remove item");
    } finally {
      setRemovingItems((prev) => {
        const s = new Set(prev);
        s.delete(productId);
        return s;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;
    
    setClearingCart(true);
    try {
      const result = await clearCart();
      if (result?.success) {
        toast.success("Cart cleared");
        setSelectedItems(new Set());
      } else {
        toast.error(result?.message || "Failed to clear cart");
      }
    } catch (err) {
      console.error("Clear cart error:", err);
      toast.error("Failed to clear cart");
    } finally {
      setClearingCart(false);
    }
  };

  const handleSelectItem = (productId) => {
    setSelectedItems((prev) => {
      const s = new Set(prev);
      if (s.has(productId)) {
        s.delete(productId);
      } else {
        s.add(productId);
      }
      return s;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((it) => getProductId(it)).filter(Boolean)));
    }
  };

  const handleCheckout = (items) => {
    if (!items || items.length === 0) {
      return toast.error("No items selected for checkout");
    }
    
    const directPurchase = items.length === 1;
    const first = items[0];
    const pid = getProductId(first);
    
    navigate("/dashboard/checkout", {
      state: {
        directPurchase,
        productData: directPurchase ? { 
          _id: pid, 
          name: first?.name, 
          price: first?.price, 
          images: first?.product?.images || first?.images
        } : null,
        cartItems: items,
        quantity: directPurchase ? first?.quantity : undefined,
      },
    });
  };

  const handleBuyNow = (item) => handleCheckout([item]);
  const handleCheckoutSelected = () => {
    const selectedCartItems = cartItems.filter((it) => selectedItems.has(getProductId(it)));
    handleCheckout(selectedCartItems);
  };

  if (!serverOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-5 rounded-xl">
          <p className="font-medium">Cannot connect to the server. Cart may not be up to date.</p>
          {error && <pre className="text-sm mt-3 bg-red-200 dark:bg-red-950 p-3 rounded">{String(error)}</pre>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
            <span className="ml-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {cartItems.length} items
            </span>
          </div>
          
          <button
            onClick={fetchCart}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            Refresh
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
            <ShoppingCartIcon className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <button
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                      Select all items
                    </label>
                  </div>
                  <button
                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors flex items-center"
                    onClick={handleClearCart}
                    disabled={clearingCart}
                  >
                    <TrashIcon className="h-5 w-5 mr-1" />
                    {clearingCart ? "Clearing..." : "Clear Cart"}
                  </button>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item, index) => {
                    const pid = getProductId(item);
                    const pending = updatingItems.has(pid) || removingItems.has(pid);
                    const available = item?.available ?? item?.product?.available ?? 100;
                    const qty = Number(item?.quantity) || 0;
                    const price = Number(item?.price) || 0;

                    return (
                      <div key={`${pid}-${index}`} className={`p-6 ${pending ? 'opacity-60' : ''}`}>
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(pid)}
                            onChange={() => handleSelectItem(pid)}
                            className="w-5 h-5 mt-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          
                          <div className="ml-4 flex-shrink-0">
                            <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img
                                src={getImageUrl(item?.images?.[0])}
                                alt={item?.name || "Product"}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = "/placeholder-product.jpg"; }}
                              />
                            </div>
                          </div>

                          <div className="ml-6 flex-grow">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {item?.name || "Product"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">₹{price.toFixed(2)} each</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {available} available in stock
                            </p>
                            
                            <div className="flex items-center mt-4">
                              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                <button
                                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg disabled:opacity-50"
                                  onClick={() => handleQuantityChange(item, qty - 1)}
                                  disabled={pending || qty <= 1}
                                >
                                  <MinusIcon className="h-5 w-5" />
                                </button>
                                
                                <span className="px-3 py-1 text-gray-900 dark:text-white font-medium">
                                  {qty}
                                </span>
                                
                                <button
                                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg disabled:opacity-50"
                                  onClick={() => handleQuantityChange(item, qty + 1)}
                                  disabled={pending || qty >= available}
                                >
                                  <PlusIcon className="h-5 w-5" />
                                </button>
                              </div>

                              <button
                                className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 transition-colors"
                                onClick={() => handleRemoveItem(item)}
                                disabled={pending}
                                title="Remove item"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>

                              <button
                                className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                                onClick={() => handleBuyNow(item)}
                                disabled={pending}
                              >
                                Buy Now
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              ₹{(price * qty).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Items ({cartItems.length})</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                    <span className="font-medium text-green-600 dark:text-green-400">FREE</span>
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    onClick={handleCheckoutSelected}
                    disabled={selectedItems.size === 0}
                  >
                    Checkout Selected ({selectedItems.size})
                  </button>
                  
                  <button
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    onClick={() => handleCheckout(cartItems)}
                  >
                    Checkout All Items
                  </button>
                  
                  <button
                    className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    onClick={() => navigate("/products")}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;