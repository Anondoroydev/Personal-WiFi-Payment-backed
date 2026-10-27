import { CheckCircle, Clock, XCircle, Calendar, Phone, Hash, User, Wifi, Key, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction } from '../pages/Home';
import { copyToClipboard } from '../utils/clipboard';
import { useState } from 'react';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'সম্পন্ন';
      case 'pending':
        return 'অপেক্ষমান';
      case 'failed':
        return 'ব্যর্থ';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  const handleCopyPassword = async (password: string) => {
    const success = await copyToClipboard(password);
    if (success) {
      alert('Password কপি হয়েছে!');
    } else {
      alert('Password কপি করতে সমস্যা হয়েছে।');
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">কোনো লেনদেন নেই</h3>
        <p className="text-gray-600">আপনার লেনদেনের ইতিহাস এখানে প্রদর্শিত হবে</p>
      </div>
    );
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">লেনদেনের ইতিহাস</h2>
        <p className="text-gray-600">মোট {transactions.length}টি লেনদেন</p>
      </div>

      <div className="space-y-4">
        {currentItems.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {transaction.packageName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{transaction.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {getStatusText(transaction.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">নাম</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ফোন নম্বর</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ট্রানজাকশন আইডি</p>
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {transaction.transactionId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">৳</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">টাকার পরিমাণ</p>
                    <p className="text-lg font-bold text-gray-900">৳{transaction.amount}</p>
                  </div>
                </div>
              </div>
            </div>

            {transaction.status === 'completed' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-t border-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 mb-3">
                      ✓ পেমেন্ট সফলভাবে সম্পন্ন হয়েছে
                    </p>
                    {(transaction.voucherUsername || transaction.wifiPassword) ? (
                      <div className="space-y-3">
                        {transaction.voucherUsername && (
                          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-green-100">
                            <span className="text-sm font-bold text-gray-600 w-16">User:</span>
                            <code className="text-sm font-mono font-bold text-gray-900 flex-1">{transaction.voucherUsername}</code>
                            <button
                              onClick={() => handleCopyPassword(transaction.voucherUsername!)}
                              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                              title="ইউজারনেম কপি করুন"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-green-100">
                          <span className="text-sm font-bold text-gray-600 w-16">Pass:</span>
                          <code className="text-sm font-mono font-bold text-green-700 flex-1">{transaction.voucherPassword ?? transaction.wifiPassword}</code>
                          <button
                            onClick={() => handleCopyPassword(transaction.voucherPassword ?? transaction.wifiPassword!)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                            title="পাসওয়ার্ড কপি করুন"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">
                        আপনার account থেকে login করে প্রোফাইল পেজে WiFi Password পাবেন
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {transaction.status === 'pending' && (
              <div className="bg-yellow-50 px-6 py-3 border-t border-yellow-100">
                <p className="text-sm text-yellow-800">
                  ⏳ আপনার পেমেন্ট যাচাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...
                </p>
              </div>
            )}

            {transaction.status === 'failed' && (
              <div className="bg-red-50 px-6 py-3 border-t border-red-100">
                <p className="text-sm text-red-800">
                  ✗ পেমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {transactions.length > itemsPerPage && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">পূর্ববর্তী</span>
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                  currentPage === index + 1
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-sm font-medium">পরবর্তী</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}