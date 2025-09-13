import { useAuth } from '../context/AuthContext.jsx';
import { ProductCardBuyer } from '../components/BuyerProductCard.jsx';
import productApi from '../api/product';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export const Home = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getPublicProducts();
        
        // Debug: Log the full API response
        console.log('API Response:', response);
        
        // Handle different response structures
        const productsData = response.data || response.products || [];
        
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else {
          setError('Invalid products data format');
          setProducts([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Welcome to ShopEase
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {user ? `Hello, ${user.username}!` : 'Please login or register to start shopping'}
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
              theme === 'dark' ? 'border-blue-400' : 'border-blue-500'
            }`}></div>
          </div>
        ) : error ? (
          <div className={`text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            No products available
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCardBuyer key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};