import Cart from "../model/cart.model.js";
import Product from "../model/product.model.js";

export const buildOrderItems = async (req, res) => {
  try {
    const { directPurchase, items } = req.body;
    const userId = req.user._id;
    let total = 0;
    let orderItems = [];

    if (directPurchase && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const product = await Product.findById(it.productId);
        if (!product) throw new Error("Product not found");
        if (product.quantity < it.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        total += product.price * it.quantity;
        orderItems.push({
          productId: product._id,
          name: product.name,
          sellerId: product.seller,
          quantity: it.quantity,
          price: product.price,
          itemTotal: product.price * it.quantity,
        });
      }
    } else {
      const cart = await Cart.findOne({ userId }).populate(
        "items.product",
        "name price quantity seller"
      );
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      for (const c of cart.items) {
        if (!c.product) continue;
        if (c.product.quantity < c.quantity) {
          throw new Error(`Insufficient stock for ${c.product.name}`);
        }
        total += c.product.price * c.quantity;
        orderItems.push({
          productId: c.product._id,
          name: c.product.name,
          sellerId: c.product.seller,
          quantity: c.quantity,
          price: c.product.price,
          itemTotal: c.product.price * c.quantity,
        });
      }
    }
    console.log("Checkout res:", {orderItems, total});

    return res.json({ success: true, orderItems, total });
  } catch (error) {
    console.error("Checkout Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
