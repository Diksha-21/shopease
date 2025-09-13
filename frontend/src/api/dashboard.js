import { apiRequest } from './api.js';

const ok = (data) => ({ success: true, data });
const fail = (message, data = {}) => ({ success: false, message, data });

export const getBuyerDashboard = async () => {
  try {
    const res = await apiRequest.get('/dashboard/buyer');

    // Normalize response format
    const recentOrders = res?.data?.recentOrders ?? res?.recentOrders ?? [];
    const cartSummary = res?.data?.cartSummary ?? res?.cartSummary ?? [];

    return ok({ recentOrders, cartSummary });
  } catch (err) {
    console.error('Error fetching buyer dashboard:', err);
    return fail(err?.message || 'Failed to load buyer dashboard', { 
      recentOrders: [], 
      cartSummary: [] 
    });
  }
};

export const getSellerDashboard = async (page = 1, limit = 10) => {
  try {
    const res = await apiRequest.get(`/dashboard/seller?page=${page}&limit=${limit}`);

    // Handle both response formats
    if (res?.success && res?.data) {
      return ok({
        ...res.data,
        orderCount: res.orderCount ?? res.data.orderCount ?? 0,
        lowStockProducts: res.lowStockProducts ?? res.data.lowStockProducts ?? [],
        pendingCodItems: res.data.pendingCodItems ?? 0,
      });
    }

    return ok({
      products: res?.products ?? [],
      recentOrders: res?.recentOrders ?? [],
      totalSales: res?.totalSales ?? 0,
      pagination: res?.pagination ?? {},
      orderCount: res?.orderCount ?? 0,
      lowStockProducts: res?.lowStockProducts ?? [],
      pendingCodItems: res.data.pendingCodItems ?? 0,
    });
  } catch (err) {
    console.error('Error fetching seller dashboard:', err);
    return fail(err?.message || 'Failed to load seller dashboard', {
      products: [], 
      recentOrders: [], 
      totalSales: 0, 
      pagination: {}, 
      orderCount: 0, 
      lowStockProducts: []
    });
  }
};

export const getDashboard = async (activeRole, page = 1, limit = 10) => {
  try {
    const role = (activeRole || 'buyer').toLowerCase();
    if (role === 'seller') return await getSellerDashboard(page, limit);
    return await getBuyerDashboard();
  } catch (err) {
    console.error('Error in getDashboard:', err);
    return fail(err.message || 'Failed to load dashboard');
  }
};

export default { getBuyerDashboard, getSellerDashboard, getDashboard };