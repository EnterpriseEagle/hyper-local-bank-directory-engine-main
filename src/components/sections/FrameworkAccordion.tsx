"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

const AccordionItem = ({ title, content, isOpen, onClick }: AccordionItemProps) => {
  return (
    <div className="border-b border-white/5">
      <button
        onClick={onClick}
        className="group flex w-full items-center justify-between py-5 text-left transition-colors duration-300 hover:text-white/80 focus:outline-none"
      >
        <span className="font-sans text-[15px] font-light text-white transition-transform duration-300 group-hover:translate-x-0.5">
          {title}
        </span>
        <span
          className={cn(
            "text-[14px] text-white/40 transition-all duration-300 group-hover:text-white/70",
            isOpen && "rotate-45"
          )}
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100 mb-6" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-4 border-l border-white/10 pl-4">
          {content}
        </div>
      </div>
    </div>
  );
};

const FrameworkAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const sections = [
    {
      title: "Why We Exist",
      content: (
        <>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            Most systems don&apos;t fail because they&apos;re impossible to maintain. They fail because responsibility disappears.
          </p>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            Leadership changes. Organisations dissolve. Funding cycles end. Incentives shift. At each transition, accountability fragments and essential systems quietly collapse.
          </p>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            Civic Continuity exists to absorb that fragility. We build and maintain infrastructure designed to continue functioning regardless of who is present, motivated, or alive.
          </p>
        </>
      ),
    },
    {
      title: "Partnerships",
      content: (
        <>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            We partner with organisations where stability and public trust are non-negotiable. Government bodies, utilities, essential service providers, and institutions managing long-term public obligations.
          </p>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            We are not a vendor. We do not compete for contracts. Engagements are selective and structured around permanence, not revenue.
          </p>
        </>
      ),
    },
    {
      title: "Governance",
      content: (
        <>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            Structural separation between oversight and operations. Conservative risk controls across all initiatives. Documented succession protocols at every level.
          </p>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            No single individual can redirect the institution. No single failure point can compromise continuity.
          </p>
        </>
      ),
    },
    {
      title: "Policy",
      content: (
        <>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            Apolitical. Non-lobbying. Non-campaigning.
          </p>
          <p className="font-sans text-[14px] font-light leading-[1.7] text-white/60">
            We do not pursue ideological outcomes or engage in advocacy. Neutrality is an operational requirement, not a position.
          </p>
        </>
      ),
    },
  ];

  return (
    <section id="faq" className="border-t border-white/5 px-6 py-16 sm:px-10 sm:py-24 bg-black">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="transition-all duration-900 ease-out">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium">
            Framework
          </p>
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] font-light leading-[1.1] text-white tracking-[-0.01em]">
            Institutional Architecture
          </h2>
          <div className="border-t border-white/5">
            {sections.map((section, index) => (
              <AccordionItem
                key={index}
                title={section.title}
                content={section.content}
                isOpen={openIndex === index}
                onClick={() => toggleItem(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrameworkAccordion;