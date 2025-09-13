import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    itemTotal: { type: Number, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
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

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    
    paymentMethod: { 
      type: String, 
      enum: ["Cash", "UPI", "Net Banking"], 
      required: true 
    },
    
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    
    upiId: { type: String },
    bankCode: { type: String }, 
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "failed"],
      default: "pending",
    },
    
    amount: { type: Number, required: true },
    orderRef: { type: mongoose.Schema.Types.ObjectId, ref: "Order" } // For backlink
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);