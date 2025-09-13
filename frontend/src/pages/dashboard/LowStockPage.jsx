import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import { getImageUrl } from '../../api/api.js';
import productApi from '../../api/product.js';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const LowStockPage = () => {
  const { theme } = useTheme();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProductImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return '/placeholder-product.jpg';
    }
    return getImageUrl(images[0]);
  };

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getSellerProducts();
        if (response.success) {
          const lowStock = response.data.filter(product => product.quantity <= 10);
          setLowStockProducts(lowStock);
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockProducts();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard" 
            className={`p-2 rounded-lg hover:bg-gray-200 ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`}
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
              Low Stock Products
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Products with 10 or fewer items remaining
            </p>
          </div>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className={`text-center py-20 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-green-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">All Products Well Stocked!</h2>
            <p className="text-gray-500 mb-6">You don't have any products running low on inventory.</p>
            <Link 
              to="/dashboard/products/seller" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View All Products
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm font-medium text-gray-500">Total Low Stock</h3>
                <p className="text-3xl font-bold text-orange-600">{lowStockProducts.length}</p>
              </div>
              <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm font-medium text-gray-500">Critical (≤5 items)</h3>
                <p className="text-3xl font-bold text-red-600">
                  {lowStockProducts.filter(p => p.quantity <= 5).length}
                </p>
              </div>
              <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm font-medium text-gray-500">Total Value at Risk</h3>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{lowStockProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lowStockProducts.map((product) => (
                <div 
                  key={product._id} 
                  className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  {/* Product Image */}
                  <div className="w-full h-48 mb-4">
                    <img
                      src={getProductImageUrl(product.images)}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <p className="text-2xl font-bold text-green-600">₹{product.price}</p>
                    
                    {/* Stock Warning */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      product.quantity <= 5 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {product.quantity} left
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      <Link
                        to={`/dashboard/products/seller/${product._id}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm"
                      >
                        Update Stock
                      </Link>
                      <Link
                        to={`/dashboard/products/seller/${product._id}`}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          theme === 'dark' 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LowStockPage;
