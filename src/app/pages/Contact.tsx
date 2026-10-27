import { Phone, Mail, MapPin, MessageCircle, Clock, Headphones, Home as HomeIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText('01826339098');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          হোমে ফিরে যান
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 mb-3">যোগাযোগ করুন</h1>
          <p className="text-base sm:text-lg text-slate-600">আমরা সবসময় আপনার সেবায় প্রস্তুত</p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-10">
          {/* Phone Support Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-7 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center mr-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">সাপোর্ট নাম্বার</h2>
            </div>
            
            <div className="space-y-4">
              <div 
                onClick={copyPhoneNumber}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 rounded-md cursor-pointer transition-colors hover:from-blue-600 hover:to-indigo-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">কল করুন বা SMS পাঠান</p>
                    <p className="text-3xl font-bold tracking-wide">০১৮২৬৩৩৯০৯৮</p>
                  </div>
                  <Phone className="w-10 h-10" />
                </div>
              </div>
              
              {copied && (
                <div className="bg-green-50 border border-green-500 text-green-700 px-4 py-3 rounded-md text-center font-medium">
                  ✅ নাম্বার কপি হয়েছে!
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-gray-700 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-semibold">সেবার সময়:</span> সকাল ৯টা - রাত ১০টা (প্রতিদিন)
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp/Messaging Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-7 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md flex items-center justify-center mr-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">মেসেজিং সাপোর্ট</h2>
            </div>
            
            <div className="space-y-4">
              <a 
                href="https://wa.me/8801826339098"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-md transition-colors hover:from-green-600 hover:to-emerald-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">হোয়াটসঅ্যাপে মেসেজ করুন</p>
                    <p className="text-2xl font-bold">WhatsApp Chat</p>
                  </div>
                  <MessageCircle className="w-10 h-10" />
                </div>
              </a>

              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">📱 দ্রুত সাহায্যের জন্য</span> হোয়াটসঅ্যাপে মেসেজ করুন। আমরা ১৫ মিনিটের মধ্যে রিপ্লাই দেওয়ার চেষ্টা করি।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-lg border border-slate-200 p-5 text-center">
            <div className="w-11 h-11 bg-blue-100 rounded-md flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">দ্রুত সমাধান</h3>
            <p className="text-sm text-gray-600">গড়ে ১৫ মিনিটে সমাধান</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 text-center">
            <div className="w-11 h-11 bg-green-100 rounded-md flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">২৪/৭ সাপোর্ট</h3>
            <p className="text-sm text-gray-600">সকাল ৯টা থেকে রাত ১০টা</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 text-center">
            <div className="w-11 h-11 bg-purple-100 rounded-md flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">বন্ধুত্বপূর্ণ সেবা</h3>
            <p className="text-sm text-gray-600">বাংলায় সম্পূর্ণ সাপোর্ট</p>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-5">সাধারণ সমস্যা ও সমাধান</h2>
          
          <div className="space-y-4">
            <div className="border-l-2 border-blue-500 bg-blue-50 p-4 rounded-r-md">
              <h3 className="font-bold text-gray-900 mb-2">❓ পেমেন্ট করার পরেও ইন্টারনেট চালু হচ্ছে না?</h3>
              <p className="text-sm text-gray-700">অ্যাডমিন পেমেন্ট অনুমোদন করলে ১৫ মিনিটের মধ্যে ইন্টারনেট চালু হবে। সমস্যা হলে সাপোর্ট নম্বরে যোগাযোগ করুন।</p>
            </div>

            <div className="border-l-2 border-green-500 bg-green-50 p-4 rounded-r-md">
              <h3 className="font-bold text-gray-900 mb-2">❓ ইন্টারনেট স্পীড কম আসছে?</h3>
              <p className="text-sm text-gray-700">রাউটার রিস্টার্ট করুন। সমস্যা থাকলে সাপোর্ট নাম্বারে কল করুন।</p>
            </div>

            <div className="border-l-2 border-purple-500 bg-purple-50 p-4 rounded-r-md">
              <h3 className="font-bold text-gray-900 mb-2">❓ MAC Address কিভাবে খুঁজে পাবো?</h3>
              <p className="text-sm text-gray-700">Settings → About Phone → Status → WiFi MAC Address</p>
            </div>

            <div className="border-l-2 border-orange-500 bg-orange-50 p-4 rounded-r-md">
              <h3 className="font-bold text-gray-900 mb-2">❓ bKash পেমেন্ট করতে সমস্যা হচ্ছে?</h3>
              <p className="text-sm text-gray-700">Send Money করুন এই নাম্বারে: 01826339098। Transaction ID সংরক্ষণ করুন।</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">জরুরি সেবা</h2>
          <p className="text-lg mb-4">যেকোনো জরুরি সমস্যার জন্য সরাসরি কল করুন</p>
          <a 
            href="tel:01826339098"
            className="inline-block bg-white text-red-600 font-bold px-7 py-3 rounded-md transition-colors hover:bg-gray-100 text-lg"
          >
            📞 ০১৮২৬৩৩৯০৯৮
          </a>
        </div>
      </div>
    </div>
  );
}