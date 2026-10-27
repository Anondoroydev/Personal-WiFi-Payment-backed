import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import { subscribeToRealtimeEvents } from '../utils/events';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  message?: string;
  content?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isActive: boolean | string;
  createdAt: string;
}

const getBgClass = (_type: string) => {
  return 'bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 text-white border-b border-pink-500/20 shadow-lg';
};

// Title badge styling with glassmorphism
const getTitleClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-emerald-300 font-black bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-md';
    case 'warning':
      return 'text-amber-300 font-black bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-md';
    case 'error':
      return 'text-rose-300 font-black bg-rose-500/20 border border-rose-400/30 px-2 py-0.5 rounded-md';
    default:
      return 'text-yellow-300 font-black bg-yellow-400/20 border border-yellow-300/30 px-2 py-0.5 rounded-md';
  }
};

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-300 drop-shadow" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 flex-shrink-0 text-yellow-300 drop-shadow" />;
    case 'error':
      return <XCircle className="w-5 h-5 flex-shrink-0 text-rose-300 drop-shadow" />;
    default:
      return <Info className="w-5 h-5 flex-shrink-0 text-purple-300 drop-shadow" />;
  }
};


export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const loadFailed = useRef(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await api.getAnnouncements();
      const active = data.announcements.filter(
        (announcement: Announcement) =>
          announcement.isActive === true ||
          announcement.isActive === 'true',
      );
      setAnnouncements(active);
      loadFailed.current = false;
    } catch (error) {
      if (!loadFailed.current) {
        toast.error(error instanceof Error ? error.message : 'ঘোষণা লোড করা যায়নি।');
        loadFailed.current = true;
      }
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();

    // Instant real-time listener across tabs and windows
    const unsubscribe = subscribeToRealtimeEvents('announcements', loadAnnouncements);

    // Refresh announcements every 30 seconds
    const interval = setInterval(loadAnnouncements, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadAnnouncements();
    };
    window.addEventListener('focus', loadAnnouncements);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', loadAnnouncements);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
    };
  }, [loadAnnouncements]);

  if (announcements.length === 0) return null;

  const primaryAnnouncement = announcements[0];
  const bgClass = getBgClass(primaryAnnouncement.type);

  return (
    <div className={`w-full ${bgClass} shadow-lg z-50 transition-all duration-500`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
          {/* Icon */}
          <div className="flex-shrink-0">{getIcon(primaryAnnouncement.type)}</div>

          {/* Seamless Scrolling News Ticker */}
          <div className="flex-1 min-w-0 overflow-hidden relative">
            <div className="ticker-wrapper">
              <div className="ticker-content">
                {[1, 2].map((i) => (
                  <span key={i} className="inline-flex items-center">
                    {announcements.map((announcement, index) => (
                      <span key={`${announcement.id}-${index}`} className="ticker-item px-4">
                        <span className={`text-xs sm:text-sm lg:text-base mr-2 ${getTitleClass(announcement.type)}`}>
                          📢 {announcement.title}
                        </span>
                        <span className="text-xs sm:text-sm lg:text-base text-white/90 whitespace-nowrap">
                          {announcement.message || announcement.content}
                        </span>
                        {/* Separator */}
                        <span className="mx-4 text-white/40">•</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ticker-wrapper {
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .ticker-content {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-scroll 90s linear infinite;
        }

        .ticker-content:hover {
          animation-play-state: paused;
        }

        .ticker-item {
          display: inline-flex;
          align-items: center;
        }

        @keyframes ticker-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .ticker-content {
            animation: ticker-scroll 75s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}