import { useTheme } from '../../context/ThemeContext.jsx';

const PendingOrders = ({ stats }) => {
  const { theme } = useTheme();
  const pendingOrders = stats?.recentOrders?.filter(order => order.status === 'pending') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Pending Orders
      </h1>

      {pendingOrders.length === 0 ? (
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          No pending orders at the moment.
        </p>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(order => (
            <div
              key={order._id}
              className={`p-4 rounded-lg shadow transition-all ${
                theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold">Order #{order._id.slice(-6)}</p>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    theme === 'dark' ? 'bg-yellow-700 text-white' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  Pending
                </span>
              </div>
              <p className="text-sm">
                {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items • ₹
                {order.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingOrders;
