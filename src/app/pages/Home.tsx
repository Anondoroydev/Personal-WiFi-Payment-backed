import { useState, useEffect } from "react";
import {
  Wifi,
  CheckCircle,
  Phone,
  User as UserIcon,
  TrendingUp,
  Zap,
  Award,
  ChevronRight,
  Star,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentForm } from "../components/PaymentForm";
import { TransactionHistory } from "../components/TransactionHistory";
import { PaymentReceipt } from "../components/PaymentReceipt";
import { AnnouncementBanner } from "../components/AnnouncementBanner";
import { PromoSlider } from "../components/PromoSlider";
import { VoucherLoginForm } from "../components/VoucherLoginForm";
import { PENDING_VOUCHER_PAYMENT_KEY } from "../utils/events";
import { api } from "../services/api";
import { copyToClipboard } from "../utils/clipboard";
import { toast } from "sonner";
import { subscribeToRealtimeEvents, notifyDataChanged } from "../utils/events";

export interface WiFiPackage {
  id: string;
  name: string;
  speed: string;
  duration: string;
  price: number;
  features: string[];
  popular?: boolean;
  color: string;
}

export interface Transaction {
  id: string;
  packageName: string;
  amount: number;
  name: string;
  macAddress: string;
  phoneNumber: string;
  transactionId: string;
  paymentMethod: string;
  date: string;
  status: "completed" | "pending" | "failed";
  wifiPassword?: string;
  approvedAt?: string;
  userId?: string;
  voucherUsername?: string;
  voucherPassword?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const wifiPackages: WiFiPackage[] = [
  {
    id: "1",
    name: "ডেইলি প্যাক",
    speed: "৫ Mbps",
    duration: "১২ ঘন্টা",
    price: 10,
    features: ["১টা ডিভাইস", "১২ ঘন্টা ভ্যালিড", "বেসিক সাপোর্ট"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "2",
    name: "সাপ্তাহিক প্যাক",
    speed: "১০ Mbps",
    duration: "৭ দিন",
    price: 50,
    features: ["১টা ডিভাইস", "৭ দিন ভ্যালিড", "স্ট্যান্ডার্ড সাপোর্ট"],
    popular: true,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "3",
    name: "মাসিক প্যাক",
    speed: "১৫ Mbps",
    duration: "৩০ দিন",
    price: 100,
    features: ["১টা ডিভাইস", "৩০ দিন ভ্যালিড", "প্রায়োরিটি সাপোর্ট"],
    color: "from-orange-500 to-red-500",
  },
  {
    id: "4",
    name: "টিভি প্যাক",
    speed: "৮০ Mbps",
    duration: "৩০ দিন",
    price: 200,
    features: ["শুধু টিভির জন্য", "৩০ দিন ভ্যালিড", "প্রিমিয়াম সাপোর্ট"],
    color: "from-indigo-500 to-purple-600",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<WiFiPackage | null>(
    null,
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [packages, setPackages] = useState<WiFiPackage[]>(wifiPackages);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(
    null,
  );
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    loadTransactions();

    // Fetch dynamic package IDs from backend
    api.getPackages().then((backendPkgs) => {
      setPackages(prev => prev.map(p => {
        const backendPkg = backendPkgs.find(bp => bp.price === p.price);
        return backendPkg ? { ...p, id: backendPkg.id } : p;
      }));
    }).catch(console.error);

    // Instant real-time updates across tabs and components (like Facebook messaging)
    const unsubscribe = subscribeToRealtimeEvents('payments', () => {
      loadTransactions(false);
    });

    // Silent polling for cross-device real-time sync (e.g. admin on mobile approves payment for user on laptop)
    const interval = setInterval(() => {
      loadTransactions(false);
    }, 10000);

    // Refresh when user comes back to the tab (visibility change)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadTransactions(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);



  const loadTransactions = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const userStr = localStorage.getItem("currentUser");
      const adminToken = localStorage.getItem("adminToken");
      let currentUserId = null;
      let currentUserPhone = null;
      let role = null;

      if (userStr) {
        const user = JSON.parse(userStr);
        currentUserId = user.id;
        currentUserPhone = user.phoneNumber;
        role = user.role;
      }

      let filteredPayments = [];

      if (adminToken || role === 'ADMIN') {
        const data = await api.getPayments();
        filteredPayments = data.payments || [];
        // Filter transactions to show only current user's payments (if needed)
        if (currentUserId || currentUserPhone) {
          filteredPayments = filteredPayments.filter((payment: Transaction) => {
            return (
              (currentUserId && payment.userId === currentUserId) ||
              (currentUserPhone && payment.phoneNumber === currentUserPhone)
            );
          });
        }
      } else if (userStr) {
        const data = await api.getUserPayments();
        filteredPayments = data.payments || [];
      } else {
        // Not logged in, don't fetch transactions
        setTransactions([]);
        return;
      }

      setTransactions(filteredPayments);
    } catch (error) {
      // If unauthorized, just clear transactions silently - don't redirect from Home page
      if (error instanceof Error && (
        error.message === 'Unauthorized' ||
        error.message.includes('সেশন') ||
        error.message.includes('লগইন')
      )) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: WiFiPackage) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      toast.error('পেমেন্ট করার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।');
      navigate('/login');
      return;
    }
    setSelectedPackage(pkg);
    setShowPaymentForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentSubmit = async (
    name: string,
    macAddress: string,
    phoneNumber: string,
    transactionId: string,
    paymentMethod: string
  ) => {
    if (!selectedPackage) return;

    try {
      setLoading(true);

      // Resolve backend package id if frontend still has placeholder/local id
      let packageIdToSend = selectedPackage.id;
      const looksLikeLocalId = typeof packageIdToSend === 'string' && packageIdToSend.length <= 3;
      if (looksLikeLocalId || !packageIdToSend.startsWith('cms')) {
        // Fetch canonical packages from backend and match by price
        const backendPkgs = await api.getPackages();
        const matched = backendPkgs.find((bp: any) => bp.price === selectedPackage.price);
        if (matched && matched.id) {
          packageIdToSend = matched.id;
        } else {
          toast.error('প্যাকেটটি সার্ভারে পাওয়া যায়নি। অনুগ্রহ করে ওয়েব পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');
          return;
        }
      }

      const res = await api.createPayment({
        packageId: packageIdToSend,
        paymentMethod,
        transactionId,
        name,
        phoneNumber,
      });

      localStorage.setItem(PENDING_VOUCHER_PAYMENT_KEY, res.payment.id);
      notifyDataChanged('payments');
      await loadTransactions(false);
      setShowPaymentForm(false);
      setSelectedPackage(null);
      setLastTransaction({ ...res.payment, macAddress: macAddress || "N/A" });
      setShowReceipt(true);
      toast.success("পেমেন্ট সফলভাবে সাবমিট হয়েছে!");
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Unauthorized' ||
        error.message.includes('সেশন') ||
        error.message.includes('লগইন')
      )) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        toast.error("আপনার সেশনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন!");
        navigate("/login");
        return;
      }
      toast.error(error instanceof Error ? error.message : "পেমেন্ট সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPaymentForm(false);
    setSelectedPackage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnnouncementBanner />

      {/* Modern Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  WiFi রিচার্জ
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  দ্রুত ও নির্ভরযোগ্য
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => copyToClipboard("01826339098")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">০১৮২৬৩৩৯০৯৮</span>
                <span className="sm:hidden">কল</span>
              </button>
              {currentUser ? (
                <button
                  onClick={() => navigate("/user/profile")}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-lg transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700 hidden lg:inline">
                    {currentUser.name}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/user/signup")}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <span className="hidden sm:inline">রেজিস্ট্রেশন</span>
                    <span className="sm:hidden">নিবন্ধন</span>
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    লগইন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Live Payment Status Banner for User */}
      {transactions.length > 0 && !showPaymentForm && (
        <div className="bg-white border-b border-gray-200 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {(() => {
              const latest = transactions[0];
              if (latest.status === 'pending') {
                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-amber-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm sm:text-base">পেমেন্ট যাচাই করা হচ্ছে (অপেক্ষমান)</span>
                          <span className="text-xs bg-amber-200 text-amber-900 font-mono px-2 py-0.5 rounded font-semibold">
                            Txn: {latest.transactionId}
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 mt-0.5">
                          প্যাকেজ: <strong>{latest.packageName}</strong> (৳{latest.amount}) • এডমিন যাচাই করার পর ১-৩ মিনিটে অটোমেটিক ওয়াইফাই চালু হবে।
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadTransactions(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-2 rounded-lg transition-colors shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> স্ট্যাটাস চেক
                    </button>
                  </div>
                );
              } else if (latest.status === 'completed') {
                return (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-emerald-600 text-white rounded-xl p-3.5 sm:p-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm sm:text-base">🎉 অভিনন্দন! আপনার পেমেন্ট সফলভাবে অনুমোদিত হয়েছে</p>
                        <p className="text-xs text-emerald-100 mt-0.5">
                          প্যাকেজ: <strong>{latest.packageName}</strong> (৳{latest.amount})
                        </p>
                      </div>
                    </div>
                    {(latest.voucherUsername || latest.wifiPassword) && (
                      <div className="w-full md:w-auto flex flex-wrap items-center justify-between gap-2 bg-emerald-700/80 p-2 sm:px-3 sm:py-2 rounded-lg border border-emerald-500">
                        {latest.voucherUsername && (
                          <span className="text-xs text-emerald-100">
                            ইউজার: <strong className="text-white font-mono bg-emerald-800 px-1.5 py-0.5 rounded">{latest.voucherUsername}</strong>
                          </span>
                        )}
                        <span className="text-xs text-emerald-100">
                          পাসওয়ার্ড: <strong className="text-yellow-300 font-mono bg-emerald-800 px-1.5 py-0.5 rounded">{latest.voucherPassword || latest.wifiPassword}</strong>
                        </span>
                        <button
                          onClick={() => copyToClipboard(latest.voucherPassword || latest.wifiPassword || latest.voucherUsername || '')}
                          className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 text-xs font-bold px-2.5 py-1 rounded transition-colors"
                        >
                          পাসওয়ার্ড কপি
                        </button>
                      </div>
                    )}
                  </div>
                );
              } else if (latest.status === 'failed') {
                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-red-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm sm:text-base">পেমেন্ট রিকোয়েস্টটি প্রত্যাখ্যাত হয়েছে (ব্যর্থ)</span>
                        <p className="text-xs text-red-700 mt-0.5">
                          ট্রানজাকশন নম্বরটি পুনরায় চেক করুন অথবা সাহায্যকেন্দ্রে যোগাযোগ করুন: 01826339098
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Hero Section */}
      {!showPaymentForm && (
        <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Side - Text Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">এখনই সংযুক্ত হন</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
                  সুপার ফাস্ট WiFi
                  <span className="block text-yellow-300 mt-2">
                    মাত্র ১০ টাকা থেকে!
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-purple-100 mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0">
                  bKash ও Nagad দিয়ে সহজেই রিচার্জ করুন। তাৎক্ষণিক সংযোগ পান।
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() =>
                      document.getElementById("packages")?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="group bg-white text-purple-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>প্যাকেজ দেখুন</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate("/contact")}
                    className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white/10 transition-all"
                  >
                    যোগাযোগ করুন
                  </button>
                </div>

                {/* Stats - Only visible on desktop */}
                <div className="hidden lg:grid grid-cols-3 gap-4 mt-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-black">৮০ Mbps</div>
                    <p className="text-sm text-emerald-50/80 mt-1">সর্বোচ্চ গতি</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-black">৯৯.৯%</div>
                    <p className="text-sm text-emerald-50/80 mt-1">আপটাইম</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-black">১০০০+</div>
                    <p className="text-sm text-emerald-50/80 mt-1">গ্রাহক</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Visual Content */}
              <div className="relative">
                {/* Decorative Elements */}
                {/* Main Image */}
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1770393698717-fbbebdeccd5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWZpJTIwcm91dGVyJTIwdGVjaG5vbG9neSUyMGludGVybmV0fGVufDF8fHx8MTc3MzQ5OTU1MHww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="WiFi Service"
                    className="rounded-2xl shadow-2xl w-full h-auto"
                  />

                  {/* Floating Cards */}
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl hidden sm:block">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          ১০০% নিরাপদ
                        </div>
                        <div className="text-xs text-gray-500">
                          পেমেন্ট সিস্টেম
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl hidden sm:block">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          দ্রুত সেবা
                        </div>
                        <div className="text-xs text-gray-500">
                          তাৎক্ষণিক সংযোগ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Badges */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="bg-white rounded-md px-4 py-2 shadow-sm flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">bK</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      bKash
                    </span>
                  </div>
                  <div className="bg-white rounded-md px-4 py-2 shadow-sm flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">N</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      Nagad
                    </span>
                  </div>
                  <div className="bg-white rounded-md px-4 py-2 shadow-sm flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">R</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      Rocket
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Stats - Only visible on mobile/tablet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:hidden gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <Zap className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <div className="text-2xl font-black">৮০ Mbps</div>
                <p className="text-sm text-emerald-50/80 mt-1">সর্বোচ্চ গতি</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <div className="text-2xl font-black">৯৯.৯%</div>
                <p className="text-sm text-emerald-50/80 mt-1">আপটাইম</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <Award className="w-8 h-8 text-pink-300 mx-auto mb-2" />
                <div className="text-2xl font-black">১০০০+</div>
                <p className="text-sm text-emerald-50/80 mt-1">গ্রাহক</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <Star className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <div className="text-2xl font-black">৪.৯★</div>
                <p className="text-sm text-emerald-50/80 mt-1">রেটিং</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!showPaymentForm && (
          <div>
            {/* Voucher Login Form - connect to WiFi router */}
            <div className="mb-16">
              <VoucherLoginForm />
            </div>

            <div className="text-center mb-8 sm:mb-12" id="packages">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                আপনার পছন্দের প্যাকেজ বেছে নিন
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                সাশ্রয়ী মূল্যে দ্রুত গতির ইন্টারনেট
              </p>
            </div>

            {/* Package Cards - Original Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md ${
                    pkg.popular ? "border-purple-400" : "border-gray-200"
                  }`}
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        জনপ্রিয়
                      </div>
                    </div>
                  )}

                  {/* Gradient Header */}
                  <div
                    className={`bg-gradient-to-br ${pkg.color} p-6 text-white relative`}
                  >
                    <div className="relative z-10">
                      <Wifi className="w-10 h-10 mb-4" />
                      <h3 className="text-2xl font-black mb-1">{pkg.name}</h3>
                      <p className="text-sm opacity-90">{pkg.duration}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-semibold text-slate-950">
                        ৳{pkg.price}
                      </span>
                      <span className="text-gray-500 mb-1">
                        /{pkg.duration}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold">{pkg.speed} স্পিড</span>
                    </div>
                    {pkg.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buy Button */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full bg-gradient-to-r ${pkg.color} text-white py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all`}
                    >
                      এখনই কিনুন →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPaymentForm && selectedPackage && (
          <PaymentForm
            package={selectedPackage}
            onSubmit={handlePaymentSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        )}

        {!showPaymentForm && currentUser && transactions.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            <TransactionHistory transactions={transactions} />
          </div>
        )}

        {showReceipt && lastTransaction && (
          <PaymentReceipt
            transaction={lastTransaction}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </main>

      {/* Features Section */}
      <section className="bg-white py-12 sm:py-20 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              কেন আমাদের বেছে নিবেন?
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              সেরা সেবা এবং সুবিধা
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                দ্রুত গতি
              </h3>
              <p className="text-gray-600">
                ৮০ Mbps পর্যন্ত হাই-স্পিড ইন্টারনেট সেবা
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                নিরাপদ পেমেন্ট
              </h3>
              <p className="text-gray-600">
                bKash ও Nagad - সম্পূর্ণ নিরাপদ লেনদেন
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ২৪/৭ সাপোর্ট
              </h3>
              <p className="text-gray-600">সবসময় আপনার সেবায় প্রস্তুত</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">WiFi রিচার্জ</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                আপনার এলাকার সবচেয়ে দ্রুত এবং নির্ভরযোগ্য WiFi সেবা প্রদানকারী।
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-purple-400">দ্রুত লিঙ্ক</h4>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: 'smooth' })}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  → প্যাকেজ সমূহ
                </button>
                <button
                  onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: 'smooth' })}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  → লেনদেনের ইতিহাস
                </button>
                <button
                  onClick={() => navigate("/contact")}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  → যোগাযোগ
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-purple-400">যোগাযোগ</h4>
              <div className="space-y-3">
                <button
                  onClick={() => copyToClipboard("01826339098")}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>০১৮২৬৩৩৯০৯৮</span>
                </button>
                <div className="flex gap-2">
                  <div className="bg-pink-600 px-3 py-1 rounded text-xs font-bold">
                    bKash
                  </div>
                  <div className="bg-orange-600 px-3 py-1 rounded text-xs font-bold">
                    Nagad
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              © ২০২৬ WiFi রিচার্জ সেন্টার। সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
