import { CheckCircle, Download, Printer } from 'lucide-react';
import { Transaction } from '../pages/Home';

interface PaymentReceiptProps {
  transaction: Transaction;
  onClose: () => void;
}

export function PaymentReceipt({ transaction, onClose }: PaymentReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadScreenshot = () => {
    alert('এই স্ক্রিনটি Screenshot করে রাখুন (Windows: Win+Shift+S, Mobile: Power+Volume Down)');
  };

  const receiptId = `WIFI-${transaction.id.slice(-8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Receipt Content - Designed for Screenshot */}
        <div id="payment-receipt" className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-gray-300">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">পেমেন্ট রসিদ</h2>
            <p className="text-green-600 font-semibold text-lg">✓ সফলভাবে জমা হয়েছে</p>
            <p className="text-gray-500 text-sm mt-2">Receipt ID: {receiptId}</p>
          </div>

          {/* Payment Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">পেমেন্ট তথ্য</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm mb-1">নাম</p>
                  <p className="font-semibold text-gray-900">{transaction.name}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm mb-1">ফোন নম্বর</p>
                  <p className="font-semibold text-gray-900">{transaction.phoneNumber}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{transaction.paymentMethod ?? 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm mb-1">প্যাকেজ</p>
                  <p className="font-semibold text-gray-900">{transaction.packageName}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm mb-1">টাকা</p>
                  <p className="font-bold text-pink-600 text-xl">{transaction.amount} ৳</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm mb-1">সময়</p>
                  <p className="font-semibold text-gray-900 text-sm">{transaction.date}</p>
                </div>
              </div>
            </div>

            {/* Transaction ID - Most Important */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-yellow-900 font-bold">!</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-2">bKash ট্রানজাকশন আইডি</p>
                  <p className="font-mono text-lg font-bold text-pink-600 break-all bg-white px-3 py-2 rounded border border-yellow-300">
                    {transaction.transactionId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              অত্যন্ত গুরুত্বপূর্ণ
            </h4>
            <ul className="text-red-800 text-sm space-y-1">
              <li>✓ এই রসিদটি <strong>Screenshot</strong> করে সংরক্ষণ করুন</li>
              <li>✓ যদি আপনার ডাটা না পাওয়া যায়, এই রসিদ দিয়ে প্রমাণ করতে পারবেন</li>
              <li>✓ Receipt ID এবং Transaction ID অবশ্যই মনে রাখুন</li>
              <li>✓ Admin যাচাই করার পর WiFi সক্রিয় করবে (৫-১০ মিনিট)</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 rounded-xl p-4 text-center mb-6">
            <p className="text-blue-900 font-semibold mb-1">সমস্যা হলে যোগাযোগ করুন</p>
            <p className="text-blue-700 text-sm">bKash: <strong>01826339098</strong></p>
            <p className="text-blue-600 text-xs mt-2">এই Receipt ID উল্লেখ করুন: <strong>{receiptId}</strong></p>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-xs border-t pt-4">
            <p>WiFi রিচার্জ সেন্টার - আপনার পার্সোনাল WiFi সার্ভিস</p>
            <p className="mt-1">এই রসিদটি স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row gap-3 rounded-b-lg print:hidden">
          <button
            onClick={handleDownloadScreenshot}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all font-semibold"
          >
            <Download className="w-5 h-5" />
            Screenshot করুন
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-100 transition-all font-semibold"
          >
            <Printer className="w-5 h-5" />
            প্রিন্ট
          </button>
          
          <button
            onClick={onClose}
            className="sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-all font-semibold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payment-receipt, #payment-receipt * {
            visibility: visible;
          }
          #payment-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
