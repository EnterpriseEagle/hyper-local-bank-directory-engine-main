import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black px-6 py-12 sm:px-10">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand Section */}
        <div className="flex items-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/40">
            Civic Continuity
          </p>
        </div>

        {/* Utility Links Section */}
        <div className="flex items-center gap-6 text-[11px] font-light text-white/30">
          <a
            href="/whitepaper"
            className="underline-reveal transition-colors duration-300 hover:text-white"
          >
            Whitepaper
          </a>
          <a
            href="/policy"
            className="underline-reveal transition-colors duration-300 hover:text-white"
          >
            Policy
          </a>
          <span className="cursor-default select-none tabular-nums text-white/20">
            © {currentYear}
          </span>
        </div>
      </div>

      {/* Adding the utility styles locally in case they aren't globally available for this specific component scope */}
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

        .underline-reveal:hover::after {
          width: 100%;
        }
      `}</style>
    </footer>
  );
};

export default Footer;