import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-primary w-full">
        <LandingHeader />
      </div>

      <main className="flex-1 bg-page py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-medium text-3xl text-body mb-2">Terms of Service</h1>
          <p className="font-body text-sm text-body/80 mb-8">Last updated: June 2026</p>

          <div className="space-y-6 font-body text-sm text-body/80 leading-relaxed">
            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Altar (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">2. Description of Service</h2>
              <p>
                Altar is a personal crowdfunding platform for the Nigerian market. Users create celebration campaigns (birthday wishlists or goal-based campaigns), share a single link, and receive contributions directly into an in-app wallet.
              </p>
              <p className="mt-2">
                Altar is not a charity, public giving platform for causes, or investment platform. All contributions are voluntary gifts. No equity, returns, or financial interest is offered or implied.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">3. Eligibility</h2>
              <p>
                You must be at least 18 years old to create a campaign. By creating an account, you confirm that you are at least 18 years of age and that the information you provide is accurate and complete.
              </p>
              <p className="mt-2">
                Contributors do not need an account. By contributing to a campaign, you confirm that you are at least 18 years old.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">4. Account Registration and KYC</h2>
              <p>
                To create a campaign, you must register for an account. You are responsible for maintaining the confidentiality of your login credentials.
              </p>
              <p className="mt-2">
                Altar requires identity verification (KYC) before you can withdraw funds. You agree to provide accurate and current identification documents when requested. KYC levels determine withdrawal limits as described on the Platform.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">5. Campaign Rules</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Campaigns must be for lawful personal celebrations or goals.</li>
                <li>You may not create campaigns for fraudulent, misleading, or illegal purposes.</li>
                <li>You are solely responsible for the accuracy of your campaign content.</li>
                <li>Altar reserves the right to remove or suspend any campaign that violates these Terms.</li>
                <li>Campaigns that reach their funding goal may optionally allow overflow contributions.</li>
                <li>Expired campaigns that did not reach their goal may be deleted by the owner. Collected funds remain in the owner&apos;s wallet.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">6. Contributions</h2>
              <p>
                All contributions are processed through Flutterwave, a licensed payment gateway in Nigeria. Altar does not store or process payment card details.
              </p>
              <p className="mt-2">
                Contributions are final and non-refundable. If a contribution fails, the funds are not deducted from the contributor&apos;s account. In the event of a dispute, Altar will assist in resolving it but is not liable for payment processing errors by Flutterwave.
              </p>
              <p className="mt-2">
                Contributors may choose to give anonymously. Altar will not disclose the contributor&apos;s identity for anonymous contributions.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">7. Platform Fees</h2>
              <p>
                Altar charges a platform fee on each successful contribution. The current fee structure is displayed on the Platform before a contribution is completed. Fees are subject to change with notice.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">8. Wallet and Withdrawals</h2>
              <p>
                All contributions are held in your Altar wallet. Withdrawals are processed to a Nigerian bank account you provide. Withdrawal limits are determined by your KYC level.
              </p>
              <p className="mt-2">
                Withdrawals are processed within 1-3 business days. Altar is not responsible for delays caused by your bank or incorrect account details provided by you.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">9. Prohibited Activities</h2>
              <p>You may not use Altar for:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Fraudulent, deceptive, or misleading campaigns</li>
                <li>Money laundering or illegal transactions</li>
                <li>Purchasing or selling prohibited goods or services</li>
                <li>Impersonating another person or entity</li>
                <li>Harassing, abusing, or harming others</li>
                <li>Violating any applicable Nigerian law or regulation</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">10. Limitation of Liability</h2>
              <p>
                Altar is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, Altar shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
              </p>
              <p className="mt-2">
                Altar&apos;s total liability for any claim arising from these Terms or your use of the Platform is limited to the total fees paid by you to Altar in the six months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">11. Termination</h2>
              <p>
                Altar may suspend or terminate your account at any time for violation of these Terms. Upon termination, any funds in your wallet will be disbursed to your linked bank account after applicable holds and verification.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">12. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be resolved through the courts of Nigeria.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">13. Changes to Terms</h2>
              <p>
                Altar reserves the right to update these Terms at any time. Users will be notified of material changes via email or through the Platform. Continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display font-medium text-lg text-body mb-2">14. Contact</h2>
              <p>
                For questions about these Terms, please contact us through the Platform or via the support email provided on our website.
              </p>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
