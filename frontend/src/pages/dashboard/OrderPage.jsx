import { useEffect, useState } from 'react';
import orderApi from '../../api/order.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import { toast } from 'react-toastify';
import { createPayment } from '../../api/payment.js';

const OrdersPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [processingCashPayment, setProcessingCashPayment] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await orderApi.getOrders();
      if (res.success) {
        setOrders(res.data || []);
      } else {
        setError(res.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Fetch Orders Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setCancellingId(orderId);
      const res = await orderApi.cancelOrder(orderId);
      
      if (res.success) {
        setOrders(prev => 
          prev.map(o => 
            o._id === orderId ? { ...o, status: 'cancelled' } : o
          )
        );
        toast.success('Order cancelled successfully');
      } else {
        setError(res.message);
        toast.error('Failed to cancel order');
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
      toast.error('Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCashPayment = async (order) => {
    if (!window.confirm('Confirm Cash on Delivery payment?')) return;
    
    try {
      setProcessingCashPayment(order._id);
      
      // Create a cash payment record
      const paymentRes = await createPayment({
        orderId: order._id,
        amount: order.amount || order.totalAmount,
        paymentMethod: 'cash',
        items: order.items
      });
      
      if (paymentRes.success) {
        // Update order status to indicate cash payment is pending confirmation
        const updateRes = await orderApi.updateOrderStatus(order._id, 'pending_cod');
        
        if (updateRes.success) {
          setOrders(prev => 
            prev.map(o => 
              o._id === order._id ? { ...o, status: 'pending_cod' } : o
            )
          );
          toast.success('Cash payment confirmed. Your order will be processed upon delivery.');
        } else {
          toast.error('Order status update failed');
        }
      } else {
        toast.error(paymentRes.message || 'Failed to process cash payment');
      }
    } catch (err) {
      console.error('Cash payment error:', err);
      toast.error('Failed to process cash payment');
    } finally {
      setProcessingCashPayment(null);
    }
  };

  const handlePayForOrder = (order) => {
    // For cash payments, use the new handler
    if (order.paymentMethod === 'cash' || order.paymentMethod === 'cod') {
      handleCashPayment(order);
      return;
    }
    
    // For online payments, use the existing flow
    navigate('/payment', {
      state: {
        orderData: {
          orderId: order._id,
          totalAmount: order.amount || order.totalAmount || 0,
          items: order.items
        },
        directPurchase: false,
      }
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending_cod':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatOrderId = (orderId) => {
    if (!orderId) return 'N/A';
    return orderId.startsWith('ORDER_') ? orderId : orderId.slice(-8).toUpperCase();
  };

  const formatPrice = (amount) => {
    return `₹${(amount || 0).toFixed(2)}`;
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {user.role === 'buyer' ? "You haven't placed any orders yet" : "No sales records available"}
            </p>
            <button
              onClick={() => navigate('/dashboard/products/buyer')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700`}>
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        Order #{formatOrderId(order.orderId || order._id)}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date'} at{' '}
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Unknown time'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPrice(order.amount || order.totalAmount)}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <button
                      onClick={() => toggleOrderDetails(order._id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                    </button>

                    {/* Cancel Order Button */}
                    {user.role === 'buyer' && (order.status === 'pending' || order.status === 'processing') && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          cancellingId === order._id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    {/* Pay Now Button for pending orders */}
                    {user.role === 'buyer' && order.status === 'pending' && (
                      <button
                        onClick={() => handlePayForOrder(order)}
                        disabled={processingCashPayment === order._id}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          processingCashPayment === order._id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {processingCashPayment === order._id 
                          ? 'Processing...' 
                          : (order.paymentMethod === 'cash' || order.paymentMethod === 'cod') 
                            ? 'Confirm COD' 
                            : 'Pay Now'}
                      </button>
                    )}
                  </div>

                  {/* Order Details (Expandable) */}
                  {expandedOrder === order._id && (
                    <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <h4 className="font-medium mb-4 text-lg">Order Items</h4>
                      <div className="space-y-4">
                        {order.items?.map((item, index) => {
                          const product = item.product || item;
                          const productName = product?.name || item?.name || [];
                          const quantity = item?.quantity || 1;
                          const price = item?.price || product?.price || 0;
                          const total = price * quantity;
                          return (
                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-shrink-0">
                                <img
                                  src={item?.images[0] || '/placeholder-product.jpg'}
                                  alt={productName}
                                  className="w-16 h-16 object-cover rounded-md"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1">
                                <p className="font-medium">{productName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Quantity: {quantity} × {formatPrice(price)}
                                </p>
                                {item.product?.sellerId?.companyName && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Seller: {item.product.sellerId.companyName}
                                  </p>
                                )}
                              </div>
                              
                              {/* Item Total */}
                              <div className="text-right">
                                <p className="font-semibold text-lg">
                                  {formatPrice(total)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <h5 className="font-medium mb-2">Shipping Address</h5>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>{order.shippingAddress.name}</p>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.phoneNumber && (
                              <p>Phone: {order.shippingAddress.phoneNumber}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Method */}
                      {order.paymentMethod && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <h5 className="font-medium mb-2">Payment Method</h5>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p className="capitalize">{order.paymentMethod}</p>
                            {order.upiId && <p>UPI ID: {order.upiId}</p>}
                            {order.bankCode && <p>Bank: {order.bankCode}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;