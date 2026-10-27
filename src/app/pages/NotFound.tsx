import { useNavigate } from 'react-router-dom';
import { Home, Wifi, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full text-center">
        <div className="mb-5">
          <h1 className="text-8xl sm:text-9xl font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-none tabular-nums">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-9 mb-5">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              পেজ খুঁজে পাওয়া যায়নি!
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-2">
              দুঃখিত, আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।
            </p>
            <p className="text-sm text-slate-500">
              সম্ভবত পেজটি সরানো হয়েছে বা মুছে ফেলা হয়েছে।
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-md flex items-center justify-center">
              <Wifi className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-md flex items-center justify-center">
              <Search className="w-6 h-6 text-amber-700" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-purple-700 border border-purple-300 rounded-md font-medium transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              পেছনে যান
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-md font-semibold transition-all text-sm sm:text-base"
            >
              <Home className="w-5 h-5" />
              হোমপেজে যান
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200 p-5">
          <p className="text-sm sm:text-base text-slate-700 mb-2">
            <strong className="text-purple-700">সাহায্য প্রয়োজন?</strong>
          </p>
          <p className="text-sm text-slate-600 mb-4">
            যেকোনো সমস্যার জন্য আমাদের সাথে যোগাযোগ করুন
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => navigator.clipboard.writeText('01826339098')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm font-semibold"
            >
              📞 ০১৮২৬৩৩৯০৯৮
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all text-sm font-semibold"
            >
              যোগাযোগ পেজ →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
