import Order from '../model/order.model.js';
import Product from '../model/product.model.js';
import Cart from '../model/cart.model.js';
import { getUserData } from '../auth/token.js';
import { mapImageUrls } from './product.controller.js';

export const getBuyerDashboard = async (req, res) => {
  try {
    if (!req.user.roles || !req.user.roles.includes('buyer')) {
      req.user.roles = [...(req.user.roles || []), 'buyer'];
      req.user.activeRole = 'buyer';
      await req.user.save();
    }

    const [orders, cart] = await Promise.all([
      Order.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('items.productId', 'name price'),
      // ✅ FIXED: Use correct field names
      Cart.findOne({ userId: req.user.id })  // 'user' not 'userId'
        .populate('items.product', 'name price')  // 'items.product' not 'products.productId'
    ]);

    const transformedOrders = orders.map(order => ({
      _id: order._id,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      items: order.items.map(item => ({
        productId: item.productId?._id,
        name: item.productId?.name || 'Unknown',
        quantity: item.quantity,
        price: item.productId?.price || 0
      }))
    }));

    // ✅ FIXED: Use correct cart structure
    const transformedCart = cart && cart.items
      ? cart.items.map(item => ({
          productId: item.product?._id,
          name: item.product?.name || 'Unknown',
          quantity: item.quantity,
          price: item.product?.price || 0
        }))
      : [];

    return res.status(200).json({
      success: true,
      recentOrders: transformedOrders,
      cartSummary: transformedCart,
      role: req.user.activeRole,
      user: { ...getUserData(req.user), role: req.user.activeRole }
    });
  } catch (err) {
    console.error('Buyer Dashboard error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching buyer dashboard',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const normalizeOrder = (order, req) => ({
  _id: order._id,
  status: order.status,
  totalAmount: order.items.reduce((sum, i) => sum + (i.itemTotal || 0), 0),
  createdAt: order.createdAt,
  items: order.items.map(item => ({
    _id: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    // ✅ Fix: use productId.images instead of order.images
    images: mapImageUrls(item.productId?.images || [], req),
    product: {
      _id: item.productId?._id,
      name: item.productId?.name,
      price: item.productId?.price,
      sellerId: item.sellerId,
      // ✅ Fix: normalize product images correctly
      images: mapImageUrls(item.productId?.images || [], req),
    },
  })),
});

export const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const products = await Product.find({ seller: sellerId });

    const pendingCODorders = await Order.find({
      "items.sellerId": sellerId,
      paymentMethod: 'Cash',
      status: "pending"  
    });

    const pendingCodItems = pendingCODorders.reduce((total, order) => {
      const sellerItems = order.items.filter(
        item => String(item.sellerId) === String(sellerId)
      );
      const orderQuantity = sellerItems.reduce(
        (sum, item) => sum + (item.quantity || 0), 
        0
      );
      return total + orderQuantity;
    }, 0);

    const confirmCODorders = await Order.find({
      "items.sellerId": sellerId,
      paymentMethod: 'Cash',
      status: {$in: ["pending", "confirmed"]}
    });

    const normalizedProducts = products.map(p => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      images: mapImageUrls(p.images || [], req),
    }));

    const lowStockProducts = normalizedProducts.filter(p => p.quantity <= 5);

    const totalProductsQuantity = normalizedProducts.reduce(
      (acc, p) => acc + (p.quantity || 0),
      0
    );

    const orders = await Order.find({ "items.sellerId": sellerId }).populate("items.productId").sort({ createdAt: -1 });

    const totalSales = orders.reduce((acc, order) => {
      const relevantItems = order.items.filter(
        i => String(i.sellerId) === String(sellerId)
      );
      if (order.status === "paid" || order.status === "confirmed") {
        const sum = relevantItems.reduce((s, i) => s + (i.itemTotal || 0), 0);
        return acc + sum;
      }
      return acc;
    }, 0);

    const orderCount = orders.length;
    const completedOrders = orders.filter(o => o.status === "completed").length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;

    const normalizedOrders = orders.map(order => normalizeOrder(order, req));
    const monthlyStats = {
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear()
    };

    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === new Date().getMonth() && 
             orderDate.getFullYear() === new Date().getFullYear();
    });

    const monthlyRevenue = currentMonthOrders.reduce((acc, order) => {
      const relevantItems = order.items.filter(
        i => String(i.sellerId) === String(sellerId)
      );
      if (order.status === "paid" || order.status === "confirmed") {
        const sum = relevantItems.reduce((s, i) => s + (i.itemTotal || 0), 0);
        return acc + sum;
      }
      return acc;
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        products: normalizedProducts,
        lowStockProducts,
        totalProductsQuantity,

        recentOrders: normalizedOrders.slice(0, 5),
        orderCount,
        completedOrders,
        pendingOrders,
        
        confirmedCodOrders: confirmCODorders,
        pendingCodItems, 

        totalSales,
        monthlyRevenue,
        
        lastUpdated: new Date().toISOString(),
        sellerId,
        
        averageOrderValue: orderCount > 0 ? (totalSales / orderCount) : 0,
        conversionRate: orderCount > 0 ? ((completedOrders / orderCount) * 100).toFixed(2) : 0
      },
    });

  } catch (err) {
    console.error("Seller dashboard error:", err);
    
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching dashboard data",
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack
      } : undefined
    });
  }
};
