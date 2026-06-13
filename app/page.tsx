import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { FeatureCards } from '@/components/landing/FeatureCards';

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <div className="bg-primary w-full px-12">
        <header className="flex items-center justify-between py-6 max-w-7xl mx-auto w-full">
          <img src="/logo/Altar Logo_white.svg" alt="Altar" className="h-8 w-auto" />
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="secondary" className="text-white hover:bg-transparent">Log in</Button>
            </Link>
            <Link href="/auth?mode=register">
              <Button variant="ghost">Get started</Button>
            </Link>
          </div>
        </header>
      </div>

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-[url('/images/hero_Bg.svg')] bg-cover bg-center bg-no-repeat">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="font-display font-medium text-4xl sm:text-[56px] text-primary leading-tight">
                Give with intention
              </h1>
              <p className="font-body text-lg text-body/60 max-w-lg mt-4 leading-relaxed">
                Create a birthday wishlist or goal campaign, share the link, and receive gifts from the people who matter most.
              </p>
              <div className="flex items-center mt-8 justify-center lg:justify-start">
                <Link href="/auth?mode=register">
                  <Button variant="primary">Create your Campaign</Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <img src="/images/hero.svg" alt="Hero illustration" className="w-full max-w-2xl h-auto" />
            </div>
          </div>
        </section>
        </div>

        {/* How it works */}
        <div className="bg-primary/70 w-full">
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display font-medium text-4xl text-white text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="text-center p-6 border-none">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-medium text-lg text-primary">1</span>
              </div>
              <h3 className="font-display font-medium text-lg text-body mb-2">Create a campaign</h3>
              <p className="font-body text-sm text-body/60">Set up a birthday wishlist or a goal fundraiser in under 2 minutes.</p>
            </Card>
            <Card className="text-center p-6 border-none">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-medium text-lg text-primary">2</span>
              </div>
              <h3 className="font-display font-medium text-lg text-body mb-2">Share the link</h3>
              <p className="font-body text-sm text-body/60">Send your campaign link on WhatsApp, Instagram, or anywhere your friends are.</p>
            </Card>
            <Card className="text-center p-6 border-none">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-medium text-lg text-primary">3</span>
              </div>
              <h3 className="font-display font-medium text-lg text-body mb-2">Receive gifts</h3>
              <p className="font-body text-sm text-body/60">Contributions go straight to your wallet. Withdraw anytime.</p>
            </Card>
          </div>
        </section>
        </div>

        {/* Features */}
        <div className="bg-white">
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display font-medium text-4xl text-body text-center mb-12">Why Altar</h2>
          <FeatureCards />
        </section>
        </div>
      </main>

      <footer className="bg-primary py-8 px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/logo/Altar Logo_white.svg" alt="Altar" className="h-6 w-auto" />
          <p className="font-body text-xs text-white/60 text-center">
            Give with intention. &copy; {new Date().getFullYear()} Altar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
