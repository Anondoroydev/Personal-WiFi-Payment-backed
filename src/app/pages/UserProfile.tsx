import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Wifi, ArrowLeft, Phone, CreditCard, Clock, Key, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { Transaction } from './Home';
import { copyToClipboard } from '../utils/clipboard';

import { subscribeToRealtimeEvents } from '../utils/events';
import { formatBanglaDateTime } from '../utils/date';

export default function UserProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [copiedField, setCopiedField] = useState<{ id: string, type: 'user' | 'pass' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let unsubscribe: () => void;
    let handleVisibility: () => void;

    // Check if user is logged in
    const userToken = localStorage.getItem('userToken');
    const userStr = localStorage.getItem('currentUser');

    if (!userToken || !userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user);
    loadUserTransactions(user.id);

    unsubscribe = subscribeToRealtimeEvents('payments', () => {
      loadUserTransactions(user.id, true);
    });

    // Silent polling for cross-device real-time sync
    const interval = setInterval(() => {
      loadUserTransactions(user.id, true);
    }, 10000);

    handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadUserTransactions(user.id, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (handleVisibility) {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(interval);
    };
  }, [navigate]);

  const loadUserTransactions = async (userId: string, silent: boolean = false) => {
    try {
      if (!silent && isInitialLoad) {
        setLoading(true);
      }

      const [freshUser, paymentData] = await Promise.all([
        api.me().catch(() => null),
        api.getUserPayments(userId),
      ]);

      if (freshUser) {
        const nextUser = {
          ...freshUser,
          phoneNumber: freshUser.phoneNumber ?? freshUser.phone,
        };
        setCurrentUser(nextUser);
        localStorage.setItem('currentUser', JSON.stringify(nextUser));
      }

      setTransactions(paymentData.payments || []);
    } catch (_error) {
    } finally {
      if (!silent && isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    const labels = {
      completed: 'সম্পন্ন',
      pending: 'অপেক্ষমাণ',
      failed: 'ব্যর্থ'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleCopy = async (text: string, id: string, type: 'user' | 'pass') => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField({ id, type });
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      alert('কপি করতে সমস্যা হয়েছে। অনুগ্রহ করে ম্যানুয়ালি কপি করুন।');
    }
  };

  if (!currentUser) {
    return null;
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transactions.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
                aria-label="ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-gray-900 leading-tight">আমার প্রোফাইল</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs">{currentUser.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 bg-red-100 hover:bg-red-200 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-red-500 shrink-0"
              aria-label="লগআউট"
            >
              <LogOut className="w-4 h-4 text-red-700" />
              <span className="text-sm font-medium text-red-700 hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-pink-600" />
            ব্যবহারকারীর তথ্য
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
              <User className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-xs text-slate-500">নাম</p>
                <p className="font-medium text-slate-900">{currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Phone className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-slate-500">ফোন নম্বর</p>
                <p className="font-medium text-slate-900">{currentUser.phoneNumber ?? currentUser.phone}</p>
              </div>
            </div>
          </div>

          {currentUser.assignedVouchers && currentUser.assignedVouchers.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">আপনার বরাদ্দকৃত Voucher</h3>
              <div className="space-y-3">
                {currentUser.assignedVouchers.map((voucher: any) => (
                  <div key={voucher.id} className="rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Package</p>
                        <p className="font-semibold text-emerald-900">{voucher.package?.name ?? voucher.packageId}</p>
                      </div>
                      <div className="text-sm text-emerald-800">
                        <span className="font-medium">User:</span> {voucher.username}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex-1 rounded-md bg-white border border-emerald-200 px-3 py-2 text-sm font-mono text-slate-900">
                        {voucher.password}
                      </div>
                      <button
                        onClick={() => handleCopy(voucher.password, voucher.id, 'pass')}
                        className="inline-flex items-center justify-center rounded-md border border-emerald-300 bg-white px-3 py-2 text-emerald-800 hover:bg-emerald-50"
                      >
                        {copiedField?.id === voucher.id && copiedField?.type === 'pass' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-pink-600" />
              আমার লেনদেনের ইতিহাস
            </h2>
            <p className="text-sm text-slate-500 mt-1">মোট {transactions.length} টি লেনদেন</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div>
              <p className="mt-4 text-gray-600">লেনদেন লোড হচ্ছে...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wifi className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">কোনো লেনদেন নেই</h3>
              <p className="text-gray-600 mb-6">আপনি এখনও কোনো প্যাকেজ কেনেননি</p>
              <button
                onClick={() => navigate('/')}
                className="bg-emerald-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-emerald-900 transition-colors"
              >
                প্যাকেজ দেখুন
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      প্যাকেজ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      পরিমাণ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      তারিখ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      স্ট্যাটাস
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5 text-pink-600" />
                          <span className="font-medium text-gray-900">{transaction.packageName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 font-semibold">৳{transaction.amount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.status === 'completed' && (transaction.voucherUsername || transaction.wifiPassword) ? (
                          <div className="space-y-2">
                            {transaction.voucherUsername && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 w-10">User:</span>
                                <code className="text-sm bg-gray-100 border border-gray-200 px-3 py-1.5 rounded font-mono text-gray-800 flex-1">
                                  {transaction.voucherUsername}
                                </code>
                                <button
                                  onClick={() => handleCopy(transaction.voucherUsername!, transaction.id, 'user')}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                  title="ইউজারনেম কপি করুন"
                                >
                                  {copiedField?.id === transaction.id && copiedField.type === 'user' ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-blue-600" />
                                  )}
                                </button>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 w-10">Pass:</span>
                              <code className="text-sm bg-green-50 border border-green-200 px-3 py-1.5 rounded font-mono text-green-800 flex-1">
                                {transaction.voucherPassword ?? transaction.wifiPassword}
                              </code>
                              <button
                                onClick={() => handleCopy(transaction.voucherPassword ?? transaction.wifiPassword!, transaction.id, 'pass')}
                                className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors border border-green-300"
                                title="পাসওয়ার্ড কপি করুন"
                              >
                                {copiedField?.id === transaction.id && copiedField.type === 'pass' ? (
                                  <Check className="w-4 h-4 text-green-700" />
                                ) : (
                                  <Copy className="w-4 h-4 text-green-700" />
                                )}
                              </button>
                            </div>

                            {/* Voucher issue timestamp for security */}
                            {transaction.approvedAt && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 bg-emerald-50 rounded-md px-2 py-1 border border-emerald-200">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="font-medium">ইস্যু: {formatBanglaDateTime(transaction.approvedAt, '—')}</span>
                              </div>
                            )}
                          </div>
                        ) : transaction.status === 'completed' ? (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Key className="w-4 h-4" />
                            WiFi Password আসবে
                          </span>
                        ) : transaction.status === 'pending' ? (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            পেমেন্ট যাচাইয়ের অপেক্ষায়
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 ">আবার চেষ্টা করুন</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {transaction.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {transactions.length > itemsPerPage && (
          <div className="mt-4 flex justify-center">
            <nav className="inline-flex -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className={`px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                disabled={currentPage === 1}
              >
                পূর্ববর্তী
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${currentPage === index + 1 ? 'bg-gray-100 text-gray-700' : ''}`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className={`px-3 py-2 mr-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                disabled={currentPage === totalPages}
              >
                পরবর্তী
              </button>
            </nav>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="w-full md:w-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all text-left"
          >
            <Wifi className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-1">নতুন প্যাকেজ কিনুন</h3>
            <p className="text-sm text-pink-100">WiFi প্যাকেজ দেখুন এবং রিচার্জ করুন</p>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p className="mb-2">© ২০২৬ WiFi রিচার্জ সেন্টার। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
