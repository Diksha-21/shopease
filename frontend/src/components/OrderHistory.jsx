import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

const OrderHistory = ({ orders, loading, onCancelOrder }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    if (!status || typeof status !== 'string') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          You haven't placed any orders yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          When you place orders, they'll appear here.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order._id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
        >
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Order #{order._id?.slice(-6).toUpperCase() || 'N/A'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date'} at{' '}
                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Unknown time'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
              </p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Order Items Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {order.items?.length || 0} item(s)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/orders/${order._id}`)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details
            </button>
            
            {order.status === 'pending' && onCancelOrder && (
              <button
                onClick={() => onCancelOrder(order._id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;