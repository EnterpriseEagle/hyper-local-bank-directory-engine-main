import React from 'react';

const Operations = () => {
  return (
    <div id="services">
      <section className="relative border-t border-white/5 px-6 py-20 sm:px-10 sm:py-28">
        <div className="transition-all duration-1000 ease-out">
          <div className="mx-auto w-full max-w-[1000px]">
            {/* Label */}
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium">
              Operations
            </p>

            {/* Heading */}
            <h2 className="mb-8 font-serif text-[clamp(1.75rem,4vw,3.125rem)] font-light leading-[1.1] text-white tracking-normal">
              Systems, not campaigns.
            </h2>

            {/* Content Row */}
            <div className="flex flex-col sm:flex-row items-start gap-8 sm:gap-12">
              {/* Description */}
              <div className="max-w-[600px]">
                <p className="text-[15px] font-light leading-[1.7] text-white/60 font-sans">
                  If a system requires constant attention, promotion, or fundraising to survive, it is not infrastructure. Our focus is durability, not visibility.
                </p>
              </div>

              {/* Technical SVG Diagram */}
              <div className="relative mt-1 hidden sm:block">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-30"
                >
                  {/* Outer circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                  {/* Inner small circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  {/* Grid / Technical markings */}
                  <g stroke="currentColor" strokeWidth="0.5">
                    <line x1="32" y1="2" x2="32" y2="12" />
                    <line x1="32" y1="52" x2="32" y2="62" />
                    <line x1="2" y1="32" x2="12" y2="32" />
                    <line x1="52" y1="32" x2="62" y2="32" />
                    <line x1="10" y1="10" x2="18" y2="18" />
                    <line x1="46" y1="46" x2="54" y2="54" />
                  </g>
                  {/* Medium circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="15"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Operations;