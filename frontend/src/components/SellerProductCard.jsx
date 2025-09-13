import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext.jsx';
import productApi from '../api/product.js';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../api/api.js';
import { useState } from 'react';

export const ProductCardSeller = ({ product, onDelete }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOutOfStock = product?.quantity <= 0;

  // Get all image URLs
  const imageUrls = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(img => getImageUrl(img))
    : ['/placeholder-product.jpg'];

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const response = await productApi.deleteProduct(product._id);
    if (response.success) {
      onDelete(product._id);
    } else {
      alert(response.message || 'Failed to delete product');
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/products/seller/${product._id}`);
  };

  return (
    <div className={`w-full max-w-xs mx-auto rounded-md overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Image Container */}
      <div 
        className="relative w-full h-48 overflow-hidden bg-gray-100"
        onClick={() => navigate(`/dashboard/products/seller/${product._id}`)}
      >
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium z-10">
            Out of Stock
          </div>
        )}

        {/* Image Display */}
        <img
          src={imageUrls[currentImageIndex]}
          alt={product.name || 'Product'}
          className="w-full h-full object-contain p-4"
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
          }}
        />

        {/* Image Navigation Dots */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex 
                    ? (theme === 'dark' ? 'bg-white' : 'bg-gray-800') 
                    : (theme === 'dark' ? 'bg-gray-500' : 'bg-gray-300')
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className={`font-medium text-sm mb-2 line-clamp-2 h-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {product.name || 'Unnamed Product'}
        </h3>

        {/* Price and Stock Row */}
        <div className="flex justify-between items-center mb-3">
          <div className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            ₹{Number(product.price).toLocaleString() || 0}
          </div>
          <div className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
            {isOutOfStock ? 'Out of stock' : `${product.quantity} in stock`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Edit
          </button>
          
          <button
            onClick={handleDelete}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCardSeller.propTypes = {
  product: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired
};