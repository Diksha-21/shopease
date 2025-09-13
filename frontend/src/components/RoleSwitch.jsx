import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';

export const RoleSwitch = () => {
  const { user, switchRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchRole = async () => {
    if (isLoading || !user) return;
    
    try {
      setIsLoading(true);
      const targetRole = user.activeRole === 'seller' ? 'buyer' : 'seller';
      await switchRole(targetRole);
    } catch (error) {
      console.error('Role switch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !user.roles?.includes('seller')) return null;

  return (
    <button
      onClick={handleSwitchRole}
      disabled={isLoading}
      className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${
        user.activeRole === 'seller' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      aria-label={`Switch to ${user.activeRole === 'seller' ? 'buyer' : 'seller'} mode`}
    >
      <span
        className={`inline-block w-3 h-3 transform transition-transform rounded-full bg-white ${
          user.activeRole === 'seller' ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
};