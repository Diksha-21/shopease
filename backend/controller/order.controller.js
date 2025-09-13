import mongoose from "mongoose";
import Order from "../model/order.model.js";
import Product from "../model/product.model.js";
import Payment from "../model/payment.model.js";
import { mapImageUrls } from "./product.controller.js";


async function validateAndBuildOrderItems(sourceItems) {
  if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
    throw new Error("No items to order");
  }

  const orderItems = [];
  let recomputedTotal = 0;

  for (const it of sourceItems) {
    const productId = it.productId || it._id;
    const quantity = Number(it.quantity ?? 1);
    if (!productId || quantity <= 0) {
      throw new Error("Invalid product or quantity");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found`);
    }
    if (product.quantity < quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const price = Number(product.price || 0);
    const line = price * quantity;
    recomputedTotal += line;

    orderItems.push({
      productId: product._id,
      name: product.name,
      sellerId: product.seller,
      quantity,
      price,
      itemTotal: line
    });
  }

  return { orderItems, recomputedTotal };
}


const normalizeOrder = (order, req) => ({
  _id: order._id,
  orderId: order.orderId,
  status: order.status,
  amount: order.amount,
  totalAmount: order.totalAmount,
  createdAt: order.createdAt,
  shippingAddress: order.shippingAddress,
  paymentMethod: order.paymentMethod,
  upiId: order.upiId,
  bankCode: order.bankCode,
  items: order.items.map(item => {
    const product = item.productId || {};
    return {
      _id: item._id,
      name: product.name || item.name,
      price: product.price || item.price,
      quantity: item.quantity,
      images: mapImageUrls(product.images || item.images, req),
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        sellerId: product.sellerId || item.sellerId,
        images: mapImageUrls(product.images, req),
      }
    };
  })
});

export const ensureOrderFromPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  const existing = await Order.findOne({ paymentId: payment._id });
  if (existing) return existing;

  const okStatuses = new Set(["success", "paid", "captured"]);
  if (!okStatuses.has(String(payment.status || "").toLowerCase())) {
    throw new Error("Payment is not in a verified/paid state");
  }

  const items = Array.isArray(payment.items) ? payment.items : [];
  if (items.length === 0) {
    throw new Error("Payment has no items snapshot to build order");
  }

  const { orderItems, recomputedTotal } = await validateAndBuildOrderItems(items);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    for (const it of orderItems) {
      const upd = await Product.findByIdAndUpdate(
        it.productId,
        { $inc: { quantity: -it.quantity } },
        { session, new: false }
      );
      if (!upd) {
        throw new Error("Failed to update product stock");
      }
    }

    const orderDocs = await Order.create(
      [
        {
          userId: payment.userId,
          orderId: payment.orderId || `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          razorpayOrderId: payment.razorpayOrderId || null,
          paymentId: payment._id,
          paymentMethod: payment.paymentMethod,
          upiId: payment.upiId || null,
          bankCode: payment.bankCode || null,
          items: orderItems,
          amount: recomputedTotal,
          shippingAddress: payment.shippingAddress || null,
          status: "paid",
          timeline: [
            { status: "paid", note: "Created after payment verification", at: new Date() }
          ]
        }
      ],
      { session }
    );
    const order = orderDocs;

    await Payment.findByIdAndUpdate(payment._id, { orderRef: order._id }, { session });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const placeOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      orderId,
      razorpayOrderId,
      upiId,
      bankCode
    } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.country ||
      !shippingAddress.postalCode
    ) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items to order" });
    }

    const { orderItems, recomputedTotal } = await validateAndBuildOrderItems(items);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      for (const it of orderItems) {
        const upd = await Product.findByIdAndUpdate(
          it.productId,
          { $inc: { quantity: -it.quantity } },
          { session, new: false }
        );
        if (!upd) {
          throw new Error("Failed to update product stock");
        }
      }

      const orderDocs = await Order.create(
        [
          {
            userId: req.user._id || req.user.id,
            orderId: orderId || `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            razorpayOrderId: razorpayOrderId || null,
            items: orderItems,
            amount: recomputedTotal,
            shippingAddress,
            paymentMethod: paymentMethod || "Cash",
            upiId: upiId || null,
            bankCode: bankCode || null,
            status: (paymentMethod || "Cash") === "Cash" ? "pending" : "paid",
            timeline: [
              {
                status: (paymentMethod || "Cash") === "Cash" ? "pending" : "paid",
                note: (paymentMethod || "Cash") === "Cash" ? "COD order created" : "Prepaid order created",
                at: new Date()
              }
            ]
          }
        ],
        { session }
      );
      const order = orderDocs;

      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { orderId: order._id, order }
      });
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Order placement error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id || req.user.id })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    const normalized = orders.map(order => normalizeOrder(order, req));
    return res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id || req.user.id
    }).populate("items.productId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const normalized = normalizeOrder(order, req);
    return res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching order" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id || req.user.id,
      status: { $in: ["pending", "processing"] }
    });

    if (!order) {
      return res.status(400).json({ success: false, message: "Order cannot be canceled" });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      for (const item of order.items) {
        const upd = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: item.quantity } },
          { session, new: false }
        );
        if (!upd) {
          throw new Error("Failed to restore product stock");
        }
      }

      order.status = "cancelled";
      order.timeline.push({ status: "cancelled", note: "Cancelled by user", at: new Date() });
      await order.save({ session });

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }

    return res.status(200).json({ success: true, message: "Order canceled" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error canceling order" });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id || req.user.id;

    const orders = await Order.find({ "items.sellerId": sellerId })
      .populate("userId", "username email")
      .populate("items.productId")
      .sort({ createdAt: -1 });

    const totalSales = orders.reduce((acc, order) => {
      if (order.status === "paid" || order.status === "completed") {
        const sellerItemsTotal = order.items
          .filter(item => String(item.sellerId) === String(sellerId))
          .reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        return acc + sellerItemsTotal;
      }
      return acc;
    }, 0);

    const totalOrders = orders.length;

    const completedOrders = orders.filter(o => o.status === "completed").length;

    const normalized = orders.map(order => normalizeOrder(order, req));

    return res.status(200).json({
      success: true,
      data: normalized,
      totalSales,
      totalOrders,
      completedOrders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching seller orders" });
  }
};

