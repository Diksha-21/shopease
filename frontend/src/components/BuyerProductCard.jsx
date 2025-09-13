import { useCart } from '../context/CartContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import cartApi from '../api/cart';
import { getImageUrl } from '../api/api.js';

export const ProductCardBuyer = ({ product }) => {
  const { theme } = useTheme();
  const { refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { _id = '', name = '', price = 0, images = [], quantity = 0, seller = {} } = product || {};
  const isOutOfStock = quantity <= 0;
  const imageUrls = Array.isArray(images) && images.length > 0
    ? images.map(img => getImageUrl(img))
    : ['/placeholder-product.jpg'];

  // Extract company name from product data
  let companyName = 'Unknown Company';
  if (product?.seller?.companyName) {
    companyName = product.seller.companyName;
  } else if (product?.companyName) {
    companyName = product.companyName;
  } else if (product?.seller?.businessName) {
    companyName = product.seller.businessName;
  } else if (product?.seller?.storeName) {
    companyName = product.seller.storeName;
  } else if (product?.seller?.username) {
    companyName = product.seller.username;
  } else if (product?.seller?.name) {
    companyName = product.seller.name;
  } else if (product?.sellerId?.companyName) {
    companyName = product.sellerId.companyName;
  }

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (isOutOfStock) {
      alert('This product is out of stock');
      return;
    }
    try {
      setIsAddingToCart(true);
      const result = await cartApi.addToCart(_id, 1);
      if (result?.success) {
        alert('Product added to cart successfully!');
        refreshCart();
      } else {
        alert(result?.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Something went wrong while adding to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDirectOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }
    if (isOutOfStock) {
      alert('This product is out of stock');
      return;
    }
    try {
      setIsPlacingOrder(true);
      navigate('/dashboard/checkout', {
        state: {
          directPurchase: true,
          orderData: {
            items: [{
              productId: _id,
              quantity: 1,
              price: Number(price) || 0,
              itemTotal: (Number(price) || 0) * 1,
              name: name,
              sellerId: product?.seller?._id || product?.seller
            }],
            amount: Number(price) || 0
          },
          productData: product
        }
      });
    } catch (err) {
      console.error("Buy Now error:", err);
      alert('Failed to initiate purchase');
    } finally {
      setIsPlacingOrder(false);
    }
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
        onClick={() => navigate(`/product/${_id}`)}
      >
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
            <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
              Out of Stock
            </div>
          </div>
        )}

        {/* Image Display */}
        <img
          src={imageUrls[currentImageIndex]}
          alt={name || 'Product'}
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
        {/* Company Name */}
        <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {companyName}
        </div>

        {/* Product Name */}
        <h3 className={`font-medium text-sm mb-2 line-clamp-2 h-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {name || 'Unnamed Product'}
        </h3>

        {/* Price */}
        <div className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
          ₹{Number(price).toLocaleString() || 0}
        </div>

        {/* Stock Status */}
        <div className={`text-xs mb-3 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
          {isOutOfStock ? 'Out of stock' : `${quantity} in stock`}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
          
          <button
            onClick={handleDirectOrder}
            disabled={isPlacingOrder || isOutOfStock}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-orange-700 hover:bg-orange-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isPlacingOrder ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};