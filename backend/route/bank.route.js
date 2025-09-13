import express from "express";
import { authenticateToken } from "../auth/token.js";
import {
  addBankAccount,
  getBankAccounts,
  updateBankAccount,
  deleteBankAccount,
} from "../controller/bank.controller.js";

const router = express.Router();

router.post("/", authenticateToken, addBankAccount);
router.get("/", authenticateToken, getBankAccounts);
router.put("/:id", authenticateToken, updateBankAccount);
router.delete("/:id", authenticateToken, deleteBankAccount);

const bankRoutes = router;
export default bankRoutes;
