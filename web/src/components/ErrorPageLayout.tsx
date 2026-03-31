import React from 'react';
import Link from 'next/link';
import { Home, Headset } from 'lucide-react';

interface ErrorPageLayoutProps {
  code: string | number;
  title: string;
  description: string;
}

export const ErrorPageLayout: React.FC<ErrorPageLayoutProps> = ({ code, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F9FB] relative overflow-hidden px-4">
      {/* Background Architectural Elements SVG - Simulated */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-center">
        <div className="w-[1280px] h-[1024px] bg-[url('/images/error-bg.svg')] bg-center bg-no-repeat bg-cover mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-[896px] text-center gap-4">
        {/* Large Architectural Status Code Graphic */}
        <div className="relative flex justify-center items-center">
          <h1 
            className="text-[120px] md:text-[200px] lg:text-[288px] font-extrabold leading-none tracking-tighter opacity-10 select-none"
            style={{
              background: 'linear-gradient(180deg, #000651 0%, #00108A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {code}
          </h1>
        </div>

        {/* Main Text Content */}
        <div className="flex flex-col items-center gap-6 -mt-10 md:-mt-20">
          <h2 className="text-3xl md:text-[60px] font-extrabold text-[#000651] leading-tight tracking-tight px-4 flex items-center justify-center text-center max-w-[800px]">
            {title}
          </h2>
          
          <div className="max-w-[512px] px-4">
            <p className="text-base md:text-lg text-[#454653] leading-relaxed text-center">
              {description}
            </p>
          </div>
        </div>

        {/* Action Cluster */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 w-full sm:w-auto px-4">
          <Link 
            href="/"
            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-[#000651] text-white rounded-xl font-semibold transition-all hover:bg-indigo-900 active:scale-95 shadow-lg shadow-indigo-900/20 w-full sm:w-auto"
          >
            <Home className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
            <span>Quay về trang chủ</span>
          </Link>

          <Link 
            href="/support"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-[#E0E3E5] text-[#191C1E] rounded-xl font-semibold transition-all hover:bg-[#D0D4D6] active:scale-95 w-full sm:w-auto"
          >
            <Headset className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span>Liên hệ hỗ trợ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
