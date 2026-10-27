import { useState, useEffect } from 'react';
import { Wifi, Zap, Shield, Clock, ArrowRight, CheckCircle2, Star, Users, Award, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  onGetStarted: () => void;
}

export function HeroBanner({ onGetStarted }: HeroBannerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const bannerImages = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
  ];

  // Auto-change background image
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      {/* Animated Background Images */}
      <div className="absolute inset-0">
        {bannerImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-20' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-pink-900/90 to-blue-900/95" />
      </div>

      {/* Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-0 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-0 w-48 h-48 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-10 w-32 h-32 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-4 py-10 pb-16 md:py-16 md:pb-24">
        
        {/* Online Badge */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/25 backdrop-blur-md border border-green-400/40 px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            <span className="text-sm md:text-base font-semibold text-white">🔥 আমরা লাইভ</span>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-3 md:mb-4">
            <span className="block text-white drop-shadow-2xl">সুপার ফাস্ট</span>
            <span className="block text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent drop-shadow-2xl">
              WiFi সেবা
            </span>
          </h1>
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-md border border-yellow-300/30 px-5 py-2 md:px-6 md:py-3 rounded-full mb-3 md:mb-4">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
            <p className="text-lg md:text-xl font-black text-white">
              মাত্র <span className="text-2xl md:text-3xl text-yellow-300">১০ টাকা</span> থেকে!
            </p>
          </div>
          <p className="text-base md:text-lg text-gray-200 font-medium">
            দ্রুত, নির্ভরযোগ্য এবং সাশ্রয়ী ইন্টারনেট 🚀
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 max-w-md md:max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-400/30 rounded-2xl p-4 md:p-5 text-center">
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-yellow-300 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-black text-white">২০ Mbps</div>
            <p className="text-xs md:text-sm text-gray-200 font-medium">সর্বোচ্চ গতি</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-400/30 rounded-2xl p-4 md:p-5 text-center">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-green-300 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-black text-white">১০০%</div>
            <p className="text-xs md:text-sm text-gray-200 font-medium">নিরাপদ</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl p-4 md:p-5 text-center">
            <Clock className="w-8 h-8 md:w-10 md:h-10 text-blue-300 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-black text-white">২৪/৭</div>
            <p className="text-xs md:text-sm text-gray-200 font-medium">সেবা</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-md border border-pink-400/30 rounded-2xl p-4 md:p-5 text-center">
            <Star className="w-8 h-8 md:w-10 md:h-10 text-pink-300 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-black text-white">৪.৯★</div>
            <p className="text-xs md:text-sm text-gray-200 font-medium">রেটিং</p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3 mb-8 md:mb-10 max-w-md md:max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 md:p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm md:text-base text-white font-medium">৪টি সাশ্রয়ী প্যাকেজ - দৈনিক থেকে মাসিক</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 md:p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm md:text-base text-white font-medium">bKash ও Nagad - সহজ পেমেন্ট</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 md:p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm md:text-base text-white font-medium">তাৎক্ষণিক অ্যাক্টিভেশন - কোনো বিলম্ব নেই</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 md:space-y-4 max-w-md mx-auto">
          <button
            onClick={onGetStarted}
            className="group w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-purple-900 px-6 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-2xl shadow-orange-500/50 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Wifi className="w-6 h-6 md:w-7 md:h-7" />
            <span>এখনই শুরু করুন</span>
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="w-full border-2 border-white/50 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-6 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>আরো জানুন</span>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mt-10 md:mt-12 pt-8 border-t border-white/20 max-w-md md:max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">১০০০+</div>
              <p className="text-xs md:text-sm text-gray-200 mt-1">সন্তুষ্ট গ্রাহক</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">bKash</div>
              <p className="text-xs md:text-sm text-gray-200 mt-1">পেমেন্ট</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">দ্রুত</div>
              <p className="text-xs md:text-sm text-gray-200 mt-1">সেবা</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Wave Shape */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="rgb(250, 245, 255)" fillOpacity="1"/>
        </svg>
      </div>

      {/* Image Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentImageIndex 
                ? 'w-8 h-2 bg-white shadow-lg' 
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
}