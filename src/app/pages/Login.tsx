import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ArrowLeft, Wifi, UserPlus } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordResetHelp, setShowPasswordResetHelp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('adminPhone');

      // Try admin login first (more reliable on some deployments), then fall back to user login.
      try {
        const adminRes = await api.adminLogin(phoneNumber, password);
        localStorage.setItem('adminToken', adminRes.token);
        localStorage.setItem('adminUser', JSON.stringify(adminRes.user));
        window.dispatchEvent(new Event('storage'));
        navigate('/admin/dashboard', { replace: true });
      } catch (adminErr) {
        // Admin login failed — attempt normal user login
        const data = await api.userLogin(phoneNumber, password);
        if (data.user.role === 'ADMIN') {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminUser', JSON.stringify(data.user));
          window.dispatchEvent(new Event('storage'));
          navigate('/admin/dashboard', { replace: true });
        } else {
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          window.dispatchEvent(new Event('storage'));
          navigate('/user/profile', { replace: true });
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'লগইন করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>হোম পেজে ফিরে যান</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-pink-500 to-purple-600 text-white text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              লগইন করুন
            </h1>
            <p className="text-pink-100">
              আপনার অ্যাকাউন্টে প্রবেশ করুন
            </p>
          </div>

          {/* Login Form */}
            <form onSubmit={handleLogin} className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                ফোন নম্বর
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="০১৭XXXXXXXX"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPasswordResetHelp((show) => !show)}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              {showPasswordResetHelp && (
                <p role="status" className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                  পাসওয়ার্ড রিসেট করতে{' '}
                  <a href="tel:01826339098" className="font-semibold underline hover:text-purple-900">
                    01826339098
                  </a>{' '}
                  নম্বরে যোগাযোগ করুন।
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>

            {/* Register Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/user/signup')}
                className="flex items-center justify-center gap-2 w-full text-purple-600 hover:text-purple-700 font-medium transition-colors py-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>নতুন একাউন্ট তৈরি করুন</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}