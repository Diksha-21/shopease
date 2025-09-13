import Product from "../model/product.model.js";
import { deleteFile } from "../upload/upload.js";
import fs from "fs";


export const mapImageUrls = (images, req) => {
  if (!images || images.length === 0) return [];
  return images.map(img => {
    // If path already contains 'upload/uploads', don’t double it
    if (img.includes("upload/uploads")) {
      return `${req.protocol}://${req.get("host")}/${img}`;
    }
    // Otherwise, prepend the correct base
    return `${req.protocol}://${req.get("host")}/upload/uploads/product-images/${img}`;
  });
};

export const getPublicProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('seller', 'username companyName'); 
    res.status(200).json({
      success: true,
      data: products.map(p => ({
        ...p.toObject(),
        images: mapImageUrls(p.images, req),
        seller: p.seller ? {
          username: p.seller.username,
          companyName: p.seller.companyName || ''
        } : null
      }))
    });
  } catch (err) {
    console.error("getPublicProducts error:", err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const getBuyerProducts = async (req, res) => {
  try {
    const { minPrice, maxPrice, category, sort, search, page = 1, limit = 12 } = req.query;
    const filter = {
      status: 'active',
      quantity: { $gt: 0 },
      ...(minPrice && { price: { $gte: Number(minPrice) } }),
      ...(maxPrice && { price: { $lte: Number(maxPrice) } }),
      ...(category && { category }),
      ...(search && {
        $or: [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ]
      })
    };

    const products = await Product.find(filter)
      .sort(sort === 'newest' ? { createdAt: -1 } :
            sort === 'price_asc' ? { price: 1 } :
            sort === 'price_desc' ? { price: -1 } : {})
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('seller', 'username');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products.map(p => ({
        ...p.toObject(),
        images: mapImageUrls(p.images, req)
      })),
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        totalProducts: total,
        limit: Number(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });

    res.status(200).json({
      success: true,
      data: products.map(p => ({
        ...p.toObject(),
        images: mapImageUrls(p.images, req) 
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, category, sizes, colors } = req.body;
    const seller = req.user.id;

    if (!name || !price || !quantity || !req.files || req.files.length === 0) {
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Name, price, quantity and at least one image are required"
      });
    }

    const images = req.files.map(file => file.filename);

    const newProduct = new Product({
      name,
      price,
      quantity,
      description,
      category,
      sizes: sizes ? sizes.split(',') : [],
      colors: colors ? colors.split(',') : [],
      seller,
      images,
      status: 'active'
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...newProduct.toObject(),
        images: mapImageUrls(newProduct.images, req)
      }
    });
  } catch (err) {
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const uploadedImages = req.files?.map(file => file.filename) || [];

    let finalImages = Array.isArray(product.images) ? [...product.images] : [];

    if (req.body.imageUpdateMode === 'replace') {
      finalImages = uploadedImages;
    } else {
      finalImages.push(...uploadedImages);
    }

    if (req.body.imagesToRemove) {
      try {
        const toRemove = JSON.parse(req.body.imagesToRemove);
        finalImages = finalImages.filter(img => !toRemove.includes(img));
      } catch (err) {
        console.warn("Invalid imagesToRemove JSON:", err);
      }
    }

    if (finalImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    product.images = finalImages;
    product.name = req.body.name || product.name;
    product.description = req.body.description || '';
    product.price = Number(req.body.price);
    product.quantity = Number(req.body.quantity);
    product.category = req.body.category || '';

    try {
      product.sizes = JSON.parse(req.body.sizes || '[]');
      product.colors = JSON.parse(req.body.colors || '[]');
    } catch (parseErr) {
      console.warn("Invalid sizes/colors JSON:", parseErr);
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...product.toObject(),
        images: mapImageUrls(product.images, req)
      }
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const images = Array.isArray(product.images) ? product.images : [];
    images.forEach(img => deleteFile(img, 'product'));

    await Product.findByIdAndDelete(req.params.productId);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { query, minPrice, maxPrice, category, sort, page = 1, limit = 12 } = req.body;
    const filter = {
      status: 'active',
      quantity: { $gt: 0 },
      ...(query && {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      }),
      ...(minPrice && { price: { $gte: Number(minPrice) } }),
      ...(maxPrice && { price: { $lte: Number(maxPrice) } }),
      ...(category && { category })
    };

    let sortOption = {};
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('seller', 'username');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products.map(p => ({
        ...p.toObject(),
        images: mapImageUrls(p.images, req)
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to search products" });
  }
};