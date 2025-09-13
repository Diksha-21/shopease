import { apiRequest } from './api.js';


/* Get public products */
const getPublicProducts = async () => {
  try {
    const res = await apiRequest.get(`/products/public`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error("Failed to fetch public products:", err);
    return { success: false, message: err.message || 'Failed to fetch public products' };
  }
};

/* Search products */
const searchProducts = async (params = {}, page = 1, limit = 12) => {
  try {
    const { query, minPrice, maxPrice, category, sort } = params;
    const res = await apiRequest.post(`/products/search`, {
      query, 
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      category, 
      sort, 
      page: Number(page), 
      limit: Number(limit)
    }); 
    return { success: true, data: res.data, pagination: res.pagination };
  } catch (err) {
    console.error("Product search failed:", err);
    return { success: false, message: err.message || 'Failed to search products' };
  }
};

/* Get Buyer products */
const getBuyerProducts = async (filters = {}, page = 1, limit = 12) => {
  try {
    const queryParams = new URLSearchParams({
      ...filters,
      page,
      limit
    }).toString();
    const res = await apiRequest.get(`/products/buyer?${queryParams}`);
    return { success: true, data: res.data, pagination: res.pagination };
  } catch (err) {
    console.error("Failed to fetch buyer products:", err);
    return { success: false, message: err.message };
  }
};

/* Get Seller Products */
const getSellerProducts = async () => {
  try {
    const res = await apiRequest.get(`/products/seller`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error('Failed to fetch seller products:', err);
    return { success: false, message: err.message || 'Failed to fetch your products' };
  }
};

/* Create products */
const createProduct = async (productData, images = []) => {
  try {
    const formData = new FormData();
    for (const key in productData) {
      const value = productData[key];
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    }
    images.forEach((file) => {
      formData.append("images", file);
    });
    
    const res = await apiRequest.post('/products/create', formData); 
    return { success: true, message: res.message };
  } catch (err) {
    console.error("Product creation error:", err);
    return {
      success: false,
      message: err.message || 'Failed to create product'
    };
  }
};

/* Update products */
const updateProduct = async (productId, productData, newImages = [], imageUpdateMode = 'append', imagesToRemove = []) => {
  try {
    const formData = new FormData();
    for (const key in productData) {
      const value = productData[key];
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    }
    
    formData.append('imageUpdateMode', imageUpdateMode);
    if (imagesToRemove.length > 0) {
      formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
    }
    
    newImages.forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });
    
    const res = await apiRequest.put(`/products/seller/${productId}`, formData); // ✅ Direct FormData
    return res;
  } catch (err) {
    console.error("Product update error:", err);
    return { success: false, message: err.message || 'Failed to update product' };
  }
};

/* Delete products */
const deleteProduct = async (productId) => {
  try {
    const res = await apiRequest.delete(`/products/seller/${productId}`);
    return { success: true, message: res.message };
  } catch (err) {
    console.error("Product deletion error:", err);
    return { success: false, message: err.message || 'Failed to delete product' };
  }
};

const productApi = {
  getBuyerProducts, getPublicProducts, searchProducts, getSellerProducts, 
  createProduct, deleteProduct, updateProduct
};

export default productApi;
