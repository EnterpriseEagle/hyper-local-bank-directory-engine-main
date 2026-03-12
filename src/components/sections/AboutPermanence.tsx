import React from 'react';

const AboutPermanence: React.FC = () => {
  return (
    <div id="work">
      <section className="relative flex min-h-screen items-start justify-center overflow-hidden border-t border-white/5 px-6 pt-[20vh] pb-24 sm:px-8 sm:pt-[22vh] sm:pb-32 lg:px-20 bg-background">
        <div className="mx-auto w-full max-w-[900px] text-center">
          {/* Label */}
          <div className="mb-10 sm:mb-12">
            <p className="mx-auto text-center text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
              What We Are
            </p>
          </div>

          {/* Large Serif Heading */}
          <h2 className="mb-16 font-serif text-[clamp(2rem,6vw,4rem)] font-light leading-[1.15] tracking-[-0.02em] text-foreground sm:mb-20">
            <span className="inline">An </span>
            <span className="inline">institution </span>
            <span className="inline">designed </span>
            <span className="inline">for </span>
            <span className="inline">permanence.</span>
          </h2>

          {/* Centered Paragraphs */}
          <div className="mx-auto max-w-[650px] space-y-6 sm:space-y-7">
            <p className="text-[16px] leading-[1.7] text-white/90 sm:text-[17px] sm:leading-[1.8] font-light">
              <span className="inline">Most </span>
              <span className="inline">organisations </span>
              <span className="inline">are </span>
              <span className="inline">built </span>
              <span className="inline">around </span>
              <span className="inline">people.</span>
            </p>
            <p className="text-[16px] leading-[1.7] text-white/90 sm:text-[17px] sm:leading-[1.8] font-light">
              <span className="inline">Civic </span>
              <span className="inline">Continuity </span>
              <span className="inline">is </span>
              <span className="inline">built </span>
              <span className="inline">around </span>
              <span className="inline">continuity, </span>
              <span className="inline">ensuring </span>
              <span className="inline">critical </span>
              <span className="inline">civilian </span>
              <span className="inline">systems </span>
              <span className="inline">remain </span>
              <span className="inline">intact </span>
              <span className="inline">as </span>
              <span className="inline">individuals </span>
              <span className="inline">come </span>
              <span className="inline">and </span>
              <span className="inline">go.</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPermanence;