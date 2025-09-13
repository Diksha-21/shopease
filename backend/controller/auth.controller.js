import User from "../model/user.model.js";
import bcrypt from "bcrypt";
import { decodeToken, generateAuthToken, generateResetToken } from "../auth/token.js";
import { getUserData } from "../auth/token.js";
import BankAccount from "../model/bankDetails.model.js";

export const register = async (req, res) => {
  try {
    const requiredFields = ["username", "email", "password"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    let { username, email, password, phone, address, role = "buyer", companyName, bankAccount } = req.body;
    role = String(role).toLowerCase();

    let parsedAddress = {};
    if (typeof address === "string") {
      try {
        parsedAddress = JSON.parse(address);
      } catch {
        return res.status(400).json({ success: false, message: "Invalid address format" });
      }
    } else if (typeof address === "object" && address !== null) {
      parsedAddress = address;
    } else {
      return res.status(400).json({ success: false, message: "Address is required" });
    }

    const validateAddress = ["street", "city", "state", "country", "postalCode"];
    for (const field of validateAddress) {
      if (!parsedAddress[field] || String(parsedAddress[field]).trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: `Address field ${field} is required and must be valid`,
        });
      }
    }

    if (role === "seller" && !companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required for sellers",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const roles = ["buyer"];
    if (role === "seller") roles.push("seller");

    const user = new User({
      username,
      email,
      password,
      phone: phone || undefined,
      address: parsedAddress,
      roles,
      activeRole: "buyer",
      companyName: role === "seller" ? companyName : undefined,
      profileImage: req.file?.filename || undefined,
    });

    await user.save();

    let createdBankAccount = null;
    try {
      const bankRaw = req.body.bankAccount;
      if (bankRaw) {
        const bankPayload = typeof bankRaw === "string" ? JSON.parse(bankRaw) : bankRaw;
        if (!bankPayload.accountHolderName || !bankPayload.accountNumber || !bankPayload.bankName) {
          return res.status(400).json({ success: false, message: "Incomplete bank details" });
        }
        if (bankPayload.isDefault) {
          await BankAccount.updateMany({ userId: user._id }, { isDefault: false });
        }
        createdBankAccount = await BankAccount.create({
          userId: user._id,
          accountHolderName: bankPayload.accountHolderName,
          accountNumber: bankPayload.accountNumber,
          bankName: bankPayload.bankName,
          bankCode: bankPayload.bankCode,
          branchName: bankPayload.branchName || "",
          ifscCode: bankPayload.ifscCode || "",
          isDefault: bankPayload.isDefault ?? true,
        });
      }
    } catch (e) {
      console.error("Bank account creation during register failed:", e);
    }

    const token = generateAuthToken({
      ...user.toObject(),
      activeRole: "buyer",
      roles: user.roles,
    });

    return res.status(201).json({
      success: true,
      token,
      user: getUserData(user),
      bankAccount: createdBankAccount
        ? createdBankAccount.toMaskedObject?.() ?? createdBankAccount
        : null,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.activeRole) user.activeRole = "buyer";
    if (!user.roles || !user.roles.includes("buyer")) {
      user.roles = [...(user.roles || []), "buyer"];
    }
    await user.save();

    const token = generateAuthToken(
      {
        ...user.toObject(),
        activeRole: user.activeRole,
        roles: user.roles,
      },
      rememberMe
    );

    return res.json({
      success: true,
      token,
      user: getUserData(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: error.message || "Login failed" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: "If email exists, reset link sent" });
    }

    let resetToken;
    try {
      resetToken = generateResetToken(user._id);
    } catch (err) {
      console.error("generateResetToken error:", err);
      return res.status(500).json({ success: false, message: "Token generation failed" });
    }

    user.resetToken = resetToken;
    user.resetTokenExpiration = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    return res.json({
      success: true,
      message: "Password reset link generated",
      resetToken,
      resetLink,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ success: false, message: "Password reset failed" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    const { newPassword } = req.body || {};

    if (!token || !newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Valid token and new password (min 6 chars) are required",
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: "Your password has been changed successfully!",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Password reset failed" });
  }
};