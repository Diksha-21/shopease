import { Link } from 'react-router-dom';
import { ShoppingCartIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../../api/api';

const BuyerDashboard = ({ stats, theme, cart, loading, user }) => {
  
  const recentOrders = stats?.recentOrders || [];
  const cartItems = Array.isArray(cart) ? cart : cart?.items || [];
  const cartTotal = cart?.cartTotal || 0;
  const totalItems = cart?.totalItems || cartItems.length;

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderTotal = (order) => {
    console.log("Order object:", order); 
    
    const possibleTotalFields = [
      'totalAmount', 'total', 'amount', 'grandTotal', 'finalAmount',
      'orderTotal', 'paymentAmount', 'price', 'value'
    ];
    
    for (const field of possibleTotalFields) {
      if (order[field] !== undefined && order[field] !== null) {
        return order[field];
      }
    }
    
    if (order.items && Array.isArray(order.items)) {
      const calculatedTotal = order.items.reduce((sum, item) => {
        const itemPrice = item.price || item.unitPrice || 0;
        const itemQuantity = item.quantity || 1;
        return sum + (itemPrice * itemQuantity);
      }, 0);
      
      if (calculatedTotal > 0) {
        return calculatedTotal;
      }
    }
    
    return 0;
  };

  const getOrderNumber = (order) => {
    return order.orderNumber || order.orderId || order._id?.slice(-6) || 'Unknown';
  };

  const getItemCount = (order) => {
    if (order.items && Array.isArray(order.items)) {
      return order.items.length;
    }
    return order.itemCount || order.totalItems || 1;
  };

  const getCartItemImage = (item) => {
    let images = item?.images || item?.image || item?.productId?.images || [];

    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }

    console.log("Buyer dashboard image:", images);

    if (!images.length) {
      return "/placeholder-product.jpg";
    }

    const imagePath = images[0];
    if (typeof imagePath === "string" && imagePath.startsWith("http")) {
      return imagePath;
    }

    return getImageUrl(imagePath);
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.username || user?.name || 'Buyer'}!
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Here's what's happening with your account today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center">
              <ShoppingCartIcon className="h-10 w-10 text-blue-600" />
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Items in Cart
                </p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-10 w-10 text-green-600" />
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Cart Total
                </p>
                <p className="text-2xl font-bold">₹{formatPrice(cartTotal)}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center">
              <ClockIcon className="h-10 w-10 text-purple-600" />
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recent Orders
                </p>
                <p className="text-2xl font-bold">{recentOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders Section */}
          <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
                <Link 
                  to="/dashboard/orders" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    No recent orders found
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    Start shopping to see your orders here
                  </p>
                  <Link 
                    to="/dashboard/products/buyer" 
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order, index) => {
                    const orderTotal = getOrderTotal(order);
                    console.log(`Order ${index} total:`, orderTotal); // Debugging
                    
                    return (
                      <div key={order._id || index} className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-medium">
                                Order #{getOrderNumber(order)}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status || 'Unknown'}
                              </span>
                            </div>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Placed on {formatDate(order.createdAt || order.orderDate)}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {getItemCount(order)} item(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">₹{formatPrice(orderTotal)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Your Cart Section */}
          <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Cart</h2>
                <Link 
                  to="/dashboard/cart" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Cart
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="h-12 w-12 bg-gray-300 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your cart is empty
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    Add some items to get started
                  </p>
                  <Link 
                    to="/dashboard/products/buyer" 
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cartItems.slice(0, 3).map((item, index) => (
                      <div key={item._id || index} className="flex items-center space-x-4">
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={getCartItemImage(item)}
                            alt={item.name || item.productId?.name ||'Product'}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "/placeholder-product.jpg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name || 'Product'}</p>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              ₹{formatPrice(item.price)} each
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                Qty: {item.quantity || 1}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ₹{formatPrice((item.price || 0) * (item.quantity || 1))}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {cartItems.length > 3 && (
                      <div className={`text-center py-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        +{cartItems.length - 3} more items
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className={`border-t pt-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">₹{formatPrice(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span className="font-semibold text-green-600">FREE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="font-semibold">₹0.00</span>
                      </div>
                      <div className={`flex justify-between text-lg font-bold border-t pt-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        <span>Total:</span>
                        <span>₹{formatPrice(cartTotal)}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.location.href = '/dashboard/checkout'}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/dashboard/products/buyer" 
            className={`p-6 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-blue-800 border-blue-700 hover:bg-blue-700 text-white' 
                : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800'
            }`}
          >
            <ShoppingCartIcon className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Continue Shopping</h3>
            <p className="text-sm opacity-90">Browse our latest products</p>
          </Link>

          <Link 
            to="/dashboard/orders" 
            className={`p-6 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-green-800 border-green-700 hover:bg-green-700 text-white' 
                : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800'
            }`}
          >
            <ClockIcon className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Order History</h3>
            <p className="text-sm opacity-90">View your past purchases</p>
          </Link>

          <Link 
            to="/dashboard/profile" 
            className={`p-6 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-purple-800 border-purple-700 hover:bg-purple-700 text-white' 
                : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800'
            }`}
          >
            <svg className="h-8 w-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
            <p className="text-sm opacity-90">Manage your profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;