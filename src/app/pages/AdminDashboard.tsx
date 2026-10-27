import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, CheckCircle, XCircle, Clock, Phone, Hash, Calendar, RefreshCw, User, Wifi, Users, RotateCcw, Trash2, Key, X } from 'lucide-react';
import { api } from '../services/api';
import type { AdminUser } from '../services/api';
import { VoucherManagement } from '../components/VoucherManagement';
import { AnnouncementManagement } from '../components/AnnouncementManagement';
import { ApprovePaymentModal } from '../components/ApprovePaymentModal';
import { toast } from 'sonner';
import { subscribeToRealtimeEvents, notifyDataChanged } from '../utils/events';
import { formatBanglaDateTime } from '../utils/date';

interface Transaction {
  id: string;
  packageName: string;
  amount: number;
  name: string;
  phoneNumber: string;
  transactionId: string;
  paymentMethod?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  voucherUsername?: string;
  voucherPassword?: string;
  wifiPassword?: string;
  approvedAt?: string;
  [key: string]: unknown;
}

interface ConfiguredHotspotUser {
  username: string;
  disabled: boolean;
  profile: string;
  macAddress: string;
  limitUptime: string;
  comment: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [passwordResetUser, setPasswordResetUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [hotspotUsers, setHotspotUsers] = useState<any[]>([]);
  const [configuredHotspotUsers, setConfiguredHotspotUsers] = useState<ConfiguredHotspotUser[]>([]);
  const [hotspotSearch, setHotspotSearch] = useState('');
  const [expandedHotspotUsername, setExpandedHotspotUsername] = useState<string | null>(null);
  const [hotspotStatusUpdatingUsername, setHotspotStatusUpdatingUsername] = useState<string | null>(null);
  const [hotspotFetchedAt, setHotspotFetchedAt] = useState(Date.now());
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const hotspotRequestInFlight = useRef(false);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [activeSection, setActiveSection] = useState<'payments' | 'vouchers' | 'users' | 'announcements' | 'mac-reset'>('payments');
  const [macResetUsername, setMacResetUsername] = useState('');
  const [macResetInput, setMacResetInput] = useState('');
  const [disconnectAllSessions, setDisconnectAllSessions] = useState(true);
  const [macResetting, setMacResetting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Strictly require active admin session - redirect to login page if missing
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    loadTransactions();

    // Listen for real-time payments submitted from user side (same browser/device)
    const unsubscribe = subscribeToRealtimeEvents('payments', () => {
      loadTransactions(false);
    });

    // Silent polling for cross-device real-time sync (e.g. mobile admin vs laptop user)
    const interval = setInterval(() => {
      loadTransactions(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'User load failed');
    }
  };

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordResetError('');

    if (newPassword.length < 6) {
      setPasswordResetError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordResetError('পাসওয়ার্ড ও নিশ্চিতকরণ মিলছে না।');
      return;
    }
    if (!passwordResetUser) return;

    setResettingPassword(true);
    try {
      const result = await api.resetUserPassword(passwordResetUser.id, newPassword);
      toast.success(result.message);
      setPasswordResetUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordResetError(
        error instanceof Error ? error.message : 'পাসওয়ার্ড রিসেট করা যায়নি। আবার চেষ্টা করুন।',
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (user.role === 'ADMIN' || deletingUserId) return;

    const paymentCount = user._count?.payments ?? 0;
    const confirmed = window.confirm(
      `আপনি কি ${user.name} (${user.phone})-এর account মুছে ফেলতে চান?\n\n${paymentCount}টি payment history স্থায়ীভাবে মুছে যাবে। Assigned voucher records থাকবে, তবে user link বিচ্ছিন্ন হবে। RouterOS voucher credentials মুছবে না।`,
    );
    if (!confirmed) return;

    setDeletingUserId(user.id);
    try {
      await api.deleteUser(user.id);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
      await loadTransactions(false);
      toast.success('User account deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'User delete failed');
    } finally {
      setDeletingUserId(null);
    }
  };

  const loadHotspotUsers = async (showError = true) => {
    if (hotspotRequestInFlight.current) return;

    hotspotRequestInFlight.current = true;
    const requestedAt = Date.now();
    try {
      const data = await api.getActiveHotspotUsers();
      setHotspotUsers(data);
      setHotspotFetchedAt(requestedAt);
      setCountdownNow(Date.now());
    } catch (error) {
      if (showError) {
        toast.error(error instanceof Error ? error.message : 'Active hotspot user load failed');
      }
    } finally {
      hotspotRequestInFlight.current = false;
    }
  };

  const loadConfiguredHotspotUsers = async (showError = true) => {
    try {
      const data = await api.getHotspotUsers();
      setConfiguredHotspotUsers(data);
    } catch (error) {
      if (showError) {
        toast.error(error instanceof Error ? error.message : 'Hotspot user load failed');
      }
    }
  };

  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
      loadHotspotUsers();
      loadConfiguredHotspotUsers();
      const refreshInterval = setInterval(() => {
        void loadHotspotUsers(false);
        void loadConfiguredHotspotUsers(false);
      }, 10000);
      const countdownInterval = setInterval(() => {
        setCountdownNow(Date.now());
      }, 1000);
      return () => {
        clearInterval(refreshInterval);
        clearInterval(countdownInterval);
      };
    }
  }, [activeSection]);

  const handleHotspotUserStatus = async (username: string, enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    const warning = enabled
      ? `Enable Hotspot user ${username}? This restores Wi-Fi access for the same credentials.`
      : `Disable Hotspot user ${username}? This immediately disconnects all active Wi-Fi sessions. The account and credentials will remain on the router.`;
    if (!window.confirm(warning)) return;

    setHotspotStatusUpdatingUsername(username);
    try {
      const result = await api.setHotspotUserEnabled(username, enabled);
      await Promise.all([loadHotspotUsers(false), loadConfiguredHotspotUsers(false)]);
      if (enabled) {
        toast.success(`${username} enabled. Wi-Fi access is restored.`);
      } else {
        toast.success(`${username} disabled. Disconnected ${result.disconnectedSessions} active session(s).`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to ${action} Hotspot user`);
    } finally {
      setHotspotStatusUpdatingUsername(null);
    }
  };

  const loadTransactions = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await api.getPayments();
      if (Array.isArray(data.payments)) {
        setTransactions(data.payments);
      }
    } catch (_error) {
      if (showLoading) {
        toast.error('ডাটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, status: 'completed' | 'failed') => {
    try {
      if (status === 'completed') {
        setApproving(true);
        const result = await api.approvePayment(id);
        toast.success(
          `অনুমোদিত হয়েছে! Voucher: ${result.voucher.username} (Pass: ${result.voucher.password})`,
          { duration: 7000 },
        );
      } else {
        await api.rejectPayment(id);
        toast.error('পেমেন্ট প্রত্যাখ্যান করা হয়েছে', { duration: 4000 });
      }
      notifyDataChanged('payments');
      notifyDataChanged('vouchers');
      await loadTransactions(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'অজানা সমস্যা';
      if (msg.toLowerCase().includes('voucher') || msg.toLowerCase().includes('stock')) {
        toast.error('পর্যাপ্ত ভাউচার স্টক নেই! অনুগ্রহ করে "ভাউচার যুক্ত করুন" ট্যাবে গিয়ে ভাউচার যুক্ত করুন।', { duration: 6000 });
      } else {
        toast.error(`অনুমোদন ব্যর্থ: ${msg}`);
      }
    } finally {
      setApproving(false);
    }
  };

  const handleMacReset = async (username: string, disconnectAll: boolean) => {
    const sessionScope = disconnectAll ? 'all active sessions' : 'one active session';
    const confirmed = window.confirm(
      `Disconnect ${sessionScope} for ${username}? The account and credentials will remain unchanged.`,
    );
    if (!confirmed) return;

    setMacResetUsername(username);
    setMacResetting(true);
    try {
      const result = await api.resetHotspotMac(username, disconnectAll);
      if (result.activeSessions === 0) {
        toast.success('MAC restriction cleared. No active session was connected. Same voucher can now be used from another device.');
      } else {
        toast.success(`MAC restriction cleared; disconnected ${result.disconnectedSessions} active session(s). Reconnect using the same voucher.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'MikroTik reset failed');
    } finally {
      setMacResetting(false);
      setMacResetUsername('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminPhone');
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const sectionTabs = [
    { id: 'payments' as const, label: 'Payments' },
    { id: 'vouchers' as const, label: 'Vouchers' },
    { id: 'users' as const, label: 'Users' },
    { id: 'mac-reset' as const, label: 'MAC Reset' },
    { id: 'announcements' as const, label: 'ঘোষণা (Notice)' },
  ];

  const filteredTransactions = transactions.filter((txn) => {
    if (filter === 'all') return true;
    return txn.status === filter;
  });

  const search = hotspotSearch.trim().toLowerCase();
  const usernameMatches = search
    ? hotspotUsers.filter((session) => String(session.username ?? '').toLowerCase().includes(search))
    : [];
  const filteredHotspotUsers = hotspotUsers.filter((session) => {
    if (!search) return true;
    return [session.username, session.address, session.macAddress, session.id]
      .join(' ')
      .toLowerCase()
      .includes(search);
  });
  const displayedHotspotUsers = usernameMatches.length > 0
    ? Array.from(usernameMatches.reduce<Map<string, { session: any; count: number }>>((grouped, session) => {
      const username = String(session.username ?? '').toLowerCase();
      const existing = grouped.get(username);
      if (!existing) {
        grouped.set(username, { session, count: 1 });
      } else {
        const currentSeconds = Number(existing.session.remainingSeconds) || 0;
        const candidateSeconds = Number(session.remainingSeconds) || 0;
        grouped.set(username, {
          session: candidateSeconds < currentSeconds ? session : existing.session,
          count: existing.count + 1,
        });
      }
      return grouped;
    }, new Map()).values())
      .map(({ session, count }) => ({ ...session, activeSessionCount: count }))
    : filteredHotspotUsers;

  const getLiveRemainingSeconds = (session: any) => Math.max(
    0,
    (Number(session.remainingSeconds) || 0) - Math.floor((countdownNow - hotspotFetchedAt) / 1000),
  );

  const parseRouterOsDurationSeconds = (value: string) => {
    let totalSeconds = 0;
    for (const match of value.matchAll(/(\d+)([wdhms])/g)) {
      const amount = Number(match[1]);
      switch (match[2]) {
        case 'w': totalSeconds += amount * 604800; break;
        case 'd': totalSeconds += amount * 86400; break;
        case 'h': totalSeconds += amount * 3600; break;
        case 'm': totalSeconds += amount * 60; break;
        case 's': totalSeconds += amount; break;
      }
    }
    return totalSeconds;
  };

  const getLiveElapsedSeconds = (value: string) =>
    parseRouterOsDurationSeconds(value) + Math.floor((countdownNow - hotspotFetchedAt) / 1000);

  const formatElapsedDuration = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
  };

  const matchingDisabledHotspotUsers = configuredHotspotUsers.filter((user) => {
    if (!user.disabled) return false;
    if (!search) return true;
    return [user.username, user.profile, user.macAddress, user.comment]
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  const formatCountdown = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return 'Expired';
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of the list if needed, or just let it be
  };

  const stats = {
    total: transactions.length,
    pending: transactions.filter((t) => t.status === 'pending').length,
    completed: transactions.filter((t) => t.status === 'completed').length,
    failed: transactions.filter((t) => t.status === 'failed').length,
    totalAmount: transactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-gray-900 leading-tight">
                  অ্যাডমিন প্যানেল
                </h1>
                <p className="text-[10px] sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs">
                  WiFi Voucher Payment Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <button
                onClick={() => loadTransactions(true)}
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-md border border-slate-200 bg-white px-2 sm:px-4 py-1.5 sm:py-2 text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-xs sm:text-sm"
                title="ডাটা রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">রিফ্রেশ</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-md border border-slate-200 bg-white px-2 sm:px-4 py-1.5 sm:py-2 text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="লগআউট"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">লগআউট</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">মোট লেনদেন</span>
              <div className="w-8 h-8 bg-sky-50 rounded-md flex items-center justify-center">
                <Hash className="w-4 h-4 text-sky-700" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900">{stats.total}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">অপেক্ষমান</span>
              <div className="w-8 h-8 bg-amber-50 rounded-md flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-700" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-amber-700">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">সম্পন্ন</span>
              <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-emerald-700">
              {stats.completed}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">ব্যর্থ</span>
              <div className="w-8 h-8 bg-rose-50 rounded-md flex items-center justify-center">
                <XCircle className="w-4 h-4 text-rose-700" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-rose-700">{stats.failed}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">মোট আয়</span>
              <div className="w-8 h-8 bg-teal-50 rounded-md flex items-center justify-center">
                <span className="text-sm font-bold text-teal-700">৳</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-teal-800">৳{stats.totalAmount}</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {sectionTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                  activeSection === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

                      {activeSection === 'vouchers' && <VoucherManagement />}
                      {activeSection === 'announcements' && <AnnouncementManagement />}

        {activeSection === 'mac-reset' && (
          <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <RotateCcw className="h-5 w-5 text-amber-700" /> Hotspot MAC Reset
            </h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const username = macResetInput.trim();
                if (username) void handleMacReset(username, disconnectAllSessions);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="hotspot-username" className="mb-1 block text-sm font-medium text-gray-700">
                  Hotspot username
                </label>
                <input
                  id="hotspot-username"
                  value={macResetInput}
                  onChange={(event) => setMacResetInput(event.target.value)}
                  placeholder="Enter Hotspot username"
                  autoComplete="off"
                  required
                  maxLength={128}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sessions to disconnect">
                <button
                  type="button"
                  aria-pressed={!disconnectAllSessions}
                  onClick={() => setDisconnectAllSessions(false)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${!disconnectAllSessions ? 'border-amber-700 bg-amber-700 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  One session
                </button>
                <button
                  type="button"
                  aria-pressed={disconnectAllSessions}
                  onClick={() => setDisconnectAllSessions(true)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${disconnectAllSessions ? 'border-amber-700 bg-amber-700 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  All sessions
                </button>
                <button
                  type="submit"
                  disabled={macResetting || !macResetInput.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
                >
                  <RotateCcw className={`h-4 w-4 ${macResetting ? 'animate-spin' : ''}`} />
                  Reset MAC
                </button>
              </div>
            </form>
          </section>
        )}

        {activeSection === 'users' && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
                  <Wifi className="h-5 w-5 text-emerald-700" /> Live Hotspot Users
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {hotspotUsers.length} active
                  </span>
                </h2>
                <input
                  value={hotspotSearch}
                  onChange={(event) => setHotspotSearch(event.target.value)}
                  placeholder="Search username, IP, or MAC"
                  autoComplete="off"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
                />
              </div>

              <div className="grid gap-2.5">
                {displayedHotspotUsers.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No active hotspot user found.</p>
                ) : (
                  displayedHotspotUsers.map((session) => {
                    const isUsernameResult = usernameMatches.length > 0;
                    const remainingSeconds = getLiveRemainingSeconds(session);
                    return (
                    <div key={session.username || session.id} className={isUsernameResult ? 'rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 sm:p-6' : 'rounded-lg border border-slate-200 bg-white p-4'}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedHotspotUsername((current) => current === session.username ? null : session.username)}
                              aria-expanded={expandedHotspotUsername === session.username}
                              className={`text-left font-semibold text-slate-950 hover:text-emerald-800 ${isUsernameResult ? 'text-2xl sm:text-3xl' : 'text-base'}`}
                            >
                              {session.username || 'Unknown user'}
                            </button>
                            <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              {session.loginBy || 'Hotspot'}
                            </span>
                            {session.activeSessionCount > 1 && (
                              <span className="text-xs font-medium text-slate-600">{session.activeSessionCount} active sessions</span>
                            )}
                          </div>
                          {isUsernameResult && (
                            <div className="mt-4 inline-block min-w-56 rounded-md border border-emerald-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Time left</p>
                              <p className="font-mono text-2xl font-semibold tabular-nums text-emerald-800 sm:text-4xl">
                                {formatCountdown(remainingSeconds)}
                              </p>
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span><strong>User ID:</strong> {session.username || 'N/A'}</span>
                            <span><strong>IP:</strong> {session.address || 'N/A'}</span>
                            <span><strong>MAC:</strong> {session.macAddress || 'N/A'}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span><strong>Uptime:</strong> {formatElapsedDuration(getLiveElapsedSeconds(session.uptime || '0s'))}</span>
                            {!isUsernameResult && <span><strong>Time Left:</strong> {formatCountdown(remainingSeconds)}</span>}
                            <span><strong>Idle:</strong> {formatElapsedDuration(getLiveElapsedSeconds(session.idleTime || '0s'))}</span>
                          </div>
                          {expandedHotspotUsername === session.username && (
                            <dl className="mt-4 grid gap-2 border-t border-slate-200 pt-3 text-xs sm:grid-cols-2">
                              <div><dt className="font-semibold text-slate-500">Login method</dt><dd className="mt-0.5 text-slate-800">{session.loginBy || 'Hotspot'}</dd></div>
                              <div><dt className="font-semibold text-slate-500">Hotspot server</dt><dd className="mt-0.5 text-slate-800">{session.server || 'N/A'}</dd></div>
                              <div><dt className="font-semibold text-slate-500">Profile</dt><dd className="mt-0.5 text-slate-800">{configuredHotspotUsers.find((user) => user.username === session.username)?.profile || 'default'}</dd></div>
                              <div><dt className="font-semibold text-slate-500">Uptime limit</dt><dd className="mt-0.5 text-slate-800">{configuredHotspotUsers.find((user) => user.username === session.username)?.limitUptime || 'Not set'}</dd></div>
                              <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Comment</dt><dd className="mt-0.5 break-words text-slate-800">{session.comment || 'None'}</dd></div>
                            </dl>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => void handleHotspotUserStatus(session.username, false)}
                            disabled={hotspotStatusUpdatingUsername !== null || !session.username}
                            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {hotspotStatusUpdatingUsername === session.username && !configuredHotspotUsers.find((user) => user.username === session.username)?.disabled
                              ? <RefreshCw className="h-4 w-4 animate-spin" />
                              : null}
                            Disable user
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMacReset(session.username, false)}
                            disabled={macResetting || !session.username}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RotateCcw className={`h-4 w-4 ${macResetting && macResetUsername === session.username ? 'animate-spin' : ''}`} />
                            Reset MAC
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMacReset(session.username, true)}
                            disabled={macResetting || !session.username}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reset all
                          </button>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
                  <Wifi className="h-5 w-5 text-rose-700" /> Disabled Hotspot Users
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                    {configuredHotspotUsers.filter((user) => user.disabled).length}
                  </span>
                </h2>
              </div>
              {matchingDisabledHotspotUsers.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No disabled Hotspot users.
                </p>
              ) : (
                <div className="space-y-2">
                  {matchingDisabledHotspotUsers.map((user) => (
                    <div key={user.username} className="flex flex-col gap-3 rounded-md border border-rose-200 bg-rose-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setExpandedHotspotUsername((current) => current === user.username ? null : user.username)}
                          aria-expanded={expandedHotspotUsername === user.username}
                          className="text-left font-semibold text-slate-900 hover:text-rose-800"
                        >
                          {user.username}
                        </button>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span><strong>Profile:</strong> {user.profile || 'default'}</span>
                          <span><strong>MAC:</strong> {user.macAddress || 'Any'}</span>
                        </div>
                        {expandedHotspotUsername === user.username && (
                          <dl className="mt-3 grid gap-2 border-t border-rose-200 pt-3 text-xs sm:grid-cols-2">
                            <div><dt className="font-semibold text-slate-500">Uptime limit</dt><dd className="mt-0.5 text-slate-800">{user.limitUptime || 'Not set'}</dd></div>
                            <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Comment</dt><dd className="mt-0.5 break-words text-slate-800">{user.comment || 'None'}</dd></div>
                          </dl>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleHotspotUserStatus(user.username, true)}
                        disabled={hotspotStatusUpdatingUsername !== null}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {hotspotStatusUpdatingUsername === user.username
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : null}
                        Enable user
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
                <Users className="h-5 w-5 text-slate-600" /> User Management
              </h2>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.phone}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Payments: {user._count?.payments ?? 0} | Vouchers: {user._count?.assignedVouchers ?? 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordResetUser(user);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordResetError('');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <Key className="h-4 w-4" />
                        পাসওয়ার্ড রিসেট
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteUser(user)}
                          disabled={deletingUserId !== null}
                          aria-label={`Delete user ${user.name}`}
                          title="Delete user and payment history"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingUserId === user.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-sm text-slate-500">No users found</p>}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'payments' && (
          <>
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6 p-2">
          <div className="grid grid-cols-2 sm:flex gap-2">
            {(["all", "pending", "completed", "failed"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {status === "all" && "সকল"}
                  {status === "pending" && "অপেক্ষমান"}
                  {status === "completed" && "সম্পন্ন"}
                  {status === "failed" && "ব্যর্থ"}
                </button>
              ),
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Requests</h2>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
              <p className="text-gray-500">কোনো লেনদেন পাওয়া যায়নি</p>
            </div>
          ) : (
            currentItems.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
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
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-2xl font-bold text-gray-900">
                        ৳{transaction.amount}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse"
                                : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {transaction.status === "completed" && "✓ সম্পন্ন"}
                          {transaction.status === "pending" && "⏳ অপেক্ষমান"}
                          {transaction.status === "failed" && "✕ ব্যর্থ"}
                        </span>

                        {transaction.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowApproveModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1 rounded-full transition-all shadow hover:shadow-md flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            অনুমোদন করুন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">নাম</p>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="text-xs font-medium text-gray-900">
                          {transaction.paymentMethod ?? 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ফোন নম্বর</p>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.phoneNumber}
                        </p>
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
                  </div>

                  {transaction.status === 'completed' && transaction.voucherUsername && (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-green-800">ভাউচার তথ্য (Secured)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg px-3 py-2 border border-green-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Username</p>
                          <p className="text-sm font-mono font-bold text-gray-900">{transaction.voucherUsername}</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-green-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</p>
                          <p className="text-sm font-mono font-bold text-gray-900">{transaction.voucherPassword}</p>
                        </div>
                      </div>
                      {transaction.approvedAt && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-100 rounded-lg px-3 py-1.5 border border-green-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-semibold">অনুমোদনের সময়: {formatBanglaDateTime(transaction.approvedAt, '—')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for Pending Payments */}
                  {transaction.status === "pending" && (
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowApproveModal(true);
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        অনুমোদন করুন
                      </button>
                      <button
                        onClick={() => {
                          updatePaymentStatus(transaction.id, "failed");
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        প্রত্যাখ্যান করুন
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                পূর্ববর্তী
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                পরবর্তী
              </button>
            </nav>
          </div>
        )}
          </>
        )}
      </main>

      {/* Approve Payment Modal */}
      {showApproveModal && selectedTransaction && (
        <ApprovePaymentModal
          transaction={selectedTransaction}
          loading={approving}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedTransaction(null);
          }}
          onApprove={async () => {
            await updatePaymentStatus(selectedTransaction.id, "completed");
            setShowApproveModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
      {passwordResetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !resettingPassword) {
              setPasswordResetUser(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">পাসওয়ার্ড রিসেট</h2>
                <p className="mt-1 text-sm text-gray-600">{passwordResetUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => !resettingPassword && setPasswordResetUser(null)}
                disabled={resettingPassword}
                aria-label="Close"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                নতুন পাসওয়ার্ড
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                পাসওয়ার্ড নিশ্চিত করুন
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              {passwordResetError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {passwordResetError}
                </p>
              )}
              <button
                type="submit"
                disabled={resettingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resettingPassword ? 'রিসেট হচ্ছে...' : 'পাসওয়ার্ড রিসেট করুন'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
