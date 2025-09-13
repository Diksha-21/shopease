import express from "express";
import { getBuyerDashboard, getSellerDashboard } from "../controller/dashboard.controller.js";
import { authenticateToken } from "../auth/token.js";

const router = express.Router();

const assignRole = (role) => (req, res, next) => {
  if (!req.user.roles) req.user.roles = [];
  if (!req.user.roles.includes(role)) req.user.roles.push(role);
  req.user.activeRole = role;
  next();
};

router.get("/buyer", authenticateToken, assignRole('buyer'), getBuyerDashboard);
router.get("/seller", authenticateToken, assignRole('seller'), getSellerDashboard);

const dashboardRoute = router;
export default dashboardRoute;