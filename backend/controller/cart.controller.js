import Product from "../model/product.model.js";
import Cart from "../model/cart.model.js";
import mongoose from "mongoose";
import { mapImageUrls } from './product.controller.js';

const normalizedCartResponse = async (cart, req) => {
  await cart.populate("items.product", "name price images quantity");
  
  return {
    cartId: cart._id,
    items: cart.items
      .filter((item) => item.product)
      .map((item) => ({
        _id: item._id,
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        images: mapImageUrls(item.product.images, req),
        quantity: item.quantity,
        itemTotal: item.price || (item.product.price * item.quantity),
        available: item.product.quantity,
      })),
    totalItems: cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    cartTotal: cart.total || 0,
  };
};

// ✅ Helper function to fix existing cart items without price
const fixExistingCartItems = async (cart) => {
  let hasChanges = false;
  
  // Ensure products are populated
  if (!cart.populated('items.product')) {
    await cart.populate("items.product", "price");
  }
  
  for (const item of cart.items) {
    // Fix items that don't have price or have invalid price
    if ((!item.price || isNaN(item.price)) && item.product && item.product.price) {
      item.price = item.product.price * item.quantity;
      hasChanges = true;
      console.log(`Fixed price for item: ${item.product.name} - Price: ${item.price}`);
    }
  }
  
  if (hasChanges) {
    cart.total = cart.items.reduce((total, item) => total + (item.price || 0), 0);
  }
  
  return hasChanges;
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const userId = req.user.id;
    console.log('Using userId for cart:', userId);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock available" });
    }

    let cart = await Cart.findOne({ userId: userId }).populate(
      "items.product",
      "name price images quantity"
    );

    if (!cart) {
      console.log('Creating new cart for user:', userId);
      cart = new Cart({
        userId: userId,
        items: [],
        total: 0
      });
    } else {
      await fixExistingCartItems(cart);
    }

    const existingItem = cart.items.find(
      (item) => item.product && item.product._id.toString() === productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.quantity} items available in stock`
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.price = product.price * newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price * quantity, 
      });
    }

    // ✅ Safe total calculation
    cart.total = cart.items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      return total + (isNaN(itemPrice) ? 0 : itemPrice);
    }, 0);

    await cart.save();
    const data = await normalizedCartResponse(cart, req);

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
      error: error.message
    });
  }
};

// Get cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId: userId }).populate(
      "items.product",
      "name price images quantity"
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [], totalItems: 0, cartTotal: 0 },
      });
    }

    const hasChanges = await fixExistingCartItems(cart);
    if (hasChanges) {
      await cart.save();
    }

    const data = await normalizedCartResponse(cart, req);
    console.log("Cart data:", data);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message
    });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId: userId }).populate(
      "items.product", 
      "name price images quantity"
    );
    
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    
    await fixExistingCartItems(cart);

    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => {
      const itemProductId = item.product?._id 
        ? item.product._id.toString() 
        : item.product.toString();
      
      const shouldKeep = itemProductId !== productId.toString();
      console.log(`🔍 [Backend] Comparing ${itemProductId} !== ${productId} = ${shouldKeep}`);
      return shouldKeep;
    });

    if (cart.items.length === originalLength) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found in cart' 
      });
    }

    if (cart.items.length === 0) {
      await Cart.findOneAndDelete({ userId: userId });
      return res.status(200).json({
        success: true,
        message: "Item successfully removed from the cart",
        data: { items: [], totalItems: 0, cartTotal: 0 }
      });
    }

    cart.total = cart.items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      return total + (isNaN(itemPrice) ? 0 : itemPrice);
    }, 0);

    if (isNaN(cart.total)) {
      cart.total = 0;
    }

    await cart.save();
    
    console.log("✅ [Backend] Cart saved successfully with", cart.items.length, "items");
    
    const data = await normalizedCartResponse(cart, req);

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      data
    });
  } catch (error) {
    console.error("💥 [Backend] Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove product from cart",
      error: error.message
    });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId: userId }).populate(
      "items.product",
      "name price images quantity"
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    await fixExistingCartItems(cart);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId) || !quantity || quantity < 1) {
      const data = await normalizedCartResponse(cart, req);
      return res.status(200).json({
        success: true,
        message: "Invalid product or quantity. Cart unchanged.",
        data,
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} items available in stock`
      });
    }

    const cartItem = cart.items.find((item) => item.product._id.toString() === productId);
    if (!cartItem) {
      const data = await normalizedCartResponse(cart, req);
      return res.status(200).json({
        success: true,
        message: "Item not in cart. No changes made.",
        data
      });
    }

    cartItem.quantity = quantity;
    cartItem.price = product.price * quantity;

    cart.total = cart.items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      return total + (isNaN(itemPrice) ? 0 : itemPrice);
    }, 0);

    if (isNaN(cart.total)) {
      cart.total = 0;
    }

    await cart.save();
    const data = await normalizedCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Cart.findOneAndDelete({ userId: userId });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    console.log(`Cart deleted for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: { items: [], totalItems: 0, cartTotal: 0 }
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message
    });
  }
};
