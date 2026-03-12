import React from 'react';

/**
 * Navigation component for Civic Continuity.
 * Features:
 * - Fixed top positioning with high-blur glassmorphism.
 * - Minimalist "CC" logo in serif font.
 * - Uppercase menu items with letter-spacing (tracking).
 * - Opacity-based hover transitions and underline reveals.
 * - Custom bottom gradient border for high-end aesthetic.
 */
const Navigation: React.FC = () => {
  const navItems = [
    { label: 'About', href: '#work' },
    { label: 'Operations', href: '#services' },
    { label: 'Framework', href: '#faq' },
    { label: 'Initiatives', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 transition-opacity duration-500 opacity-100">
      {/* Background Layers for Depth and Glassmorphism */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent backdrop-blur-[32px] backdrop-saturate-150" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      />
      
      {/* Subtle top subtle highlights */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Top ambient line highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Main Bottom Border with Gradient and Glow */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_1px_8px_rgba(255,255,255,0.05)] pointer-events-none" />

      {/* Navigation Content Container */}
      <div className="relative mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 sm:px-10">
        
        {/* Logo Section */}
        <a 
          href="/" 
          className="group transition-opacity hover:opacity-70 flex items-center"
          aria-label="Civic Continuity Home"
        >
          <span className="font-serif text-2xl font-light tracking-wider text-white">
            CC
          </span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="underline-reveal text-[10px] uppercase font-medium tracking-[0.25em] text-white/40 transition-colors duration-300 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Mobile Toggle (Visual placeholder for pixel-perfect structure) */}
        <button 
          className="flex h-10 w-10 flex-col items-center justify-center lg:hidden"
          aria-label="Toggle Menu"
        >
          <div className="space-y-1.5 flex flex-col items-end">
            <span className="block h-px w-5 bg-white/80"></span>
            <span className="block h-px w-3 bg-white/80"></span>
            <span className="block h-px w-5 bg-white/80"></span>
          </div>
        </button>
      </div>

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
          bottom: -4px;
          left: 0;
          background-color: white;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0.6;
        }

        .underline-reveal:hover::after {
          width: 100%;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;