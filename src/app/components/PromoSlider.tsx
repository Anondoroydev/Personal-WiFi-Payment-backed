import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1645725677294-ed0843b97d5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWZpJTIwaW50ZXJuZXQlMjBmYXN0JTIwc3BlZWQlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzU0NTY0Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'সুপার ফাস্ট ইন্টারনেট',
    subtitle: 'মাত্র ১০ টাকা থেকে শুরু! ২০ Mbps পর্যন্ত গতি'
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1758598304167-ebf66988f924?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBwYXltZW50JTIwZGlnaXRhbCUyMHRyYW5zYWN0aW9ufGVufDF8fHx8MTc3MzU0NTY0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: '১০০% নিরাপদ পেমেন্ট',
    subtitle: 'bKash ও Nagad - সম্পূর্ণ নিরাপদ লেনদেন'
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1770393698717-fbbebdeccd5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXR3b3JrJTIwY29ubmVjdGlvbiUyMHJvdXRlciUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzczNTQ1NjQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'তাৎক্ষণিক সংযোগ',
    subtitle: 'পেমেন্ট করার সাথে সাথেই WiFi password পান'
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1724908267988-63310819325c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwd2lmaSUyMGNvbm5lY3Rpdml0eXxlbnwxfHx8fDE3NzM1NDU2NDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'সহজ ব্যবহার',
    subtitle: 'যেকোনো সময় মোবাইল থেকে রিচার্জ করুন'
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1758523668811-fb15814e8166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cmUlMjBwYXltZW50JTIwb25saW5lJTIwYmFua2luZ3xlbnwxfHx8fDE3NzM1NDU2NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '২৪/৭ সাপোর্ট',
    subtitle: 'সবসময় আপনার সেবায় প্রস্তুত'
  }
];

export function PromoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
      {/* Slider Content - Image with Overlay */}
      <div className="relative aspect-[16/7] sm:aspect-[21/9] md:aspect-[3/1] overflow-hidden">
        {/* Background Image */}
        <img 
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 sm:px-10 md:px-12 lg:px-16 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 drop-shadow-lg">
              {slide.title}
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-md">
              {slide.subtitle}
            </p>
          </div>
        </div>

        {/* Navigation Buttons - Always Visible */}
        <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-4 pointer-events-none">
          <button
            onClick={prevSlide}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm pointer-events-auto transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm pointer-events-auto transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 py-4 bg-white">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full ${
              index === currentSlide
                ? 'w-8 h-2 bg-gradient-to-r from-purple-600 to-pink-600'
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <div className="absolute top-3 right-3 z-20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg" />
        </div>
      )}
    </div>
  );
}