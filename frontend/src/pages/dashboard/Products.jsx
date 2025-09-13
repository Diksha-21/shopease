import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ProductCardSeller } from '../../components/SellerProductCard.jsx';
import { ProductCardBuyer } from '../../components/BuyerProductCard.jsx';
import productApi from '../../api/product.js';

export const Products = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const isSeller = (user?.activeRole || (user?.roles?.includes('seller') ? 'seller' : 'buyer')) === 'seller';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        let response;
        if (isSeller) {
          // Fetch only seller's products
          response = await productApi.getSellerProducts();
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch seller products');
          }

          if (!response.data || response.data.length === 0) {
            setProducts([]);
            setFilteredProducts([]);
            return;
          }
        } else {
          // Fetch all products for buyers
          response = await productApi.getBuyerProducts({}, 1, 50);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch products');
          }
        }
        console.log("Response for the products:", response);
        setProducts(response.data || []);
        setFilteredProducts(response.data || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [isSeller, user]);

  useEffect(() => {
    const results = products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.seller?.companyName && product.seller.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleDelete = (deleteId) => {
    setProducts(prev => prev.filter(p => p._id !== deleteId));
    setFilteredProducts(prev => prev.filter(p => p._id !== deleteId));
  };

  return (
    <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isSeller ? 'Your Products' : 'Available Products'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {/* Search Bar - Show for both sellers and buyers */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full md:w-64 px-4 py-2 rounded-md border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-white' 
                : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-800'
            }`}
          />
          
          {/* Add Product Button - Only show for sellers */}
          {isSeller && (
            <Link
              to="/dashboard/products/create"
              className={`px-4 py-2 rounded-md font-medium ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              + Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg ${
          theme === 'dark' ? 'bg-red-900/50 border border-red-700' : 'bg-red-100 border border-red-400'
        }`}>
          <p className="text-red-500 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          {isSeller ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You haven't added any products yet.
              </p>
              <Link
                to="/dashboard/products/create"
                className={`px-4 py-2 rounded-md font-medium ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Create Your First Product
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm ? 'No products found matching your search.' : 'No products available at the moment.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear search
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            isSeller ? (
              <ProductCardSeller 
                key={product._id} 
                product={product} 
                onDelete={() => handleDelete(product._id)}
                theme={theme}
              />
            ) : (
              <ProductCardBuyer 
                key={product._id}
                product={product}
                theme={theme}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};