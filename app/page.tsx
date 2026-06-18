import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button, Card } from '@/components/ui';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';

const FeatureCards = dynamic(() => import('@/components/landing/FeatureCards').then(mod => mod.FeatureCards), {
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
              <h1 className="font-display font-semibold text-primary leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                Give with intention
              </h1>
              <p className="font-body text-body/60 max-w-lg mt-4 leading-relaxed" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}>
                Create a birthday wishlist or goal campaign, share the link, and receive gifts from the people who matter most.
              </p>
              <div className="flex items-center mt-8 justify-center lg:justify-start">
                <Link href="/auth?mode=register">
                  <Button variant="primary">Create your Campaign</Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <Image src="/images/hero.svg" alt="Hero illustration" width={600} height={500} className="w-full max-w-2xl h-auto" priority />
            </div>
          </div>
        </section>
        </div>

        {/* How it works */}
        <div className="bg-primary/70 w-full">
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <h2 className="font-display font-semibold text-white text-center mb-8 sm:mb-12" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card className="text-center p-6 border-none">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-semibold text-lg text-primary">1</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-body mb-2">Create a campaign</h3>
              <p className="font-body text-sm text-body/60">Set up a birthday wishlist or a goal fundraiser in under 2 minutes.</p>
            </Card>
            <Card className="text-center p-6 border-none">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-semibold text-lg text-primary">2</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-body mb-2">Share the link</h3>
              <p className="font-body text-sm text-body/60">Send your campaign link on WhatsApp, Instagram, or anywhere your friends are.</p>
            </Card>
            <Card className="text-center p-6 border-none">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-semibold text-lg text-primary">3</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-body mb-2">Receive gifts</h3>
              <p className="font-body text-sm text-body/60">Contributions go straight to your wallet. Withdraw anytime.</p>
            </Card>
          </div>
        </section>
        </div>

        {/* Features */}
        <div className="bg-white">
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <h2 className="font-display font-semibold text-body text-center mb-8 sm:mb-12" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>Why Altar</h2>
          <FeatureCards />
        </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
