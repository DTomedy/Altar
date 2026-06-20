import { Wallet, MaskHappy, Gift, Smiley } from '@phosphor-icons/react';

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
  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
      {/* Left — heading + illustration */}
      <div className="w-full lg:w-[35%] lg:sticky lg:top-16">
        <h2
          className="font-heading font-medium text-body leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
        >
          Give with intention,<br />
          <span className="text-primary">not coordination.</span>
        </h2>
        <p className="font-body text-body/60 mt-4 leading-relaxed" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}>
          Altar makes it simple to ask for what you actually want and easy for the people who love you to show up.
        </p>

        <div className="mt-8 hidden lg:block">
          <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[200px] text-primary">
            <rect x="20" y="60" width="60" height="80" rx="8" fill="currentColor" fillOpacity="0.12" />
            <rect x="30" y="72" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
            <rect x="30" y="82" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
            <rect x="30" y="92" width="34" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
            <circle cx="50" cy="110" r="6" fill="currentColor" fillOpacity="0.3" />
            <rect x="90" y="40" width="60" height="80" rx="8" fill="currentColor" fillOpacity="0.20" />
            <rect x="100" y="52" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.35" />
            <rect x="100" y="62" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.35" />
            <rect x="100" y="72" width="34" height="4" rx="2" fill="currentColor" fillOpacity="0.35" />
            <circle cx="120" cy="90" r="6" fill="currentColor" fillOpacity="0.4" />
            <rect x="160" y="50" width="60" height="80" rx="8" fill="currentColor" fillOpacity="0.08" />
            <rect x="170" y="62" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.20" />
            <rect x="170" y="72" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.20" />
            <rect x="170" y="82" width="34" height="4" rx="2" fill="currentColor" fillOpacity="0.20" />
            <circle cx="190" cy="100" r="6" fill="currentColor" fillOpacity="0.25" />
            <path d="M50 140 L50 170 L190 170 L190 140" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" fill="none" />
            <path d="M70 148 L120 148" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
            <path d="M70 156 L140 156" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Right — feature grid */}
      <div className="w-full lg:w-[60%]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
          {features.map((feature) => (
            <div key={feature.title}>
              <feature.icon className="w-6 h-6 text-primary mb-3" weight="bold" />
              <h3 className="font-display font-medium text-base text-body mb-1.5">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-body/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
