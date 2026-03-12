import React from 'react';

const initiatives = [
  {
    title: 'Solehaven',
    description: 'Repair and recovery infrastructure built to persist beyond commercial product cycles.',
  },
  {
    title: 'Civitas Core',
    description: 'Neutral operational infrastructure supporting public-adjacent systems without political or vendor capture.',
  },
  {
    title: 'Continuity Platform',
    description: 'Systems that connect fragmented administrative and service environments into a resilient backbone.',
  },
  {
    title: 'Permanence Systems',
    description: 'Stewardship frameworks designed to survive leadership, vendor, and governance transitions.',
  },
  {
    title: 'NDIS Integrity Unit',
    description: 'A mandate-bounded intelligence system supporting integrity analysis within the National Disability Insurance Scheme.',
  },
];

const InitiativesGrid: React.FC = () => {
  return (
    <section 
      id="initiatives" 
      className="border-t border-white/5 bg-black px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Section Header */}
        <div className="transition-all duration-800 ease-out">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
            Initiatives
          </p>
          <h2 className="mb-12 max-w-[600px] font-serif text-[clamp(1.5rem,3vw,2rem)] font-light leading-[1.3] text-white/70">
            Long-horizon stewardship frameworks operated under distinct mandates.
          </h2>
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {initiatives.map((item, index) => (
            <div 
              key={item.title} 
              className="transition-all duration-700 ease-out"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <p className="mb-2 text-[13px] font-medium text-white">
                {item.title}
              </p>
              <p className="text-[12px] leading-relaxed text-white/40">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footnotes */}
        <div className="mt-16 transition-all duration-800 ease-out">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-white/30">
              Additional internal programs exist to support these mandates.
            </p>
            <p className="text-[11px] text-white/40">
              Initiatives may conclude or evolve.{' '}
              <span className="text-white/70">The institutional standard does not.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InitiativesGrid;