import Razorpay from "razorpay";
import Payment from "../model/payment.model.js";
import Order from "../model/order.model.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createPayment = async (req, res) => {
  try {
    const { items, shippingAddress, amount, paymentMethod, upiId, bankCode } = req.body;
    const userId = req.user._id;

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "No items in payment" });
    if (!shippingAddress) return res.status(400).json({ success: false, message: "Shipping address is required" });

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (paymentMethod === "Cash") {
      const payment = await Payment.create({
        userId,
        orderId,
        paymentMethod: "Cash",
        status: "pending",
        items,
        shippingAddress,
        amount,
      });

      const order = await Order.create({
        userId,
        orderId,
        paymentMethod: "Cash",
        status: "pending",
        items,
        shippingAddress,
        amount,
        timeline: [{ status: "pending", note: "COD order created" }],
        paymentId: payment._id,
      });

      payment.orderRef = order._id;
      await payment.save();

      return res.status(201).json({
        success: true,
        message: "Cash on Delivery order placed successfully",
        payment,
        order,
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: orderId,
    });

    const payment = await Payment.create({
      userId,
      orderId,
      paymentMethod,
      amount,
      items,
      shippingAddress,
      razorpayOrderId: razorpayOrder.id,
      upiId: paymentMethod === "UPI" ? upiId : undefined,
      bankCode: paymentMethod === "Net Banking" ? bankCode : undefined,
      status: "confirmed", 
    });

    return res.status(201).json({
      success: true,
      message: "Payment initiated",
      payment,
    });

  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Payment initiation failed" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      await Payment.findByIdAndUpdate(paymentId, { status: "failed" });
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const payment = await Payment.findByIdAndUpdate(paymentId, {
      razorpayPaymentId,
      razorpaySignature,
      status: "success",
    }, { new: true });

    const order = await Order.create({
      userId: payment.userId,
      orderId: payment.orderId,
      paymentMethod: payment.paymentMethod,
      status: "paid",
      items: payment.items,
      shippingAddress: payment.shippingAddress,
      amount: payment.amount,
      timeline: [{ status: "paid", note: "Payment successful" }],
      paymentId: payment._id,
    });

    payment.orderRef = order._id;
    await payment.save();

    return res.json({ success: true, message: "Payment verified and order created", orderId: order._id });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Payment verification failed" });
  }
};
