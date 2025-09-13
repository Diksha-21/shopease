import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [bank, setBank] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    ifscCode: "",
    routingNumber: "",
    iban: "",
    bic: "",
    isDefault: true,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("personal");
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const { theme } = useTheme();

    const bankOptions = [
    { bankName: "HDFC Bank", bankCode: "HDFC" },
    { bankName: "ICICI Bank", bankCode: "ICIC" },
    { bankName: "Axis Bank", bankCode: "UTIB" },
    { bankName: "State Bank of India", bankCode: "SBIN" },
    { bankName: "Punjab National Bank", bankCode: "PUNB" },
    { bankName: "Bank of Baroda", bankCode: "BARB" },
    { bankName: "Canara Bank", bankCode: "CNRB"}
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleBankChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBank((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        setError("Please select an image file (JPEG, PNG, GIF)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const validateForm = () => {
    // Personal info validation
    if (!formData.username.trim()) return setError("Username is required"), false;
    if (!formData.email.trim()) return setError("Email is required"), false;
    if (!formData.password) return setError("Password is required"), false;
    if (formData.password.length < 6) return setError("Password must be at least 6 characters"), false;
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match"), false;
    
    // Address validation
    if (!formData.street.trim()) return setError("Street address is required"), false;
    if (!formData.city.trim()) return setError("City is required"), false;
    if (!formData.state.trim()) return setError("State is required"), false;
    if (!formData.country.trim()) return setError("Country is required"), false;
    if (!formData.postalCode.trim()) return setError("Postal code is required"), false;
    
    // Bank validation
    if (!bank.accountHolderName || !bank.accountNumber || !bank.bankName) {
      return setError("Bank details are required (account holder name, account number, and bank name)"), false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value && key !== "confirmPassword") formDataObj.append(key, value);
      });
      
      formDataObj.append("role", "buyer");
      const address = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
      };
      formDataObj.append("address", JSON.stringify(address));
      
      if (profileImage) formDataObj.append("profileImage", profileImage);
      formDataObj.append("bankAccount", JSON.stringify(bank));

      const result = await register(formDataObj);
      if (result?.success) {
        navigate("/dashboard");
      } else {
        setError(result?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const nextSection = () => {
    if (activeSection === "personal") setActiveSection("address");
    else if (activeSection === "address") setActiveSection("bank");
  };
  
  const prevSection = () => {
    if (activeSection === "bank") setActiveSection("address");
    else if (activeSection === "address") setActiveSection("personal");
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-4xl w-full space-y-8 p-8 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeSection === 'personal' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
              1
            </div>
            <div className={`ml-2 text-sm font-medium ${activeSection === 'personal' ? 'text-indigo-600' : 'text-gray-500'}`}>
              Personal
            </div>
          </div>
          
          <div className="flex items-center mx-4">
            <div className="w-16 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeSection === 'address' ? 'bg-indigo-600 text-white' : activeSection === 'bank' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
              2
            </div>
            <div className={`ml-2 text-sm font-medium ${activeSection === 'address' || activeSection === 'bank' ? 'text-indigo-600' : 'text-gray-500'}`}>
              Address
            </div>
          </div>
          
          <div className="flex items-center mx-4">
            <div className="w-16 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeSection === 'bank' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
              3
            </div>
            <div className={`ml-2 text-sm font-medium ${activeSection === 'bank' ? 'text-indigo-600' : 'text-gray-500'}`}>
              Bank
            </div>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          {/* Personal Information Section */}
          {activeSection === "personal" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium">
                    Username *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Phone number (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profile Image</label>
                  <div className="flex items-center">
                    <label className="flex flex-col items-center px-4 py-2 bg-white text-blue-500 rounded-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                      <span className="text-sm">Select Image</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
                
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextSection}
                  className="group relative w-1/4 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* Address Information Section */}
          {activeSection === "address" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              
              <div>
                <label htmlFor="street" className="block text-sm font-medium">
                  Street Address *
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Street address"
                  value={formData.street}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium">
                    State/Province *
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="State/Province"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium">
                    Country *
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium">
                    Postal Code *
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Postal code"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevSection}
                  className="group relative w-1/4 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
                
                <button
                  type="button"
                  onClick={nextSection}
                  className="group relative w-1/4 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* Bank Information Section */}
          {activeSection === "bank" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Bank Account Information</h3>
              <p className="text-sm text-gray-500">Your bank details are encrypted and stored securely.</p>
              
              <div>
                <label htmlFor="accountHolderName" className="block text-sm font-medium">
                  Account Holder Name *
                </label>
                <input
                  id="accountHolderName"
                  name="accountHolderName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Full name as on bank account"
                  value={bank.accountHolderName}
                  onChange={handleBankChange}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium">
                    Account Number *
                  </label>
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Account number"
                    value={bank.accountNumber}
                    onChange={handleBankChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"></div>
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium">
                      Bank Name *
                    </label>
                    <select
                      id="bankName"
                      name="bankName"
                      value={bank.bankName}
                      onChange={(e) => {
                        const selectedBank = bankOptions.find(b => b.bankName === e.target.value);
                        setBank(prev => ({
                          ...prev,
                          bankName: selectedBank.bankName,
                          bankCode: selectedBank.bankCode
                        }));
                      }}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm"
                      required
                    >
                      <option value="">Select a Bank</option>
                      {bankOptions.map(b => (
                        <option key={b.bankCode} value={b.bankName}>
                          {b.bankName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium">
                  Branch Name
                </label>
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Branch name (optional)"
                  value={bank.branchName}
                  onChange={handleBankChange}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-medium">
                    IFSC Code
                  </label>
                  <input
                    id="ifscCode"
                    name="ifscCode"
                    type="text"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="IFSC code (optional)"
                    value={bank.ifscCode}
                    onChange={handleBankChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={bank.isDefault}
                  onChange={handleBankChange}
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default bank account
                </label>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevSection}
                  className="group relative w-1/4 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-1/4 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {loading ? 'Processing...' : 'Register'}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <div className="text-center text-sm mt-4">
          <p>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};