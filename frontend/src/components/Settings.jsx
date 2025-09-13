import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import userApi from '../api/user';
import { getImageUrl } from '../api/api';
import { addBankAccount, getBankAccounts, updateBankAccount, deleteBankAccount } from "../api/bank";
import { toast } from 'react-toastify';

const Settings = () => {
  const { user, setUser } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    phone: '',
    companyName: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    emailUpdates: false
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    bankCode: '',
    branchName: '',
    ifscCode: '',
    isDefault: false
  });
  const [editingBankId, setEditingBankId] = useState(null);
  const bankOptions = [
    { bankName: "HDFC Bank", bankCode: "HDFC" },
    { bankName: "ICICI Bank", bankCode: "ICIC" },
    { bankName: "Axis Bank", bankCode: "UTIB" },
    { bankName: "State Bank of India", bankCode: "SBIN" },
    { bankName: "Punjab National Bank", bankCode: "PUNB" },
    { bankName: "Bank of Baroda", bankCode: "BARB" },
    { bankName: "Canara Bank", bankCode: "CNRB"}
  ];

  useEffect(() => {
    if (user) {
      setForm({
        phone: user.phone || '',
        companyName: user.companyName || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        country: user.address?.country || '',
        postalCode: user.address?.postalCode || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        notifications: user.settings?.notifications ?? true,
        emailUpdates: user.settings?.emailUpdates ?? false
      });
      setImagePreview(user.profileImage ? getImageUrl(user.profileImage) : '');
    }
    
    if (activeTab === 'bank') {
      fetchBankAccounts();
    }
  }, [user, activeTab]);

  const fetchBankAccounts = async () => {
    try {
      const res = await getBankAccounts();
      if (res.success) {
        setBankAccounts(res.accounts || []);
      }
    } catch (err) {
      toast.error('Failed to fetch bank details');
    }
  };

  const handleBankChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBankForm({
      ...bankForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.bankName) {
        throw new Error("Please fill in all required bank details");
      }

      let res;
      if (editingBankId) {
        res = await updateBankAccount(editingBankId, bankForm);
      } else {
        res = await addBankAccount(bankForm);
      }

      if (res.success) {
        toast.success(editingBankId ? 'Bank account updated successfully' : 'Bank account added successfully');
        resetBankForm();
        fetchBankAccounts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const resetBankForm = () => {
    setBankForm({
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      bankCode: '',
      branchName: '',
      isDefault: false,
    });
    setEditingBankId(null);
    setShowBankForm(false);
  };

  const handleEditBank = (account) => {
    setBankForm({
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      bankCode: account.bankCode,
      branchName: account.branchName || '',
      ifscCode: account.ifscCode || '',
      isDefault: account.isDefault || false,
    });
    setEditingBankId(account._id);
    setShowBankForm(true);
  };

  const handleDeleteBank = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this bank account?');
      if (!confirmDelete) return;

      const res = await deleteBankAccount(id);
      if (res.success) {
        toast.success('Bank account deleted successfully');
        fetchBankAccounts();
      }
    } catch (err) {
      toast.error('Failed to delete bank account');
    } 
  };

  const handleSetDefaultBank = async (id) => {
    try {
      const res = await updateBankAccount(id, { isDefault: true });
      if (res.success) {
        toast.success('Default bank account updated');
        fetchBankAccounts();
      }
    } catch (err) {
      toast.error('Failed to set default account');
    }
  };

  const maskAccountNumber = (number) => {
    if (!number) return '';
    const str = number.toString();
    return str.slice(0, 2) + '****' + str.slice(-2);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const formData = new FormData();
      const address = {
        street: form.street,
        city: form.city,
        state: form.state,
        country: form.country,
        postalCode: form.postalCode
      };
      
      formData.append('phone', form.phone);
      formData.append('address', JSON.stringify(address));
      formData.append('settings', JSON.stringify({
        notifications: form.notifications,
        emailUpdates: form.emailUpdates
      }));
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      
      if (form.companyName && !user.roles.includes('seller')) {
        formData.append('addRole', 'seller');
        formData.append('companyName', form.companyName);
      }
      
      const response = await userApi.updateSettings(formData);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        setSuccessMessage('Profile updated successfully!');
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      if (form.newPassword !== form.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (form.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await userApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      if (response.success) {
        setSuccessMessage('Password changed successfully!');
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        setShowPasswordModal(false);
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
            {imagePreview ? (
              <img 
                src={imagePreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-100'}`}>
                <span className={`text-4xl ${theme === 'dark' ? 'text-white' : 'text-indigo-800'}`}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <label className={`cursor-pointer px-4 py-2 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'}`}>
            Change Photo
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>

        <form className="flex-1" onSubmit={handleUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
            
            <div className="md:col-span-2">
              <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Address Information</h4>
            </div>
            
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Street
              </label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                City
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                State
              </label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Country
              </label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Postal Code
              </label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
            </div>

            {!user?.roles.includes('seller') && (
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-2">Become a Seller</h4>
                  <p className="text-sm text-indigo-600 mb-3">Add your company name to start selling on our platform</p>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-indigo-700">
                      Company Name
                    </label>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      className="w-full p-3 border border-indigo-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <h4 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Notification Preferences</h4>
            </div>
            
            <div className="flex items-center">
              <input
                id="notifications"
                name="notifications"
                type="checkbox"
                checked={form.notifications}
                onChange={handleChange}
                className={`h-5 w-5 rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} text-indigo-600 focus:ring-indigo-500`}
              />
              <label htmlFor="notifications" className={`ml-3 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Enable Notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="emailUpdates"
                name="emailUpdates"
                type="checkbox"
                checked={form.emailUpdates}
                onChange={handleChange}
                className={`h-5 w-5 rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} text-indigo-600 focus:ring-indigo-500`}
              />
              <label htmlFor="emailUpdates" className={`ml-3 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Updates
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} transition-colors shadow-md`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Change Password
        </h3>
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Update your password to keep your account secure.
        </p>
        
        <button
          onClick={() => setShowPasswordModal(true)}
          className={`px-5 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'} transition-colors`}
        >
          Change Password
        </button>
      </div>
    </div>
  );

  const renderBankTab = () => (
    <div className="space-y-6">
      {bankAccounts.length > 0 && (
        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Your Bank Accounts
          </h3>
          
          {bankAccounts.map((acc) => (
            <div
              key={acc._id}
              className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} ${acc.isDefault ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {acc.bankName}
                    {acc.isDefault && (
                      <span className="ml-3 px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                        Default
                      </span>
                    )}
                  </h4>
                  <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {acc.accountHolderName}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Account: {maskAccountNumber(acc.accountNumber)}
                  </p>
                  {acc.ifscCode && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      IFSC: {acc.ifscCode}
                    </p>
                  )}
                  {acc.branchName && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Branch: {acc.branchName}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!acc.isDefault && (
                    <button
                      onClick={() => handleSetDefaultBank(acc._id)}
                      className={`px-3 py-1.5 text-xs rounded-lg ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEditBank(acc)}
                    className={`px-3 py-1.5 text-xs rounded-lg ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBank(acc._id)}
                    className={`px-3 py-1.5 text-xs rounded-lg ${theme === 'dark' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showBankForm ? (
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {editingBankId ? 'Edit Bank Account' : 'Add New Bank Account'}
            </h3>
            <button
              onClick={resetBankForm}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleBankSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Account Holder Name*
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={bankForm.accountHolderName}
                  onChange={handleBankChange}
                  className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Account Number*
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankForm.accountNumber}
                  onChange={handleBankChange}
                  className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name*</label>
                <select
                  name="bankName"
                  value={bankForm.bankName}
                  onChange={(e) => {
                    const selected = bankOptions.find(b => b.bankName === e.target.value);
                    setBankForm(prev => ({
                      ...prev,
                      bankName: selected.bankName,
                      bankCode: selected.bankCode   
                    }));
                  }}
                  className="w-full p-3 border rounded-lg"
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

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branchName"
                  value={bankForm.branchName}
                  onChange={handleBankChange}
                  className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={bankForm.ifscCode}
                  onChange={handleBankChange}
                  className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
              </div>
            </div>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={bankForm.isDefault}
                onChange={handleBankChange}
                className={`h-5 w-5 rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} text-indigo-600 focus:ring-indigo-500`}
              />
              <label htmlFor="isDefault" className={`ml-3 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Set as default bank account
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetBankForm}
                className={`px-4 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2.5 rounded-lg font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                {loading ? 'Saving...' : editingBankId ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={`p-6 rounded-xl text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {bankAccounts.length === 0 ? 'No bank accounts yet' : 'Add another bank account'}
          </h3>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {bankAccounts.length === 0 
              ? 'Add your bank account to receive payments' 
              : 'You can add multiple bank accounts to your profile'}
          </p>
          <button
            onClick={() => setShowBankForm(true)}
            className={`px-4 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            Add Bank Account
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="md:w-1/4">
            <div className={`rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Settings
                </h2>
              </div>
              <nav className="p-4 space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'security' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('bank')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'bank' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  Bank Accounts
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6`}>
              {successMessage && (
                <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                  {error}
                </div>
              )}

              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'bank' && renderBankTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl p-6 w-full max-w-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setError('');
                }}
                className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setError('');
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;