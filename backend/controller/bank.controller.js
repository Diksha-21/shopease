import BankAccount from '../model/bankDetails.model.js';

const maskAccountNumber = (number) => {
  if (!number) return "";
  const str = number.toString();
  return str.slice(0, 2) + "****" + str.slice(-2);
};

// Add/Create a bank account
export const addBankAccount = async (req, res) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      bankName,
      bankCode,  
      branchName,
      ifscCode,
      isDefault
    } = req.body;

    if (!accountHolderName || !accountNumber || !bankName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existing = await BankAccount.findOne({
      userId: req.user.id,
      accountNumber
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Bank account already exists" });
    }

    if (isDefault) {
      await BankAccount.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    const bankAccount = new BankAccount({
      userId: req.user.id,
      accountHolderName,
      accountNumber,
      bankName,
      bankCode,       
      branchName,
      ifscCode,
      isDefault: !!isDefault
    });

    await bankAccount.save();

    return res.json({
      success: true,
      message: "Bank account added successfully",
      bankAccount: {
        ...bankAccount.toObject(),
        accountNumber: maskAccountNumber(accountNumber)
      }
    });
  } catch (error) {
    console.error("Add Bank Account Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all bank accounts of a user
export const getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ userId: req.user.id });

    const maskedAccounts = accounts.map((acc) => ({
      ...acc.toObject(),
      accountNumber: maskAccountNumber(acc.accountNumber)
    }));

    return res.json({ success: true, accounts: maskedAccounts });
  } catch (error) {
    console.error("Get Bank Accounts Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update bank accounts of a user
export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const account = await BankAccount.findOne({ _id: id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ success: false, message: "Bank account not found" });
    }

    if (updates.isDefault) {
      await BankAccount.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    Object.assign(account, updates);
    await account.save();

    return res.json({
      success: true,
      message: "Bank account updated successfully",
      account: {
        ...account.toObject(),
        accountNumber: maskAccountNumber(account.accountNumber)
      }
    });
  } catch (error) {
    console.error("Update Bank Account Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a user's bank account
export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await BankAccount.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ success: false, message: "Bank account not found" });
    }

    if (account.isDefault) {
      const anotherAccount = await BankAccount.findOne({ userId: req.user.id });
      if (anotherAccount) {
        anotherAccount.isDefault = true;
        await anotherAccount.save();
      }
    }

    return res.json({ success: true, message: "Bank account deleted successfully" });
  } catch (error) {
    console.error("Delete Bank Account Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
