import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-primary w-full">
        <LandingHeader />
      </div>

      <main className="flex-1 bg-page py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-semibold text-3xl text-body mb-2">Privacy Policy</h1>
          <p className="font-body text-sm text-body/60 mb-8">Last updated: June 2026</p>

          <div className="space-y-6 font-body text-sm text-body/80 leading-relaxed">
            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">1. Introduction</h2>
              <p>
                Altar (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="mt-2">
                By using Altar, you consent to the practices described in this policy. If you do not agree, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">2. Information We Collect</h2>

              <h3 className="font-display font-semibold text-base text-body mb-1 mt-4">Account Information</h3>
              <p>
                When you register, we collect your name, email address, phone number, and a password (stored securely as a hash).
              </p>

              <h3 className="font-display font-semibold text-base text-body mb-1 mt-4">KYC Documents</h3>
              <p>
                To verify your identity for withdrawals, we collect government-issued identification documents (NIN, passport, driver&apos;s license, or voter&apos;s card). These are stored securely on Cloudinary with restricted access.
              </p>

              <h3 className="font-display font-semibold text-base text-body mb-1 mt-4">Bank Information</h3>
              <p>
                To process withdrawals, we collect your Nigerian bank account number, bank code, bank name, and account name.
              </p>

              <h3 className="font-display font-semibold text-base text-body mb-1 mt-4">Campaign Content</h3>
              <p>
                We collect the content you create, including campaign titles, descriptions, cover photos, wishlist items, and messages to contributors.
              </p>

              <h3 className="font-display font-semibold text-base text-body mb-1 mt-4">Payment Information</h3>
              <p>
                We do not collect or store payment card details. All payment processing is handled by Flutterwave, a licensed payment gateway. We receive confirmation of successful transactions but no sensitive financial data.
              </p>

              <h3 className="font-display font-semibold text-base text-body mb-1 mt-4">Usage Data</h3>
              <p>
                We automatically collect certain information when you visit the Platform, including your IP address, browser type, operating system, referring URLs, and pages viewed.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Provide, maintain, and improve the Platform</li>
                <li>Process transactions and withdrawals</li>
                <li>Verify your identity (KYC)</li>
                <li>Send transactional emails (e.g., contribution notifications, withdrawal confirmations)</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
                <li>Send service-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">4. Information Sharing</h2>
              <p>We share your information only with trusted third-party service providers who help us operate the Platform:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Flutterwave</strong> — Payment processing (contribution payments and withdrawals)</li>
                <li><strong>Cloudinary</strong> — File storage for cover photos and KYC documents</li>
                <li><strong>Resend</strong> — Transactional email delivery</li>
                <li><strong>Vercel</strong> — Platform hosting and infrastructure</li>
              </ul>
              <p className="mt-2">
                We do not sell your personal information to third parties. We may disclose information if required by law or to protect our rights.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Password hashing using bcrypt</li>
                <li>JWT-based authentication with httpOnly cookies</li>
                <li>Authenticated access for KYC documents</li>
                <li>Rate limiting on sensitive endpoints</li>
              </ul>
              <p className="mt-2">
                While we strive to protect your data, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">6. Data Retention</h2>
              <p>
                We retain your account information for as long as your account is active. If you delete your account, we retain data only as required by law or for legitimate business purposes. KYC documents are retained in accordance with regulatory requirements.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, please contact us through the Platform. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">8. Cookies</h2>
              <p>
                We use essential cookies for authentication and platform functionality. We do not use tracking cookies or third-party analytics cookies. You can configure your browser to reject cookies, but this may affect Platform functionality.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">9. Children&apos;s Privacy</h2>
              <p>
                The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal data, we will take steps to delete it.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Significant changes will be notified to users via email or through the Platform.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-lg text-body mb-2">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through the Platform or via the support email provided on our website.
              </p>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
