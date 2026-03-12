import React from 'react';

/**
 * InstitutionalMarquee Component
 * 
 * A horizontally scrolling infinite marquee section that displays institutional partnerships 
 * and environments using minimalist SVG icons and light gray typography on a dark background 
 * with faded edge gradients.
 */

const marqueeItems = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 2V16M2 9H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    text: "Local & state government environments"
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="12" height="12" stroke="currentColor" strokeWidth="1" />
        <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1" />
        <line x1="9" y1="3" x2="9" y2="15" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    text: "Transport, infrastructure & utilities authorities"
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1" />
        <path d="M9 6V12M6 9H12" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    text: "Statutory, regulatory & mandated systems"
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 16L16 2M2 2L16 16" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    text: "Public-adjacent service delivery environments"
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="14" height="10" stroke="currentColor" strokeWidth="1" />
        <circle cx="6" cy="9" r="1.5" stroke="currentColor" strokeWidth="1" />
        <circle cx="12" cy="9" r="1.5" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
    text: "Civilian-facing access & administrative platforms"
  }
];

const InstitutionalMarquee: React.FC = () => {
  return (
    <section 
      aria-label="Our initiatives and brands" 
      className="relative w-full overflow-hidden border-y border-white/[0.08] py-10 bg-black"
    >
      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .institutional-marquee {
          display: flex;
          width: max-content;
          animation: marqueeScroll 40s linear infinite;
        }
        .logo-item {
          flex-shrink: 0;
        }
      `}</style>

      {/* Edge Fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-black via-black/40 to-transparent sm:w-32"></div>
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-black via-black/40 to-transparent sm:w-32"></div>

      {/* Marquee Container */}
      <div className="institutional-marquee">
        {/* First Set */}
        {marqueeItems.map((item, index) => (
          <div key={`set1-${index}`} className="logo-item flex items-center gap-4 px-10 sm:px-14">
            <span className="logo-icon text-white/55 transition-all duration-300 hover:text-white">
              {item.icon}
            </span>
            <span className="logo-text whitespace-nowrap font-sans text-[13px] font-medium tracking-wide text-white/65 transition-all duration-300 sm:text-[14px] hover:text-white">
              {item.text}
            </span>
          </div>
        ))}
        {/* Second Set for Seamless Loop */}
        {marqueeItems.map((item, index) => (
          <div key={`set2-${index}`} className="logo-item flex items-center gap-4 px-10 sm:px-14">
            <span className="logo-icon text-white/55 transition-all duration-300 hover:text-white">
              {item.icon}
            </span>
            <span className="logo-text whitespace-nowrap font-sans text-[13px] font-medium tracking-wide text-white/65 transition-all duration-300 sm:text-[14px] hover:text-white">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InstitutionalMarquee;