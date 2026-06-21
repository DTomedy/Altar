'use client';

import Image from 'next/image';
import { Wallet, MaskHappy, Gift, Smiley } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useInView } from '@/lib/hooks/useInView';

const features = [
  {
    icon: Wallet,
    title: 'In-app wallet',
    description:
      'All contributions are held securely in your Altar wallet. No awkward manual coordination.',
  },
  {
    icon: MaskHappy,
    title: 'Anonymous giving',
    description:
      'Contributors can give without revealing their identity. Sometimes the best gifts come from nowhere.',
  },
  {
    icon: Gift,
    title: 'Wishlist campaigns',
    description:
      'List exactly what you want. Friends can contribute toward specific items.',
  },
  {
    icon: Smiley,
    title: 'No account needed to give',
    description:
      'Anyone with the link can contribute via card, bank transfer, or USSD. No sign-up required.',
  },
];

export function FeatureCards() {
  const [headingRef, headingInView] = useInView<HTMLDivElement>();
  const [illustrationRef, illustrationInView] = useInView<HTMLDivElement>();
  const [gridRef, gridInView] = useInView<HTMLDivElement>();

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
      {/* Left — heading + illustration */}
      <div className="w-full lg:w-[35%] lg:sticky lg:top-16">
        <div ref={headingRef}>
          <h2
            className={cn(
              'font-heading font-bold text-body leading-tight transition-all duration-500 ease-out',
              headingInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
            )}
            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
          >
            Give with intention,<br />
            <span className="text-primary">not coordination.</span>
          </h2>
          <p
            className={cn(
              'font-body text-body/80 mt-4 leading-relaxed transition-all duration-500 ease-out delay-100',
              headingInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
            )}
            style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}
          >
            Altar makes it simple to ask for what you actually want and easy for the people who love you to show up.
          </p>
        </div>

        <div
          ref={illustrationRef}
          className={cn(
            'mt-8 max-md:ml-0 max-md:w-full md:-ml-4 lg:-ml-8 md:w-[calc(100%+1rem)] lg:w-[calc(100%+2rem)] transition-all duration-500 ease-out',
            illustrationInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8',
          )}
        >
          <Image src="/images/Feature.svg" alt="" width={569} height={399} className="w-full h-auto" />
        </div>
      </div>

      {/* Right — feature grid */}
      <div className="w-full lg:w-[60%]">
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={cn(
                'transition-all duration-500 ease-out',
                gridInView
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-5',
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <feature.icon className="w-6 h-6 text-primary mb-3" weight="bold" />
              <h3 className="font-heading font-medium text-base text-body mb-1.5">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-body/80 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
