'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    number: '01',
    title: 'Create your campaign',
    description:
      'Pick a birthday wishlist or a goal fundraiser, add what you\'re celebrating, and you\'re live in minutes.',
    visual: (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="32" height="26" rx="4" stroke="white" strokeWidth="2" fill="none" />
            <path d="M12 8 L12 4 M28 8 L28 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <rect x="10" y="16" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.6" />
            <rect x="10" y="22" width="14" height="3" rx="1.5" fill="white" fillOpacity="0.6" />
            <circle cx="20" cy="29" r="3" fill="white" fillOpacity="0.8" />
          </svg>
        </div>
        <p className="font-body text-sm text-white/60 text-center max-w-[200px]">Set up your campaign with a cover photo, title, and details.</p>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Share it everywhere',
    description:
      'One link is all it takes. Drop it on WhatsApp, Instagram, or wherever your people are.',
    visual: (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="2" fill="none" />
            <path d="M14 20 L18 24 L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28 8 L32 12 L28 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 24 L8 28 L12 32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-body text-sm text-white/60 text-center max-w-[200px]">Share your unique link anywhere your friends and family are.</p>
      </div>
    ),
  },
  {
    number: '03',
    title: 'Watch the gifts roll in',
    description:
      'Every contribution lands straight in your wallet. Withdraw whenever you\'re ready.',
    visual: (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 20 L16 28 L32 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="6" y="30" width="28" height="4" rx="2" fill="white" fillOpacity="0.5" />
            <circle cx="20" cy="10" r="3" fill="white" fillOpacity="0.7" />
            <circle cx="30" cy="6" r="2" fill="white" fillOpacity="0.4" />
            <circle cx="10" cy="6" r="2" fill="white" fillOpacity="0.4" />
          </svg>
        </div>
        <p className="font-body text-sm text-white/60 text-center max-w-[200px]">Funds arrive securely in your Altar wallet. Withdraw anytime.</p>
      </div>
    ),
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [mobileOpen, setMobileOpen] = useState<number | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(i);
          }
        },
        { threshold: 0.4 },
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div id="how-it-works" className="bg-primary w-full">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Section heading */}
        <div className="text-center mb-10 sm:mb-14">
          <h2
            className="font-heading font-medium text-white"
            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
          >
            How it works
          </h2>
          <p className="font-body text-white/60 mt-3 max-w-lg mx-auto" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}>
            From idea to gift in three simple steps. No spreadsheets, no awkward reminders — just a link.
          </p>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex gap-12 lg:gap-16 relative">
          {/* Left — sticky illustration area */}
          <div className="w-[45%] shrink-0">
            <div className="sticky top-24 h-[400px] rounded-2xl bg-primary-hover border border-white/10 overflow-hidden">
              {steps[activeStep].visual}
            </div>
          </div>

          {/* Right — steps */}
          <div className="flex-1 flex flex-col gap-16">
            {steps.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className={cn(
                  'transition-all duration-500',
                  i === activeStep
                    ? 'opacity-100'
                    : 'opacity-40',
                )}
              >
                <span className="font-mono font-medium text-5xl text-white/20 block mb-3">
                  {step.number}
                </span>
                <h3 className="font-heading font-medium text-2xl text-white mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-white/60 leading-relaxed max-w-md">
                  {step.description}
                </p>
              </div>
            ))}
            {/* Spacer so last step can reach the top of the viewport */}
            <div className="h-[200px]" />
          </div>
        </div>

        {/* Mobile layout — accordion */}
        <div className="flex md:hidden flex-col gap-4">
          {steps.map((step, i) => {
            const isOpen = mobileOpen === i;

            return (
              <div
                key={step.number}
                className="rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setMobileOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-medium text-white/40 text-sm">
                      {step.number}
                    </span>
                    <h3 className="font-heading font-medium text-base text-white">
                      {step.title}
                    </h3>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-white/40 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="h-48 rounded-xl bg-primary-hover border border-white/10 overflow-hidden mb-4">
                      {step.visual}
                    </div>
                    <p className="font-body text-sm text-white/60 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
