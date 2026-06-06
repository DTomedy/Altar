import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-5xl mx-auto w-full">
        <span className="font-display font-medium text-2xl text-primary">Altar</span>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="font-body font-medium text-body hover:text-primary transition-colors px-3 py-2 text-sm">
            Sign in
          </Link>
          <Link href="/auth?mode=register">
            <Button variant="primary">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="font-display font-medium text-4xl sm:text-5xl text-primary max-w-2xl mx-auto leading-tight">
            Give with intention
          </h1>
          <p className="font-body text-lg text-body/60 max-w-lg mx-auto mt-4 leading-relaxed">
            Create a birthday wishlist or goal campaign, share the link, and receive gifts from the people who matter most.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/auth?mode=register">
              <Button variant="primary">Create your first campaign</Button>
            </Link>
            <Link href="/auth">
              <Button variant="secondary">Sign in</Button>
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display font-medium text-3xl text-body text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-medium text-lg text-primary">1</span>
              </div>
              <h3 className="font-display font-medium text-lg text-body mb-2">Create a campaign</h3>
              <p className="font-body text-sm text-body/60">Set up a birthday wishlist or a goal fundraiser in under 2 minutes.</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-medium text-lg text-primary">2</span>
              </div>
              <h3 className="font-display font-medium text-lg text-body mb-2">Share the link</h3>
              <p className="font-body text-sm text-body/60">Send your campaign link on WhatsApp, Instagram, or anywhere your friends are.</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-medium text-lg text-primary">3</span>
              </div>
              <h3 className="font-display font-medium text-lg text-body mb-2">Receive gifts</h3>
              <p className="font-body text-sm text-body/60">Contributions go straight to your wallet. Withdraw anytime.</p>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display font-medium text-3xl text-body text-center mb-12">Why Altar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-display font-medium text-lg text-body mb-2">In-app wallet</h3>
              <p className="font-body text-sm text-body/60">All contributions are held securely in your Altar wallet. No awkward manual coordination.</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-display font-medium text-lg text-body mb-2">Anonymous giving</h3>
              <p className="font-body text-sm text-body/60">Contributors can give without revealing their identity. Sometimes the best gifts come from nowhere.</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-display font-medium text-lg text-body mb-2">Wishlist campaigns</h3>
              <p className="font-body text-sm text-body/60">List exactly what you want. Friends can contribute toward specific items.</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-display font-medium text-lg text-body mb-2">No account needed to give</h3>
              <p className="font-body text-sm text-body/60">Anyone with the link can contribute via card, bank transfer, or USSD. No sign-up required.</p>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-soft py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-medium text-lg text-primary">Altar</span>
          <p className="font-body text-xs text-muted text-center">
            Give with intention. &copy; {new Date().getFullYear()} Altar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
