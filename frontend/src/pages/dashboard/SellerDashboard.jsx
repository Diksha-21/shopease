import { Link } from 'react-router-dom';

const SellerDashboard = ({ stats, theme, currentPage, setCurrentPage, user }) => {
  const limitedProducts = stats.products ? stats.products.slice(0, 3) : [];
  const limitedRecentOrders = stats.recentOrders ? stats.recentOrders.slice(0, 3) : [];

  const pendingCodItems = stats.pendingCodItems || 0;
  const completedOrdersCount = stats.recentOrders 
    ? stats.recentOrders.filter(order => order.status === 'completed').length 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Seller Dashboard
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome, {user?.username}!
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/dashboard/products/create"
            className={`px-4 py-2 rounded-md font-medium ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
            }`}
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: 'Total Sales',
            value: `₹${stats.totalSales?.toFixed(2) || 0}`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            bg: theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
          },
          {
            title: 'Total Orders',
            value: stats.orderCount || 0,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            bg: theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
          },
          {
            title: 'Completed Orders',
            value: completedOrdersCount,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 01118 0z" />
              </svg>
            ),
            bg: theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg shadow flex items-center ${stat.bg}`}
          >
            <div className={`p-3 rounded-full mr-4 ${
              theme === 'dark' ? 'bg-black bg-opacity-20' : 'bg-white'
            }`}>
              {stat.icon}
            </div>
            <div>
              <h3 className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {stat.title}
              </h3>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className={`p-6 rounded-lg shadow ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Your Products
              </h2>
              <Link 
                to="/dashboard/products/seller" 
                className={`text-sm ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                Manage All
              </Link>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {limitedProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {limitedProducts.map(product => (
                    <div 
                      key={product._id} 
                      className={`p-3 rounded-md flex items-center ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <img
                        src={product.images?.[0] || '/no-image.png'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded mr-3"
                        onError={(e) => {
                          e.target.src = '/no-image.png';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {product.name}
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          ₹{product.price} • {product.quantity} in stock
                        </p>
                      </div>
                      <Link
                        to={`/dashboard/products/seller/${product._id}`}
                        className={`text-sm px-3 py-1 rounded ${
                          theme === 'dark' 
                            ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <p className="mb-4">No products found</p>
                  <Link
                    to="/dashboard/products/create"
                    className={`inline-block px-4 py-2 rounded-md ${
                      theme === 'dark'
                        ? 'bg-blue-700 hover:bg-blue-600 text-white'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                    }`}
                  >
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className={`p-6 rounded-lg shadow ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Recent Orders
              </h2>
              <Link 
                to="/dashboard/orders/seller" 
                className={`text-sm ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                View All
              </Link>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {limitedRecentOrders.length > 0 ? (
                <div className="space-y-4">
                  {limitedRecentOrders.map(order => (
                    <div 
                      key={order._id} 
                      className={`border-b pb-4 ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className={`font-medium ${
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          Order #{order._id.slice(-6)}
                        </p>
                        <span className={`text-sm px-2 py-1 rounded ${
                          order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {order.items?.length || 0} items • ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            path: "/dashboard/products/seller",
            title: "Manage Products",
            description: `All products`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
            bg: theme === 'dark' ? 'bg-green-900' : 'bg-green-100',
            hoverBg: theme === 'dark' ? 'hover:bg-green-800' : 'hover:bg-green-200'
          },
          {
            path: "/dashboard/orders/seller/pending-orders",
            title: "Cash on Delivery products",
            description: `${pendingCodItems || 0} Cash on Delivery orders awaiting payment`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            bg: theme === 'dark' ? 'bg-yellow-900' : 'bg-yellow-100',
            hoverBg: theme === 'dark' ? 'hover:bg-yellow-800' : 'hover:bg-yellow-200'
          },
          {
            path: "/dashboard/products/seller/low-stock",
            title: "Low Stock Items",
            description: `${stats?.lowStockProducts?.length || 0} products need restocking`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
            bg: theme === 'dark' ? 'bg-red-900' : 'bg-red-100',
            hoverBg: theme === 'dark' ? 'hover:bg-red-800' : 'hover:bg-red-200'
          }
        ].map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className={`p-4 rounded-lg transition-colors flex items-start ${action.bg} ${action.hoverBg}`}
          >
            <div className={`p-2 rounded-full mr-4 ${
              theme === 'dark' ? 'bg-black bg-opacity-20' : 'bg-white'
            }`}>
              {action.icon}
            </div>
            <div>
              <h3 className={`font-semibold mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {action.title}
              </h3>
              <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
              {action.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  </div>
  );
};

export default SellerDashboard;