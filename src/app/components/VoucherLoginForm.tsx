import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Key, User, ArrowRight, ShieldCheck, Info, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { PENDING_VOUCHER_PAYMENT_KEY } from '../utils/events';

// Router login target and optional branding
const ROUTER_IP = (import.meta as any).env?.VITE_MIKROTIK_IP ?? 'http://10.10.10.1';
const SITE_LOGO = (import.meta as any).env?.VITE_SITE_LOGO ?? undefined;
const SITE_NAME = (import.meta as any).env?.VITE_SITE_NAME ?? undefined;

interface ApprovedVoucherPayment {
  id: string;
  status: string;
  voucherUsername?: string;
  voucherPassword?: string;
  wifiPassword?: string;
  packageName: string;
  createdAt?: string;
}

function getLatestApprovedVoucher(payments: ApprovedVoucherPayment[] | undefined) {
  return payments
    ?.filter(
      (payment) =>
        payment.status === 'completed' &&
        payment.voucherUsername &&
        (payment.voucherPassword || payment.wifiPassword),
    )
    .sort(
      (first, second) =>
        Date.parse(second.createdAt ?? '') - Date.parse(first.createdAt ?? ''),
    )[0];
}

export function VoucherLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [latestVoucher, setLatestVoucher] = useState<{ id: string; username: string; password: string; packageName: string } | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const credentialsEdited = useRef(false);

  useEffect(() => {
    let active = true;
    let checking = false;
    const checkApprovedVoucher = async () => {
      if (!localStorage.getItem('userToken')) return;
      if (checking) return;
      checking = true;
      try {
        const data = await api.getUserPayments();
        if (!active) return;

        const pendingPaymentId = localStorage.getItem(PENDING_VOUCHER_PAYMENT_KEY);
        const approvedPayments = data.payments as ApprovedVoucherPayment[] | undefined;
        const latestApproved = getLatestApprovedVoucher(approvedPayments);
        const approved =
          approvedPayments?.find((payment) => payment.id === pendingPaymentId && payment.status === 'completed') ??
          latestApproved;
        if (approved) {
          const voucherUsername = approved.voucherUsername;
          const voucherPassword = approved.voucherPassword || approved.wifiPassword;
          if (!voucherUsername || !voucherPassword) return;

          setLatestVoucher({
            id: approved.id,
            username: voucherUsername,
            password: voucherPassword,
            packageName: approved.packageName,
          });

          if (pendingPaymentId && pendingPaymentId === approved.id) {
            localStorage.removeItem(PENDING_VOUCHER_PAYMENT_KEY);
            credentialsEdited.current = false;
            setUsername(voucherUsername);
            setPassword(voucherPassword);
            setConnectionMessage(
              'আপনার পেমেন্ট অনুমোদিত হয়েছে! এই একই ডিভাইস ও WiFi সংযোগের MAC ঠিক রেখেই ভাউচার দিয়ে স্বয়ংক্রিয়ভাবে কানেক্ট করা হচ্ছে।',
            );
            submitRouterLogin(voucherUsername, voucherPassword, '_self');
          } else if (!credentialsEdited.current) {
            setUsername(voucherUsername);
            setPassword(voucherPassword);
          }
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : 'ভাউচার লোড করা যায়নি। আবার চেষ্টা করুন।');
        }
      } finally {
        checking = false;
      }

    };

    void checkApprovedVoucher();
    const interval = window.setInterval(() => {
      void checkApprovedVoucher();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleAutoFill = async () => {
    if (!localStorage.getItem('userToken')) {
      toast.error('ভাউচার অটো-ফিল করার জন্য আগে লগইন করুন।');
      return;
    }

    setReloading(true);
    try {
      const data = await api.getUserPayments();
      const approved = getLatestApprovedVoucher(data.payments as ApprovedVoucherPayment[] | undefined);
      const voucherUsername = approved?.voucherUsername;
      const voucherPassword = approved?.voucherPassword || approved?.wifiPassword;

      if (!approved || !voucherUsername || !voucherPassword) {
        setLatestVoucher(null);
        toast.info('কোনো অনুমোদিত ভাউচার পাওয়া যায়নি।');
        return;
      }

      setLatestVoucher({
        id: approved.id,
        username: voucherUsername,
        password: voucherPassword,
        packageName: approved.packageName,
      });
      credentialsEdited.current = false;
      setUsername(voucherUsername);
      setPassword(voucherPassword);
      toast.success('সর্বশেষ অনুমোদিত ভাউচার বসানো হয়েছে।');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ভাউচার লোড করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setReloading(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error('প্রথমে লগইন করুন');
        setReloading(false);
        return;
      }
      const data = await api.getUserPayments();
      const approved = getLatestApprovedVoucher(data.payments as ApprovedVoucherPayment[] | undefined);
      const voucherUsername = approved?.voucherUsername;
      const voucherPassword = approved?.voucherPassword || approved?.wifiPassword;
      if (voucherUsername && voucherPassword) {
        setLatestVoucher({ id: approved.id, username: voucherUsername, password: voucherPassword, packageName: approved.packageName });
        if (!credentialsEdited.current) {
          setUsername(voucherUsername);
          setPassword(voucherPassword);
        }
        toast.success('সর্বশেষ ভাউচার আপডেট হয়েছে');
      } else {
        setLatestVoucher(null);
        toast.info('কোনো অনুমোদিত ভাউচার পাওয়া যায়নি');
      }
    } catch (err) {
      toast.error('ভুল: ভাউচার লোড করা যায়নি');
    } finally {
      setReloading(false);
    }
  };

  const submitRouterLogin = (loginUsername: string, loginPassword: string, target: '_blank' | '_self') => {
    setLoading(true);
    window.setTimeout(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${ROUTER_IP}/login`;
      form.target = target;

      const usernameInput = document.createElement('input');
      usernameInput.type = 'hidden';
      usernameInput.name = 'username';
      usernameInput.value = loginUsername;

      const passwordInput = document.createElement('input');
      passwordInput.type = 'hidden';
      passwordInput.name = 'password';
      passwordInput.value = loginPassword;

      form.append(usernameInput, passwordInput);
      document.body.appendChild(form);
      try {
        setLoading(false);
        form.submit();
        if (target === '_blank') {
          window.setTimeout(() => form.remove(), 1000);
        }
      } catch (error) {
        form.remove();
        setLoading(false);
        toast.error(error instanceof Error ? error.message : 'রাউটারে কানেক্ট করা যায়নি। আবার চেষ্টা করুন।');
      }
    }, target === '_self' ? 1200 : 450);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('ইউজারনেম ও পাসওয়ার্ড দিন');
      return;
    }

    toast.success('রাউটারে লগইন পাঠানো হচ্ছে');
    submitRouterLogin(username, password, '_blank');
  };

  // Redesigned hero + card layout: unique, modern, and mobile-first
  return (
    <section aria-labelledby="voucher-login" className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 bg-slate-50 py-8">
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left: Decorative panel (illustration + benefits) */}
        <aside className="hidden md:flex md:col-span-5 md:order-1 items-center">
          <div className="w-full rounded-3xl bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                  <Wifi className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <h2 id="voucher-login" className="text-xl sm:text-2xl font-bold">দ্রুত ও নিরাপদ কানেক্ট</h2>
                <p className="mt-2 text-sm text-white/90">ভাউচার ব্যবহার করে মেকানিক্যাল কাজ ছাড়া অনায়াসে ইন্টারনেট চালু করুন।</p>

                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded bg-white/10"> <Zap className="w-4 h-4 text-white" /> </span> দ্রুত কনেক্ট</li>
                  <li className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded bg-white/10"> <ShieldCheck className="w-4 h-4 text-white" /> </span> নিরাপদ ও ভেরিফাইড</li>
                  <li className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded bg-white/10"> <Info className="w-4 h-4 text-white" /> </span> প্যাকেজ ভিত্তিক ভাউচার</li>
                </ul>

                <div className="mt-6 flex gap-3">
                  <button onClick={handleAutoFill} type="button" className="inline-flex items-center gap-2 bg-white text-indigo-700 px-3 py-2 rounded-lg text-sm font-semibold">
                    Auto Fill
                  </button>

                  <button onClick={handleReload} disabled={reloading} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                    <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} /> <span>Reload</span>
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-3 text-sm text-white/80">
                  {SITE_LOGO ? <img src={SITE_LOGO} alt={SITE_NAME ?? 'Logo'} className="w-8 h-8 object-contain rounded" /> : <div className="px-2 py-1 bg-white/10 rounded">{SITE_NAME ?? document.title ?? 'WiFi Provider'}</div>}
                  <span className="font-medium">{SITE_NAME ?? 'Your Brand'}</span>
                </div>
              </div>
            </div>

            {/* soft background shapes */}
            <svg className="hidden sm:block absolute -right-10 -top-10 opacity-10" width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="10" y="10" width="200" height="200" rx="40" fill="white" opacity="0.03" />
            </svg>
          </div>
        </aside>

        {/* Right: Elevated card with compact, clear form */}
        <div className="md:col-span-7 order-1 md:order-2 flex items-center justify-center">
          <div className="w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mx-auto max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow">
                  <Wifi className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">ভাউচার লগইন</h3>
                  <p className="text-sm text-slate-500">ভাউচার ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs text-slate-400">Protected</span>
                <span className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded text-xs text-slate-500">
                  <Key className="w-3 h-3" /> Router
                </span>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              {connectionMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {connectionMessage}
                </div>
              )}
              {/* Mobile compact header: shown only on phones for quick actions */}
              <div className="md:hidden flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  {SITE_LOGO ? <img src={SITE_LOGO} alt={SITE_NAME ?? 'Logo'} className="w-8 h-8 object-contain rounded" /> : <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-sm">Wi</div>}
                  <div>
                    <div className="text-sm font-medium">{SITE_NAME ?? 'WiFi'}</div>
                    <div className="text-xs text-slate-400">ভাউচার লগইন</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleAutoFill} type="button" disabled={reloading} className="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 rounded text-sm disabled:opacity-50">
                    {reloading ? 'লোড হচ্ছে...' : 'Auto'}
                  </button>
                  <button onClick={handleReload} disabled={reloading} className="inline-flex items-center gap-2 bg-slate-50 px-3 py-2 rounded text-sm">
                    <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-12">
                  <label htmlFor="voucher-username" className="block text-xs font-medium text-slate-600 mb-2">ইউজারনেম</label>
                  <div className="relative">
                    <input id="voucher-username" value={username} onChange={(e) => { credentialsEdited.current = true; setUsername(e.target.value); }} className="w-full rounded-xl border border-slate-200 px-4 py-4 sm:py-3 text-base sm:text-lg font-mono placeholder-slate-400 focus:ring-2 focus:ring-sky-200" placeholder="e.g. user_123" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4 h-4" /></div>
                  </div>
                </div>

                <div className="sm:col-span-12">
                  <label htmlFor="voucher-password" className="block text-xs font-medium text-slate-600 mb-2">পাসওয়ার্ড</label>
                  <div className="relative">
                    <input id="voucher-password" type="password" value={password} onChange={(e) => { credentialsEdited.current = true; setPassword(e.target.value); }} className="w-full rounded-xl border border-slate-200 px-4 py-4 sm:py-3 text-base sm:text-lg font-mono placeholder-slate-400 focus:ring-2 focus:ring-sky-200" placeholder="••••••" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Key className="w-4 h-4" /></div>
                  </div>
                </div>

                <div className="sm:col-span-12 flex flex-col sm:flex-row gap-3 mt-2">
                  <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl py-4 sm:py-3 text-base sm:text-lg font-semibold shadow-md">
                    {loading ? (<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path></svg>) : (<><span>কানেক্ট করুন</span><ArrowRight className="w-4 h-4" /></>) }
                  </button>

                  <button type="button" onClick={handleReload} disabled={reloading} className="w-full sm:inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm justify-center sm:w-auto">
                    <RefreshCw className={`w-5 h-5 ${reloading ? 'animate-spin' : ''}`} />
                    <span>Reload</span>
                  </button>
                </div>

                <div className="sm:col-span-12 flex items-center gap-3 text-sm text-slate-600 mt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>নিরাপদ ও ভেরিফাইড লগইন</span>
                </div>

                {/* small helper row with latest voucher info */}
                <div className="sm:col-span-12 mt-4 text-sm text-slate-500 hidden sm:block">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      {latestVoucher ? (
                        <>
                          <div className="text-sm font-medium">সর্বশেষ ভাউচার: <span className="font-mono">{latestVoucher.username}</span></div>
                          <div className="text-xs text-slate-400">প্যাকেজ: {latestVoucher.packageName}</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400">সর্বশেষ অনুমোদিত ভাউচার দেখতে Auto Fill চাপুন</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleAutoFill} type="button" disabled={reloading} className="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 rounded text-sm disabled:opacity-50">
                        {reloading ? 'লোড হচ্ছে...' : 'Auto Fill'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
