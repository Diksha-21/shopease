import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext.jsx';
import { RoleSwitch } from './RoleSwitch';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-100 dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h2>
              <RoleSwitch />
            </div>
            
            <nav className="space-y-2">
              <Link
                to="/dashboard"
                className={`block px-4 py-2 rounded-md ${
                  isActive('/dashboard') 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Overview
              </Link>
              
              {(user?.role || user?.activeRole) === 'seller' && (
                <>
                  <Link
                    to="/dashboard/products"
                    className={`block px-4 py-2 rounded-md ${
                      isActive('/dashboard/products') 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    My Products
                  </Link>
                  <Link
                    to="/dashboard/products/create"
                    className={`block px-4 py-2 rounded-md ${
                      isActive('/dashboard/products/create') 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Add New Product
                  </Link>
                </>
              )}
              
              <Link
                to="/dashboard/orders"
                className={`block px-4 py-2 rounded-md ${
                  isActive('/dashboard/orders') 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {user?.role === 'seller' ? 'Sales' : 'My Orders'}
              </Link>
              
              <Link
                to="/dashboard/profile"
                className={`block px-4 py-2 rounded-md ${
                  isActive('/dashboard/profile') 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Profile Settings
              </Link>
            </nav>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};