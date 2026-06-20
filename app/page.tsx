import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';

const FeatureCards = dynamic(() => import('@/components/landing/FeatureCards').then(mod => mod.FeatureCards), {
  ssr: true,
});

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => mod.HowItWorks), {
  ssr: true,
});

const PublicCampaignsSection = dynamic(() => import('@/components/landing/PublicCampaignsSection').then(mod => mod.PublicCampaignsSection), {
  ssr: true,
});

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <div className="bg-primary w-full">
        <LandingHeader />
      </div>

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-[url('/images/hero_Bg.svg')] bg-cover bg-center bg-no-repeat">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="font-heading font-medium text-primary leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                Give with intention
              </h1>
              <p className="font-body text-body/60 max-w-lg mt-4 leading-relaxed" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}>
                Create a wishlist or fundraiser, share one link, and let the people who love you show up.
              </p>
              <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
                <Link href="/auth?mode=register">
                  <Button variant="primary">Create your Campaign</Button>
                </Link>
                <Link
                  href="/#how-it-works"
                  className="font-body font-medium text-sm text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
                >
                  See how it works &rarr;
                </Link>
              </div>
              <p className="font-body text-xs text-body/40 mt-6 text-center lg:text-left">
                Trusted by people celebrating birthdays &amp; big goals across Nigeria
              </p>
            </div>
            <div className="flex-1 relative flex justify-center lg:justify-end">
              <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
              <Image src="/images/Feature%20Image.svg" alt="Feature illustration" width={381} height={616} className="w-full max-w-sm h-auto relative z-0" priority />
            </div>
          </div>
        </section>
        </div>

        <HowItWorks />

        {/* Features */}
        <div id="features" className="bg-white">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <FeatureCards />
        </section>
        </div>

        <PublicCampaignsSection />
      </main>

      <LandingFooter />
    </div>
  );
}
