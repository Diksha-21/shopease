import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: false,
      min: 0,
      default: 0
    }
  }],
  total: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

cartSchema.index({ userId: 1 });

export default mongoose.model("Cart", cartSchema);
