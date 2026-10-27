import { useState } from 'react';
import { ArrowLeft, Smartphone, Hash, User, Wifi, Copy, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { WiFiPackage } from '../pages/Home';

interface PaymentFormProps {
  package: WiFiPackage;
  onSubmit: (name: string, macAddress: string, phoneNumber: string, transactionId: string, paymentMethod: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

export function PaymentForm({ package: pkg, onSubmit, onCancel, loading = false }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [errors, setErrors] = useState<{ name?: string; mac?: string; phone?: string; txn?: string }>({});
  const [copied, setCopied] = useState(false);

  const BKASH_NUMBER = '01826339098';
  const NAGAD_NUMBER = '01826339098';
  const ROCKET_NUMBER = '01826339098';

  const copyNumber = () => {
    const number = paymentMethod === 'bkash' ? BKASH_NUMBER : paymentMethod === 'nagad' ? NAGAD_NUMBER : ROCKET_NUMBER;
    try {
      const textArea = document.createElement('textarea');
      textArea.value = number;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; mac?: string; phone?: string; txn?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'নাম প্রয়োজন';
    } else if (name.trim().length < 2) {
      newErrors.name = 'নাম কমপক্ষে ২ অক্ষরের হতে হবে';
    }

    if (!phoneNumber) {
      newErrors.phone = 'ফোন নম্বর প্রয়োজন';
    } else if (!/^01[3-9]\d{8}$/.test(phoneNumber)) {
      newErrors.phone = 'সঠিক বাংলাদেশী ফোন নম্বর দিন (০১XXXXXXXXX)';
    }

    if (!transactionId) {
      newErrors.txn = 'ট্রানজাকশন আইডি প্রয়োজন';
    } else if (transactionId.length < 6) {
      newErrors.txn = 'ট্রানজাকশন আইডি কমপক্ষে ৬ অক্ষরের হতে হবে';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(name.trim(), "N/A", phoneNumber, transactionId, paymentMethod);
    }
  };

  const bkashTheme = {
    primary: 'from-pink-600 to-pink-500',
    secondary: 'bg-pink-500',
    text: 'text-pink-600',
    border: 'border-pink-500',
    hover: 'hover:bg-pink-600',
    light: 'bg-pink-50',
    lightBorder: 'border-pink-200',
  };

  const nagadTheme = {
    primary: 'from-orange-600 to-orange-500',
    secondary: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-500',
    hover: 'hover:bg-orange-600',
    light: 'bg-orange-50',
    lightBorder: 'border-orange-200',
  };

  const rocketTheme = {
    primary: 'from-purple-600 to-purple-500',
    secondary: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-500',
    hover: 'hover:bg-purple-600',
    light: 'bg-purple-50',
    lightBorder: 'border-purple-200',
  };

  const theme = paymentMethod === 'bkash' ? bkashTheme : paymentMethod === 'nagad' ? nagadTheme : rocketTheme;
  const currentNumber = paymentMethod === 'bkash' ? BKASH_NUMBER : paymentMethod === 'nagad' ? NAGAD_NUMBER : ROCKET_NUMBER;
  const methodTitle = paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-950 mb-5 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>ফিরে যান</span>
      </button>

      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Side - Payment Method Selection & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-900">পেমেন্ট মেথড নির্বাচন করুন</h3>
              
              <div className="space-y-3">
                {/* bKash Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-black text-sm">bKash</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">bKash</div>
                      <div className="text-xs text-gray-500">সেন্ড মানি</div>
                    </div>
                  </div>
                  {paymentMethod === 'bkash' && (
                    <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {/* Nagad Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-black text-sm">Nagad</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Nagad</div>
                      <div className="text-xs text-gray-500">সেন্ড মানি</div>
                    </div>
                  </div>
                  {paymentMethod === 'nagad' && (
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {/* Rocket Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('rocket')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'rocket'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-700 rounded-md flex items-center justify-center">
                      <span className="text-white font-black text-sm">Rocket</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Rocket</div>
                      <div className="text-xs text-gray-500">সেন্ড মানি</div>
                    </div>
                  </div>
                  {paymentMethod === 'rocket' && (
                    <div className="w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Package Summary */}
          <div className={`bg-gradient-to-br ${theme.primary} rounded-2xl shadow-lg p-6 text-white`}>
            <h3 className="text-sm opacity-90 mb-2">নির্বাচিত প্যাকেজ</h3>
            <h2 className="text-2xl font-black mb-4">{pkg.name}</h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-90">স্পিড</span>
                <span className="font-bold">{pkg.speed}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-90">মেয়াদ</span>
                <span className="font-bold">{pkg.duration}</span>
              </div>
              <div className="border-t border-white/30 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">মোট টাকা</span>
                  <span className="text-3xl font-black">৳{pkg.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className={`${theme.light} border ${theme.lightBorder} rounded-2xl p-5`}>
            <div className="flex gap-3 mb-3">
              <AlertCircle className={`w-5 h-5 ${theme.text} flex-shrink-0 mt-0.5`} />
              <h4 className={`font-bold ${theme.text}`}>পেমেন্ট করার নিয়ম</h4>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-8">
              <li>{methodTitle} অ্যাপ খুলুন</li>
              <li>"সেন্ড মানি" অপশনে যান</li>
              <li>নিচের নম্বরে ৳{pkg.price} টাকা পাঠান</li>
              <li>ট্রানজাকশন আইডি নোট করুন</li>
              <li>ফর্মটি পূরণ করে সাবমিট করুন</li>
            </ol>
          </div>

        </div>

        {/* Right Side - Payment Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Form Header */}
            <div className={`bg-gradient-to-br ${theme.primary} p-6 text-white`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center">
                  <span className="font-black text-xl">{paymentMethod === 'bkash' ? 'bK' : paymentMethod === 'nagad' ? 'N' : 'R'}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black">{methodTitle} পেমেন্ট</h2>
                  <p className="text-sm opacity-90">তথ্য দিয়ে নিশ্চিত করুন</p>
                </div>
              </div>

              {/* Number Display with Copy */}
              <div className="bg-white/10 rounded-md p-4 border border-white/20">
                <p className="text-xs opacity-90 mb-1">
                  {methodTitle} নম্বর
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-black tracking-wide">{currentNumber}</span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  আপনার নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="আপনার পুরো নাম লিখুন"
                    className={`block w-full pl-12 pr-4 py-3 border ${
                      errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    } rounded-md focus:ring-2 focus:ring-${paymentMethod === 'bkash' ? 'pink' : paymentMethod === 'nagad' ? 'orange' : 'purple'}-500 focus:border-transparent transition-all text-base`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Phone Number Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  আপনার {methodTitle} নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={`block w-full pl-12 pr-4 py-3 border ${
                      errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    } rounded-md focus:ring-2 focus:ring-${paymentMethod === 'bkash' ? 'pink' : paymentMethod === 'nagad' ? 'orange' : 'purple'}-500 focus:border-transparent transition-all text-base`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Transaction ID Input */}
              <div>
                <label htmlFor="txnId" className="block text-sm font-semibold text-gray-700 mb-2">
                  {methodTitle} ট্রানজাকশন আইডি (TrxID) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="txnId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="8HK9L2M3N4"
                    className={`block w-full pl-12 pr-4 py-3 border ${
                      errors.txn ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    } rounded-md focus:ring-2 focus:ring-${paymentMethod === 'bkash' ? 'pink' : paymentMethod === 'nagad' ? 'orange' : 'purple'}-500 focus:border-transparent transition-all text-base font-mono uppercase`}
                  />
                </div>
                {errors.txn && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.txn}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  💡 পেমেন্ট সম্পন্ন হওয়ার পর SMS-এ ট্রানজাকশন আইডি পাবেন
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-base"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${theme.primary} text-white rounded-md font-bold ${theme.hover} transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path>
                      </svg>
                      <span>দয়া করে অপেক্ষা করুন...</span>
                    </>
                  ) : (
                    <>
                      <span>পেমেন্ট নিশ্চিত করুন</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Info Note */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>🔒 নিরাপদ পেমেন্ট:</strong> আপনার তথ্য সম্পূর্ণ সুরক্ষিত। পেমেন্ট যাচাই হতে ৫-১০ মিনিট সময় লাগতে পারে।
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}