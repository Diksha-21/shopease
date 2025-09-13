import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getImageUrl } from '../../api/api';
import { getBankAccounts } from '../../api/bank';

export const Profile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [profileData, setProfileData] = useState({
    username: 'Not provided',
    email: 'Not provided',
    phone: 'Not provided',
    profileImage: null,
    address: {
      street: 'Not provided',
      city: 'Not provided',
      state: 'Not provided',
      country: 'Not provided',
      postalCode: 'Not provided'
    }
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || 'Not provided',
        email: user.email || 'Not provided',
        phone: user.phone || 'Not provided',
        profileImage: user.profileImage || null,
        address: {
          street: user.address?.street || 'Not provided',
          city: user.address?.city || 'Not provided',
          state: user.address?.state || 'Not provided',
          country: user.address?.country || 'Not provided',
          postalCode: user.address?.postalCode || 'Not provided'
        }
      });
      fetchBankAccounts();
    }
  }, [user]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await getBankAccounts();
      if (response.success) {
        setBankAccounts(response.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!profileData.username || profileData.username === 'Not provided') {
      return '?';
    }
    return profileData.username.charAt(0).toUpperCase();
  };

  const maskAccountNumber = (number) => {
    if (!number) return '';
    const str = number.toString();
    return str.slice(0, 2) + '****' + str.slice(-2);
  };

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-gray-50'}`}>
      <div className={`max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
        {/* Profile Header */}
        <div className={`p-8 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-800 to-purple-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white`}>
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative group mb-6 md:mb-0 md:mr-8">
              {profileData.profileImage ? (
                <img 
                  src={getImageUrl(profileData.profileImage)} 
                  alt="Profile" 
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/80 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                />
              ) : (
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold ${theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-white/20 text-white'} shadow-xl`}>
                  {getInitials()}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{profileData.username}</h1>
              <p className="text-blue-100 text-lg mb-3">{profileData.email}</p>
              <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/10">
                {user?.activeRole === 'seller' ? 'Seller Account' : 'Buyer Account'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8">
          {/* Personal Information */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className={`w-1 h-8 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'} mr-3`}></div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                Personal Information
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Username</p>
                <p className="text-lg font-medium">{profileData.username}</p>
              </div>
              
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Email</p>
                <p className="text-lg">{profileData.email}</p>
              </div>
              
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Phone</p>
                <p className="text-lg">{profileData.phone}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className={`w-1 h-8 rounded-full ${theme === 'dark' ? 'bg-purple-500' : 'bg-indigo-600'} mr-3`}></div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-indigo-600'}`}>
                Address Information
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-indigo-600'}`}>Street</p>
                <p className="text-lg">{profileData.address.street}</p>
              </div>
              
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-indigo-600'}`}>City</p>
                <p className="text-lg">{profileData.address.city}</p>
              </div>
              
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-indigo-600'}`}>State</p>
                <p className="text-lg">{profileData.address.state}</p>
              </div>
              
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-indigo-600'}`}>Country</p>
                <p className="text-lg">{profileData.address.country}</p>
              </div>
              
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-indigo-600'}`}>Postal Code</p>
                <p className="text-lg">{profileData.address.postalCode}</p>
              </div>
            </div>
          </div>

          {/* Bank Information - For all users */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className={`w-1 h-8 rounded-full ${theme === 'dark' ? 'bg-green-500' : 'bg-green-600'} mr-3`}></div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                Bank Information
              </h2>
            </div>
            
            {loading ? (
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-green-50'} text-center`}>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Loading bank accounts...
                </p>
              </div>
            ) : bankAccounts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {bankAccounts.map(acc => (
                  <div key={acc._id} className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {acc.bankName}
                          {acc.isDefault && (
                            <span className="ml-2 px-2 py-1 text-xs rounded bg-green-500 text-white">
                              Default
                            </span>
                          )}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-green-50'} text-center`}>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  No bank accounts added yet. Add your bank details in Settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};