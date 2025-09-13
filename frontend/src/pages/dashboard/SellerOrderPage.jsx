import { useEffect, useState } from 'react';
import orderApi from '../../api/order.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const SellerOrdersPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await orderApi.getSellerOrders();
      if (res.success) {
        setOrders(res.data || []);
      } else {
        setError(res.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Fetch Seller Orders Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return theme === 'dark'
      ? 'bg-gray-700 text-gray-100'
      : 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'delivered':
        return theme === 'dark'
          ? 'bg-green-900 text-green-100'
          : 'bg-green-100 text-green-800';
      case 'shipped':
        return theme === 'dark'
          ? 'bg-blue-900 text-blue-100'
          : 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return theme === 'dark'
          ? 'bg-red-900 text-red-100'
          : 'bg-red-100 text-red-800';
      case 'pending':
        return theme === 'dark'
          ? 'bg-amber-900 text-amber-100'
          : 'bg-amber-100 text-amber-800';
      case 'processing':
        return theme === 'dark'
          ? 'bg-purple-900 text-purple-100'
          : 'bg-purple-100 text-purple-800';
      case 'paid':
        return theme === 'dark'
          ? 'bg-green-900 text-green-100'
          : 'bg-green-100 text-green-800';
      default:
        return theme === 'dark'
          ? 'bg-gray-700 text-gray-100'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatOrderId = (order) => {
    const orderId = order.orderId || order._id || order.id;
    if (!orderId) return 'N/A';
    if (orderId.startsWith('ORDER_')) {
      return orderId.replace('ORDER_', '').slice(0, 8).toUpperCase();
    }
    return orderId.slice(-8).toUpperCase();
  };

  const formatPrice = (amount) => {
    return `₹${(amount || 0).toFixed(2)}`;
  };

  const getSellerItems = (order) => {
    return order.items?.filter(item => {
      const itemSellerId = item.sellerId || (item.product && item.product.sellerId);
      return itemSellerId === user._id || itemSellerId === user.id;
    }) || [];
  };

  const calculateSellerTotal = (order) => {
    const sellerItems = getSellerItems(order);
    return sellerItems.reduce((total, item) => total + (item.itemTotal || item.price * item.quantity || 0), 0);
  };

  const getCustomerInfo = (order) => {
    if (order.userId && typeof order.userId === 'object') {
      return {
        name: order.userId.username || order.userId.name,
        email: order.userId.email
      };
    }
    if (order.shippingAddress) {
      return {
        name: order.shippingAddress.name,
        email: order.shippingAddress.email
      };
    }
    return { name: 'Not provided', email: 'Not provided' };
  };

  useEffect(() => {
    if (user) fetchSellerOrders();
  }, [user]);

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <h3 className="text-lg font-medium mb-2">Error Loading Orders</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchSellerOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className={`text-center py-12 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
        <p>You haven't received any orders yet.</p>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Seller Orders</h1>
        <p className="mt-2">Manage your incoming orders and track sales</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const sellerItems = getSellerItems(order);
          const sellerTotal = calculateSellerTotal(order);
          const customerInfo = getCustomerInfo(order);
          if (sellerItems.length === 0) return null;

          return (
            <div
              key={order._id}
              className={`rounded-lg shadow-md border overflow-hidden transition-all duration-200 hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Order Header */}
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        Order #{formatOrderId(order)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm">
                      Ordered by: <span className="font-medium">{customerInfo.name || 'Unknown Customer'}</span>
                    </p>
                    <p className="text-sm">
                      Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date'} at{' '}
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Unknown time'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatPrice(sellerTotal)}
                      </p>
                      <p className="text-sm">{sellerItems.length} item(s) for you</p>
                    </div>

                    <button
                      onClick={() => toggleOrderDetails(order._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === order._id && (
                <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 space-y-6`}>
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Customer Information</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {customerInfo.name}</p>
                        <p><span className="font-medium">Email:</span> {customerInfo.email}</p>
                        <p><span className="font-medium">Phone:</span> {order.shippingAddress?.phoneNumber || 'Not provided'}</p>
                      </div>
                    </div>

                    {order.shippingAddress && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Shipping Address</h4>
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.street}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-semibold mb-4">Your Items in this Order</h4>
                    <div className="space-y-3">
                      {sellerItems.map((item, index) => {
                        const product = item.productId || item.product || {};
                        const productName = item.name || product?.name || 'Unknown Product';
                        const quantity = item.quantity || 1;
                        const price = item.price || 0;
                        const itemTotal = item.itemTotal || price * quantity;

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-4 p-4 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <img
                              src={product?.images?.[0] || item.images?.[0] || '/placeholder-product.jpg'}
                              alt={productName}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                            />
                            <div className="flex-1">
                              <h5 className="font-medium">{productName}</h5>
                              <p className="text-sm">
                                Quantity: {quantity} × {formatPrice(price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(itemTotal)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className={`pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h4 className="font-semibold mb-2">Payment Information</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      <p><span className="font-medium">Method:</span> {order.paymentMethod || 'Not specified'}</p>
                      <p><span className="font-medium">Total Amount:</span> {formatPrice(order.amount || order.totalAmount || sellerTotal)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerOrdersPage;
