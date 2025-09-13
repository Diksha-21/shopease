import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { createPayment, verifyPayment } from "../api/payment.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { getBankAccounts, addBankAccount } from "../api/bank.js";
import { toast } from "react-toastify";

const CheckOut = () => {
  const { cart, fetchCart, clearCart } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [userDefaultBank, setUserDefaultBank] = useState(null);
  const [allBankAccounts, setAllBankAccounts] = useState([]);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phoneNumber: ""
  });

  // Bank form state
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    bankCode: "",
    branchName: "",
    ifscCode: "",
    isDefault: true
  });

  // Persist & rehydrate "Buy Now" navigation state so direct purchase survives refresh
  const [dpState, setDpState] = useState(() => {
    const fromNav = location.state && location.state.directPurchase ? location.state : null;
    if (fromNav) {
      sessionStorage.setItem("dpCheckout", JSON.stringify(fromNav));
      return fromNav;
    }
    const saved = sessionStorage.getItem("dpCheckout");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (location.state && location.state.directPurchase) {
      sessionStorage.setItem("dpCheckout", JSON.stringify(location.state));
      setDpState(location.state);
    }
  }, [location.state]);

  const isDirect = !!dpState?.directPurchase;
  const productData = dpState?.productData || null;
  const orderData = dpState?.orderData || null;

  const dpItems = Array.isArray(orderData?.items) ? orderData.items : [];
  const dpAmount = Number(orderData?.amount ?? 0);

  const cartItems = useMemo(() => {
    if (isDirect) return dpItems;
    if (Array.isArray(cart?.items)) return cart.items || [];
    return [];
  }, [isDirect, dpItems, cart]);

  const totalAmount = useMemo(() => {
    if (isDirect) {
      if (dpAmount && dpAmount > 0) return dpAmount;
      if (productData) return Number(productData.price) * (orderData?.quantity ?? 1);
      return 0;
    }

    if (Array.isArray(cartItems) && cartItems.length > 0) {
      return cartItems.reduce((sum, item) => {
        const price = Number(item.price ?? item.product?.price ?? 0);
        const qty = Number(item.quantity ?? 1);
        return sum + price * qty;
      }, 0);
    }

    return 0;
  }, [isDirect, dpAmount, productData, orderData, cartItems]);

  // Fetch user's bank accounts
  const fetchUserBanks = async () => {
    try {
      const response = await getBankAccounts();
      if (response?.success && response?.accounts) {
        setAllBankAccounts(response.accounts);
        const def = response.accounts.find((a) => a.isDefault);
        setUserDefaultBank(def || response.accounts[0] || null);
      }
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
    }
  };

  // Add new bank account
  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    if (!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.bankName) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setLoading(true);
      const response = await addBankAccount(bankForm);
      if (response?.success) {
        toast.success("Bank account added successfully!");
        const newBank = response.bankAccount;
        setAllBankAccounts((prev) => [...prev, newBank]);
        setUserDefaultBank(newBank);
        setShowAddBankForm(false);
        setBankForm({
          accountHolderName: "",
          accountNumber: "",
          bankName: "",
          bankCode: "",
          branchName: "",
          ifscCode: "",
          isDefault: true
        });
        // Refresh bank accounts
        fetchUserBanks();
      } else {
        toast.error(response?.message || "Failed to add bank account");
      }
    } catch (err) {
      console.error("Add bank account error:", err);
      toast.error("Failed to add bank account");
    } finally {
      setLoading(false);
    }
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    // Only fetch cart if it's not a direct purchase
    if (!isDirect && (!cart || !cart.items)) {
      fetchCart();
    }
    fetchUserBanks();
    loadRazorpayScript().then((loaded) => {
      if (loaded) {
        setRazorpayLoaded(true);
      } else {
        console.error("Failed to load Razorpay script");
        setError("Payment system unavailable. Please try again later.");
      }
    });
  }, [isDirect]);

  const generateOrderId = () => {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const validateAddress = () => {
    const required = ["name", "street", "city", "state", "postalCode", "phoneNumber"];
    return required.every((field) => shippingAddress[field]?.trim());
  };

  const validateUpiId = (vpa) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(vpa);
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankFormChange = (field, value) => {
    setBankForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildItemsSnapshot = (items) => {
    if (isDirect && (!items || items.length === 0) && productData) {
      const qty = 1;
      const price = Number(productData?.price ?? 0);
      return [
        {
          productId: productData?._id || productData?.productId,
          name: productData?.name || "Product",
          quantity: qty,
          price,
          itemTotal: price * qty,
          sellerId: productData?.seller?._id || productData?.seller
        }
      ];
    }

    return (items || []).map((it) => {
      const qty = Number(it.quantity ?? 1);
      const price = Number(it.price ?? it.product?.price ?? 0);
      return {
        productId: it.productId || it._id || it.product?._id,
        name: it.name || productData?.name || "Product",
        quantity: qty,
        price,
        itemTotal: Number(it.itemTotal ?? price * qty),
        sellerId: it.sellerId || it.seller?._id || productData?.seller?._id || productData?.seller
      };
    });
  };

  const handlePaymentSuccess = async (razorpayResponse, paymentData) => {
    try {
      const result = await verifyPayment({
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        paymentId: paymentData.paymentId
      });
      if (result?.success) {
        toast.success("Payment completed successfully!");
        if (!isDirect) {
          await clearCart();
        }

        sessionStorage.removeItem("dpCheckout");
        navigate("/payment-status", {
          state: {
            paymentId: paymentData.paymentId,
            orderId: paymentData.orderId,
            method: selectedPaymentMethod,
            amount: totalAmount,
            status: "success"
          }
        });
      } else {
        toast.error(result?.message || "Payment verification failed");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      toast.error("Payment verification failed");
    }
  };

  const handlePaymentFailure = (err) => {
    console.error("Payment failed:", err);
    toast.error(`Payment failed: ${err?.description || "Please try again."}`);
  };

  const openRazorpayCheckout = (paymentData) => {
    if (!window.Razorpay) {
      toast.error("Payment system not available. Please refresh the page.");
      return;
    }
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast.error("Payment configuration error. Please contact support.");
      console.error("Razorpay key not configured");
      return;
    }

    const options = {
      key: razorpayKey,
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      name: "Your Store",
      description: "Order Payment",
      order_id: paymentData.razorpayOrderId,
      handler: (response) => handlePaymentSuccess(response, paymentData),
      prefill: {
        name: shippingAddress.name || "Customer",
        email: "",
        contact: shippingAddress.phoneNumber || ""
      },
      theme: { color: "#3B82F6" },
      modal: {
        ondismiss: () => {
          toast.info("Payment cancelled");
        }
      }
    };

    if (selectedPaymentMethod === "UPI" && upiId) {
      options.prefill.vpa = upiId;
    }

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", handlePaymentFailure);
    razorpay.open();
  };

  const handleCheckout = async (method = selectedPaymentMethod) => {
    try {
      setLoading(true);
      setError(null);

      if (cartItems.length === 0) {
        toast.error("No items to purchase");
        return;
      }
      if (!method) {
        toast.error("Please select a payment method");
        return;
      }
      if (!validateAddress()) {
        toast.error("Please fill in all shipping address fields");
        return;
      }

      const orderId = generateOrderId();
      const items = buildItemsSnapshot(cartItems);

      const payload = {
        orderId,
        amount: totalAmount,
        paymentMethod: method,
        shippingAddress,
        items,
        ...(method === "UPI" && { upiId }),
        ...(method === "Net Banking" && userDefaultBank && { bankCode: userDefaultBank.bankCode }),
        ...(method === "Cash" && { status: "pending" }),
      };

      console.log("Checkout payload:", payload);

      const result = await createPayment(payload);

      if (result?.success) {
        if (method === "Cash") {
          toast.success("Order placed successfully with COD!");
          if (!isDirect) await clearCart();
          sessionStorage.removeItem("dpCheckout");
          navigate("/payment-status", {
            state: {
              paymentId: result.payment._id,
              orderId,
              method,
              amount: totalAmount,
              status: "pending",
            },
          });
        } else {
          openRazorpayCheckout({
            paymentId: result.payment._id,
            orderId,
            razorpayOrderId: result.payment.razorpayOrderId || null,
          });
        }
      } else {
        toast.error(result?.message || "Checkout failed");
      }
    } catch (err) {
      toast.error("Unexpected error during checkout");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete your purchase securely</p>
        </div>

        {isDirect && (
          <div className={`mb-6 p-4 rounded-lg ${theme === "dark" ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
            <p className="font-medium text-blue-700 dark:text-blue-300">Direct Purchase</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className={`rounded-xl shadow-md p-6 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  📦
                </span>
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={shippingAddress.name}
                      onChange={(e) => handleAddressChange("name", e.target.value)}
                      className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={shippingAddress.phoneNumber}
                      onChange={(e) => handleAddressChange("phoneNumber", e.target.value)}
                      className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    placeholder="Enter street address"
                    value={shippingAddress.street}
                    onChange={(e) => handleAddressChange("street", e.target.value)}
                    className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State *</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Postal Code *</label>
                    <input
                      type="text"
                      placeholder="Postal code"
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                      className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={shippingAddress.country}
                    onChange={(e) => handleAddressChange("country", e.target.value)}
                    className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className={`rounded-xl shadow-md p-6 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  💳
                </span>
                Payment Method
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedPaymentMethod("UPI")}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedPaymentMethod === "UPI" 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-lg">📱</div>
                    <div className="font-medium">UPI</div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod("Net Banking")}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedPaymentMethod === "Net Banking" 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-lg">🏦</div>
                    <div className="font-medium">Net Banking</div>
                  </button>

                  <button
                    onClick={() => handleCheckout("Cash")}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedPaymentMethod === "Cash" 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-lg">💰</div>
                    <div className="font-medium">Cash on Delivery</div>
                  </button>
                </div>

                {/* UPI ID Input */}
                {selectedPaymentMethod === "UPI" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">UPI ID</label>
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g., name@bank)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className={`w-full p-3 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                    />
                  </div>
                )}

                {/* Net Banking - Show saved accounts */}
                {selectedPaymentMethod === "Net Banking" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Select Bank Account</label>
                    {allBankAccounts.length > 0 ? (
                      <div className="space-y-3">
                        {allBankAccounts.map((bank) => (
                          <div
                            key={bank._id}
                            onClick={() => setUserDefaultBank(bank)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              userDefaultBank?._id === bank._id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                            }`}
                          >
                            <div className="font-medium">{bank.bankName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {bank.accountNumber} • {bank.accountHolderName}
                            </div>
                            {bank.isDefault && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-2">
                                Default
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-4 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-sm mb-3">No saved bank accounts found.</p>
                        <button
                          onClick={() => setShowAddBankForm(true)}
                          className="text-blue-600 dark:text-blue-400 underline text-sm"
                        >
                          Add Bank Account
                        </button>
                      </div>
                    )}

                    {/* Add Bank Account Form */}
                    {showAddBankForm && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                        <h4 className="font-medium mb-3">Add Bank Account</h4>
                        <form onSubmit={handleAddBankAccount} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Account Holder Name *"
                            value={bankForm.accountHolderName}
                            onChange={(e) => handleBankFormChange("accountHolderName", e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Account Number *"
                            value={bankForm.accountNumber}
                            onChange={(e) => handleBankFormChange("accountNumber", e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Bank Name *"
                            value={bankForm.bankName}
                            onChange={(e) => handleBankFormChange("bankName", e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            required
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Branch Name"
                              value={bankForm.branchName}
                              onChange={(e) => handleBankFormChange("branchName", e.target.value)}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <input
                              type="text"
                              placeholder="IFSC Code"
                              value={bankForm.ifscCode}
                              onChange={(e) => handleBankFormChange("ifscCode", e.target.value)}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              disabled={loading}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              {loading ? 'Adding...' : 'Add Account'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddBankForm(false)}
                              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className={`rounded-xl shadow-md p-6 h-fit ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                🛒
              </span>
              Order Summary
            </h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => {
                const quantity = item.quantity || 1;
                const price = item.price || item.product?.price || 0;
                const total = quantity * price;
                
                return (
                  <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <p className="font-medium">{item.name || item.product?.name || "Product"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {quantity}</p>
                    </div>
                    <p className="font-medium">₹{total.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-green-600 dark:text-green-400">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span>₹0.00</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || (!razorpayLoaded && selectedPaymentMethod !== "Cash")}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)}`}
            </button>

            {!razorpayLoaded && selectedPaymentMethod !== "Cash" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Loading payment system...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOut;