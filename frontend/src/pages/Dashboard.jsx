import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import dashboardApi from '../api/dashboard.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import SellerDashboard from './dashboard/SellerDashboard.jsx';
import BuyerDashboard from './dashboard/BuyerDashboard.jsx';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { cart, setCart } = useCart();

  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    lowStockProducts: [],
    recentOrders: [],
    cartSummary: [],
    products: [],
    pagination: {}
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Determine role from AuthContext first
        let role = user?.role || user?.activeRole || 'buyer';

        const response = await dashboardApi.getDashboard(role);

        console.log('Dashboard API response:', response);

        if (!response.success) {
          throw new Error(response.message || 'Failed to load dashboard data');
        }

        const dashboardData = response.data || response;

        // If API returns a role, sync with AuthContext
        if (dashboardData.role && (!user?.role || user.role !== dashboardData.role)) {
          setUser((prev) => ({
            ...prev,
            role: dashboardData.role,
            activeRole: dashboardData.role
          }));
          role = dashboardData.role;
        }

        // Limit recent orders and cart items to 3 for consistent height
        const limitedRecentOrders = dashboardData.recentOrders 
          ? dashboardData.recentOrders.slice(0, 3) 
          : [];
          
        const limitedCartSummary = dashboardData.cartSummary 
          ? dashboardData.cartSummary.slice(0, 3) 
          : [];

        if (role === 'seller') {
          setStats({
            totalSales: dashboardData.totalSales || 0,
            orderCount: dashboardData.orderCount || 0,
            lowStockProducts: dashboardData.lowStockProducts || [],
            recentOrders: limitedRecentOrders,
            products: dashboardData.products || [],
            pagination: dashboardData.pagination || {},
            cartSummary: []
          });
        } else {
          setStats({
            totalSales: 0,
            orderCount: 0,
            lowStockProducts: [],
            recentOrders: limitedRecentOrders,
            cartSummary: limitedCartSummary,
            products: [],
            pagination: {}
          });
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard data');

        if (err.message.includes('Authentication failed')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, navigate, setUser]);

  if (!user) {
    return <BuyerDashboard stats={{ recentOrders: [], cartSummary: [] }} theme={theme} cart={[]} setCart={()=>{}} loading={false} user={{ username: 'Guest' }} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`max-w-md p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex flex-col items-center text-center">
            <svg className="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
              Dashboard Error
            </h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {error}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => window.location.reload()}
                className={`px-4 py-2 rounded-md ${
                  theme === 'dark'
                    ? 'bg-blue-700 hover:bg-blue-600 text-white'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                }`}
              >
                Try Again
              </button>
              <Link
                to="/"
                className={`px-4 py-2 rounded-md ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {user.activeRole === 'seller' ? (
          <SellerDashboard 
            stats={stats} 
            theme={theme} 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            user={user} 
          />
        ) : (
          <BuyerDashboard 
            stats={stats} 
            theme={theme} 
            cart={cart} 
            setCart={setCart} 
            loading={loading} 
            user={user} 
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;