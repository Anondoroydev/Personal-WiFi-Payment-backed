import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Key, Lock, Phone } from 'lucide-react';
import { ApiError, api } from '../services/api';

const GENERIC_SENT_MESSAGE = 'অ্যাকাউন্ট থাকলে, সেটির email-এ reset code পাঠানো হয়েছে।';
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'send' | 'resend' | 'verify' | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [attemptsExceeded, setAttemptsExceeded] = useState(false);

  useEffect(() => {
    if (resendSeconds === 0) return;

    const timer = window.setTimeout(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const sendCode = async (action: 'send' | 'resend') => {
    setError('');
    setLoading(action);
    try {
      await api.requestPasswordReset(phoneNumber);
      setStep('reset');
      setCode('');
      setAttemptsExceeded(false);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setError(GENERIC_SENT_MESSAGE);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'কোড পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(null);
    }
  };

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^01\d{9}$/.test(phoneNumber)) {
      setError('সঠিক ১১ সংখ্যার ফোন নম্বর দিন (01XXXXXXXXX)।');
      return;
    }
    await sendCode('send');
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(code)) {
      setError('৬ সংখ্যার OTP code দিন।');
      return;
    }
    if (newPassword.length < 6) {
      setError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading('verify');
    try {
      const result = await api.verifyPasswordReset(phoneNumber, code, newPassword);
      toast.success(result.message);
      navigate('/login', { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 429) {
        setAttemptsExceeded(true);
        setError(`${requestError.message} সর্বোচ্চ ৫ বার code যাচাই করা যায়। আবার code পেতে “Resend code” চাপুন।`);
      } else {
        setError(requestError instanceof Error ? requestError.message : 'পাসওয়ার্ড রিসেট করা যায়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>লগইন পেজে ফিরে যান</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 bg-gradient-to-br from-pink-500 to-purple-600 text-white text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'phone' ? <Key className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
            </div>
            <h1 className="text-2xl font-bold mb-2">পাসওয়ার্ড রিসেট</h1>
            <p className="text-pink-100">
              {step === 'phone' ? 'আপনার ফোন নম্বর দিন' : 'Email-এ পাঠানো code ও নতুন পাসওয়ার্ড দিন'}
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="p-8">
              {error && (
                <div role="alert" className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
                    onChange={(event) => {
                      setPhoneNumber(event.target.value);
                      setError('');
                    }}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    maxLength={11}
                    pattern="01[0-9]{9}"
                    aria-describedby="phone-help"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p id="phone-help" className="mt-2 text-xs text-gray-500">
                  আপনার account-এর সাথে যুক্ত ফোন নম্বরটি দিন।
                </p>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'send' ? 'Code পাঠানো হচ্ছে...' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="p-8">
              {error && (
                <div
                  role="alert"
                  className={`mb-6 rounded-lg border p-4 ${
                    error === GENERIC_SENT_MESSAGE
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p className={`text-sm ${error === GENERIC_SENT_MESSAGE ? 'text-green-800' : 'text-red-800'}`}>
                    {error}
                  </p>
                </div>
              )}

              <p className="mb-5 text-sm text-gray-600">
                {phoneNumber} নম্বরের account-এর email-এ code পাঠানো হয়েছে। Code ১০ মিনিটের মধ্যে ব্যবহার করুন।
              </p>

              <div className="mb-6">
                <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                  ৬ সংখ্যার OTP code
                </label>
                <input
                  type="text"
                  id="resetCode"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  aria-describedby="code-help"
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 tracking-[0.3em] focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p id="code-help" className="mt-2 text-xs text-gray-500">
                  সর্বোচ্চ ৫ বার code যাচাই করা যাবে।
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  নতুন পাসওয়ার্ড
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setError('');
                    }}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || attemptsExceeded}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'verify' ? 'যাচাই করা হচ্ছে...' : 'পাসওয়ার্ড রিসেট করুন'}
              </button>

              <button
                type="button"
                onClick={() => void sendCode('resend')}
                disabled={busy || resendSeconds > 0}
                className="w-full mt-3 text-purple-700 hover:text-purple-800 font-medium transition-colors py-2 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading === 'resend'
                  ? 'নতুন code পাঠানো হচ্ছে...'
                  : resendSeconds > 0
                    ? `Resend code (${resendSeconds}s)`
                    : 'Resend code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
                disabled={busy}
                className="w-full mt-1 text-gray-600 hover:text-gray-900 font-medium transition-colors py-2 disabled:opacity-50"
              >
                ফোন নম্বর পরিবর্তন করুন
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
