import React from 'react';

/**
 * Hero Section Component
 * 
 * Clones the hero section of Civic Continuity with pixel-perfect accuracy.
 * Features:
 * - Pure black background with a dynamic radial gradient glow (atmosheric glow)
 * - Large serif headline with custom clamp sizing
 * - Minimalist typography and button group
 * - Responsive layout following the provided high-level design
 */
const Hero = () => {
  return (
    <section 
      id="hero" 
      className="relative flex min-h-[85vh] flex-col justify-center px-6 pt-20 sm:px-10 overflow-hidden bg-black selection:bg-white/20"
    >
      {/* Dynamic Background Glow Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-[-10%] -translate-y-[40%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(30, 58, 138, 0.8) 0%, rgba(30, 58, 138, 0) 70%)'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-[-30%] -translate-y-[20%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0) 70%)'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1000px]">
        <div className="transition-all duration-1000 ease-out animate-in fade-in slide-in-from-bottom-8">
          {/* Main Headline - Serif Variable Font */}
          <h1 className="mb-6 font-serif text-[clamp(2.25rem,6vw,5.5rem)] font-light leading-[1] text-white tracking-normal">
            Infrastructure built<br />to outlast people.
          </h1>

          {/* Description Text - Sans-serif */}
          <p className="mb-8 max-w-[500px] text-[15px] font-light leading-[1.6] text-white/60">
            We maintain systems that must continue when leadership changes, organisations dissolve, or incentives disappear.
          </p>

          {/* Button Group */}
          <div className="flex items-center gap-6">
            <button 
              className="group relative overflow-hidden border border-white/30 px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white/70 active:scale-[0.98]"
            >
              <span className="relative z-10">Contact</span>
              <span className="absolute inset-0 -translate-x-full bg-white/[0.03] transition-transform duration-500 group-hover:translate-x-0"></span>
            </button>

            <button 
              className="group relative flex items-center gap-2.5 px-2 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white/50 transition-all duration-300 hover:text-white"
            >
              <span className="underline-reveal">Learn More</span>
              {/* Arrow Icon with hover shift */}
              <svg 
                className="h-3 w-3 transition-transform duration-500 ease-out group-hover:translate-x-1.5" 
                viewBox="0 0 12 12" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M1 6H11M11 6L6 1M11 6L6 11" 
                  stroke="currentColor" 
                  strokeWidth="1.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Underline Reveal Utility Styling (referenced in globals.css) */}
      <style jsx global>{`
        .underline-reveal {
          position: relative;
          text-decoration: none;
        }
        .underline-reveal::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: currentColor;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .group:hover .underline-reveal::after {
          width: 100%;
        }
      `}</style>
    </section>
  );
};

export default Hero;