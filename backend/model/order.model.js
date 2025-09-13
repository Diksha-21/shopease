import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    itemTotal: { type: Number, required: true }
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    name: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    phoneNumber: String
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true, index: true }, // client-side human-readable id
    razorpayOrderId: { type: String, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", index: true },
    paymentMethod: { type: String, enum: ["UPI", "Net Banking", "Cash", "Card"], required: true },
    upiId: String,
    bankCode: String,
    items: { type: [OrderItemSchema], required: true },
    amount: { type: Number, required: true },
    shippingAddress: { type: AddressSchema },
    status: {
      type: String,
      enum: ["pending", "confirmed" ,"paid", "failed", "cancelled"],
      default: "pending",
      index: true
    },
    timeline: [
      {
        at: { type: Date, default: Date.now },
        status: String,
        note: String
      }
    ]
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;