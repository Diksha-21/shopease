import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUploadPreview } from '../../components/ImageUploadPreview.jsx';
import productApi from '../../api/product.js';
import { useTheme } from '../../context/ThemeContext.jsx';

export const CreateProduct = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    sizes: '',
    colors: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); 

  const validateForm = () => {
    if (!product.name || !product.price || !product.quantity || !product.category) {
      setError('Name, price, quantity and category are required');
      return false;
    }
    if (isNaN(product.price) || parseFloat(product.price) <= 0) {
      setError('Price must be a positive number');
      return false;
    }
    if (isNaN(product.quantity) || parseInt(product.quantity) <= 0) {
      setError('Quantity must be a positive integer');
      return false;
    }
    if (product.images.length === 0) {
      setError('At least one product image is required');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleImagesChange = (files) => {
    setProduct(prev => ({ ...prev, images: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const productData = {
        ...product,
        sizes: product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(s => s) : [],
        colors: product.colors ? product.colors.split(',').map(c => c.trim()).filter(c => c) : []
      };

      const res = await productApi.createProduct(productData, product.images);

      if (!res.success) {
        throw new Error(res.message);
      }
      
      navigate('/dashboard/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Theme classes
  const containerClasses = `max-w-5xl mx-auto p-6 rounded-2xl shadow-xl ${
    theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
  }`;

  const inputClasses = `w-full px-4 py-3 rounded-xl border-2 ${
    theme === 'dark' 
      ? 'bg-gray-700 border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
      : 'bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  } transition-all duration-200`;

  const labelClasses = `block mb-2 text-sm font-semibold ${
    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  }`;

  const buttonClasses = `px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
    theme === 'dark' 
      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
  }`;

  const cancelButtonClasses = `px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
    theme === 'dark' 
      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
  }`;

  const tabButtonClasses = (isActive) => 
    `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive 
        ? theme === 'dark' 
          ? 'bg-blue-600 text-white' 
          : 'bg-blue-100 text-blue-700'
        : theme === 'dark' 
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Product</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Add a new product to your store</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/products')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Products
        </button>
      </div>
      
      <div className={containerClasses}>
        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            theme === 'dark' ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            className={tabButtonClasses(activeTab === 'basic')}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={tabButtonClasses(activeTab === 'details')}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={tabButtonClasses(activeTab === 'images')}
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className={labelClasses}>
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                {/* Price */}
                <div>
                  <label className={labelClasses}>
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-3.5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>₹</span>
                    <input
                      type="number"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                      className={`${inputClasses} pl-10`}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                {/* Quantity */}
                <div>
                  <label className={labelClasses}>
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={product.quantity}
                    onChange={handleChange}
                    className={inputClasses}
                    min="1"
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className={labelClasses}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="home">Home & Garden</option>
                    <option value="books">Books</option>
                    <option value="sports">Sports</option>
                    <option value="beauty">Beauty</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className={labelClasses}>Description</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  className={`${inputClasses} min-h-[120px]`}
                  placeholder="Enter detailed product description..."
                />
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sizes */}
              <div>
                <label className={labelClasses}>Sizes (comma separated)</label>
                <input
                  type="text"
                  name="sizes"
                  value={product.sizes}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="S, M, L, XL"
                />
                <p className={`mt-2 text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Separate sizes with commas</p>
              </div>
              
              {/* Colors */}
              <div>
                <label className={labelClasses}>Colors (comma separated)</label>
                <input
                  type="text"
                  name="colors"
                  value={product.colors}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Red, Blue, Green"
                />
                <p className={`mt-2 text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Separate colors with commas</p>
              </div>
              
              {/* Additional details can be added here */}
              <div className="md:col-span-2">
                <div className={`p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
                }`}>
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Additional Information
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add more details like weight, dimensions, or materials to help customers make informed decisions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className={labelClasses}>
                  Product Images <span className="text-red-500">*</span>
                </label>
                <div className={`p-6 rounded-xl border-dashed border-2 ${
                  theme === 'dark' ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
                }`}>
                  <ImageUploadPreview 
                    files={product.images}
                    onFilesChange={handleImagesChange} 
                    maxFiles={5}
                    theme={theme}
                  />
                </div>
                <p className={`mt-2 text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Upload high-quality product images (max 5). First image will be used as featured image.</p>
              </div>
              
              {/* Preview of selected images */}
              {product.images.length > 0 && (
                <div>
                  <label className={labelClasses}>Image Preview</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {product.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                          alt={`Preview ${index + 1}`} 
                          className="h-40 w-full object-cover rounded-xl border"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-xl">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'basic' ? 'images' : activeTab === 'details' ? 'basic' : 'details')}
                className="px-4 py-2.5 rounded-lg font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {activeTab === 'basic' ? 'Skip to Images' : activeTab === 'details' ? 'Back to Basic Info' : 'Back to Details'}
              </button>
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/products')}
                className={cancelButtonClasses}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${buttonClasses} flex items-center justify-center gap-2 min-w-[140px] ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};