import React from 'react';

const ContactCTA: React.FC = () => {
  return (
    <div id="contact" className="relative">
      <section className="border-t border-white/5 px-6 py-20 sm:px-10 sm:py-28 bg-black">
        <div className="mx-auto w-full max-w-[600px] text-center">
          {/* Main Headline */}
          <h2 
            className="mb-6 font-serif font-light text-white"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.01em'
            }}
          >
            Built for those who build systems.
          </h2>

          {/* Supporting Paragraph */}
          <p 
            className="mb-8 font-sans font-light text-white/50"
            style={{
              fontSize: '14px',
              lineHeight: '1.7'
            }}
          >
            We work with public institutions, regulated industries, and civilian networks where long-term stability matters.
          </p>

          {/* Animated Email Link */}
          <div className="flex justify-center">
            <a 
              href="mailto:contact@civiccontinuity.com" 
              className="group relative inline-block font-sans text-white transition-opacity hover:opacity-80"
              style={{
                fontSize: '14px',
                letterSpacing: '0.02em'
              }}
            >
              <span className="relative pb-1">
                contact@civiccontinuity.com
                <span 
                  className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-gradient-to-r from-white/80 to-white/40 transition-all duration-700 ease-in-out group-hover:w-full"
                  aria-hidden="true"
                />
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactCTA;