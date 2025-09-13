// SellerPaymentDashboard.jsx (New Component)
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getSellerPayments, confirmCODPayment } from '../../api/payment.js';
import { toast } from 'react-toastify';

const SellerPaymentDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getSellerPayments();
      if (response.success) {
        setPayments(response.payments);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCOD = async (paymentId) => {
    try {
      const response = await confirmCODPayment(paymentId, confirmationNotes);
      if (response.success) {
        toast.success('COD payment confirmed successfully!');
        setConfirmingPayment(null);
        setConfirmationNotes('');
        fetchPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  const getStatusBadge = (status, method) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage customer payments and confirm COD deliveries
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">No Payments Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Customer payments will appear here once orders are placed.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">
                            Order #{payment.orderId?._id?.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.orderId?.items?.length} items
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-400">
                              TXN: {payment.transactionId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{payment.userId?.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.userId?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold">₹{payment.amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{payment.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{payment.method}</div>
                        {payment.method === 'UPI' && payment.paymentDetails?.upiId && (
                          <div className="text-xs text-gray-500">
                            {payment.paymentDetails.upiId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(payment.status, payment.method)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.method === 'Cash' && payment.status === 'pending' && (
                          <button
                            onClick={() => setConfirmingPayment(payment._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            Confirm COD
                          </button>
                        )}
                        {payment.status === 'completed' && payment.paymentDetails?.confirmationDetails && (
                          <div className="text-xs text-green-600">
                            ✓ Confirmed by{' '}
                            {payment.paymentDetails.confirmationDetails.confirmedBy?.name}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COD Confirmation Modal */}
        {confirmingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Confirm COD Payment</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Confirm that you have received cash payment from the customer.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Confirmation Notes (Optional)
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="Add any notes about the payment confirmation..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows="3"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleConfirmCOD(confirmingPayment)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={() => {
                    setConfirmingPayment(null);
                    setConfirmationNotes('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPaymentDashboard;