import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import con_data from "./config/db.js";
import userRoutes from "./route/user.route.js";
import productRoutes from "./route/product.route.js";
import cartRoutes from "./route/cart.route.js";
import orderRoutes from "./route/order.route.js";
import dashboardRoutes from "./route/dashboard.route.js";
import authRoutes from "./route/auth.route.js";
import { authenticateToken } from "./auth/token.js";
import uploadRoutes from './route/upload.route.js';
import paymentRoutes from './route/payment.route.js';
import bankRoutes from "./route/bank.route.js";
import checkoutRoutes from './route/checkout.route.js';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

const allowedOrigins = process.env.NODE_ENV === "production" ? ['https://shopease.com'] : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

con_data();

app.use('/upload/uploads/profile-images', express.static(path.join(__dirname, 'upload', 'uploads', 'profile-images')));
app.use('/upload/uploads/product-images', express.static(path.join(__dirname, 'upload', 'uploads', 'product-images')));

app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bank-accounts", bankRoutes);
app.use("/api/checkout", checkoutRoutes);

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  res.header('Access-Control-Allow-Origin', 'http://localhost:5173' || 'https://shopease.com');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  next();
});

const uploadDirs = [
    path.join(__dirname, 'upload', 'uploads', 'profile-images'),
    path.join(__dirname, 'upload', 'uploads', 'product-images')
  ];
  
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

app.get("/", (req, res) => {
    res.send("E-Commerce API is running...");
});

const PORT = process.env.PORT || "5000";
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});