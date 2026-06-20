'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    number: '01',
    title: 'Create your campaign',
    description:
      'Pick a birthday wishlist or a goal fundraiser, add what you\'re celebrating, and you\'re live in minutes.',
  },
  {
    number: '02',
    title: 'Share it everywhere',
    description:
      'One link is all it takes. Drop it on WhatsApp, Instagram, or wherever your people are.',
  },
  {
    number: '03',
    title: 'Watch the gifts roll in',
    description:
      'Every contribution lands straight in your wallet. Withdraw whenever you\'re ready.',
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
            <div className="sticky top-10 sm:top-16 h-[580px] rounded-2xl bg-primary-hover border border-white/10 overflow-hidden relative">
              <Image src="/images/Step%201.png" alt="How it works" fill className="object-cover" />
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
