import { useNavigate } from "react-router-dom";
import { ConditionalHeader } from "@/components/ConditionalHeader";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <ConditionalHeader />

      {/* Terms Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl pt-[80px]">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-2">Subamerica Network – Terms of Service</h1>
        
        {/* Effective dates */}
        <div className="text-muted-foreground mb-4">
          <p><strong>Effective Date:</strong> October 2025</p>
          <p><strong>Last Updated:</strong> October 15, 2025</p>
        </div>
        
        {/* Welcome message */}
        <p className="text-xl mb-12 text-primary font-semibold">
          Welcome to Subamerica — Indie Underground. Stream fearless art, sound & stories 24/7.
        </p>

        <hr className="mb-12 border-border" />

        {/* Section 1: Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica Network ("Subamerica," "we," "our," or "us") is an independent media and entertainment company that empowers artists and audiences through 24/7 streaming, AI-driven discovery, and creator-first economics.
            </p>
            <p>
              By accessing or using <strong>subamerica.net</strong>, our <strong>mobile apps</strong>, <strong>creator portal</strong>, or our <strong>OTT TV channels</strong> (including Roku, Fire TV, and Google TV), you agree to these Terms of Service ("Terms"). These Terms govern all use of Subamerica's websites, applications, and services (collectively, the "Services").
            </p>
            <p>
              If you do not agree to these Terms, do not use our Services.
            </p>
          </div>
        </section>

        {/* Section 2: Eligibility */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              You must be at least <strong>13 years old</strong> (or the minimum age of digital consent in your country) to use Subamerica.
              If you are between 13 and 18, you must have parental or guardian consent to register or upload content.
            </p>
            <p>
              By using Subamerica, you represent that you have the legal capacity to enter this agreement.
            </p>
          </div>
        </section>

        {/* Section 3: Your Account */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">3. Your Account</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Artists and creators must register for a Subamerica account to upload, sell, or publish content.
              You are responsible for safeguarding your password and for all activities under your account.
            </p>
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Not share your login credentials</li>
              <li>Notify us immediately if you suspect unauthorized access</li>
            </ul>
            <p>
              Subamerica reserves the right to suspend or terminate any account violating these Terms.
            </p>
          </div>
        </section>

        {/* Section 4: Creator Rights and Responsibilities */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">4. Creator Rights and Responsibilities</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica is a <strong>non-exclusive distribution platform</strong>.
              You <strong>retain 100% ownership of your masters, copyrights, and creative works</strong>.
              By uploading content, you grant Subamerica a <strong>non-exclusive, worldwide, royalty-free license</strong> to host, stream, promote, and distribute your content via web, mobile, and OTT channels.
            </p>
            <p>
              You may remove your content at any time by deleting it from your Creator Portal or emailing{" "}
              <a href="mailto:support@subamerica.net" className="text-primary hover:underline">support@subamerica.net</a>.
              Upon removal, the license terminates within 48 hours, except as required for archival or compliance purposes.
            </p>
            <p>You are solely responsible for ensuring that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You own or control the rights to the content you upload</li>
              <li>Your uploads do not infringe on others' intellectual property, privacy, or publicity rights</li>
              <li>Your content complies with local laws and community guidelines</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Monetization and Payments */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. Monetization and Payments</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica empowers creators with <strong>direct-to-fan commerce</strong> via QR codes, live tipping, merch sales, and memberships.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-foreground">Revenue Share</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>80% to creators</strong>, <strong>20% to Subamerica</strong> (covering infrastructure, processing, and hosting).</li>
              <li>No hidden fees, long-term contracts, or exclusivity.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-foreground">Payouts</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payments are processed instantly via <strong>Stripe Connect</strong>.</li>
              <li>Minimum payout threshold: <strong>$1.00 USD</strong>.</li>
              <li>You are responsible for any applicable taxes.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-foreground">Refunds</h3>
            <p>
              All purchases (tips, tickets, or digital sales) are non-refundable unless required by law.
            </p>
          </div>
        </section>

        {/* Section 6: Content Guidelines */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">6. Content Guidelines</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica celebrates freedom of expression and underground culture. However, creators must not upload:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Hate speech, harassment, or discriminatory content</li>
              <li>Non-consensual or exploitative material</li>
              <li>Content that violates copyright or intellectual property</li>
              <li>Explicit sexual acts or violent imagery without appropriate labeling</li>
              <li>Misinformation or malicious impersonation</li>
            </ul>
            <p>
              We reserve the right to remove content that violates these guidelines or applicable laws.
            </p>
          </div>
        </section>

        {/* Section 7: Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              All content on Subamerica—including graphics, software, AI systems, and user interfaces—is owned by Subamerica or its licensors, except for creator-uploaded works.
            </p>
            <p>
              You may not copy, reverse-engineer, or sell access to any part of Subamerica's technology or platform.
            </p>
          </div>
        </section>

        {/* Section 8: Data & Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">8. Data & Privacy</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Our data practices are described in our{" "}
              <button onClick={() => navigate("/privacy")} className="text-primary hover:underline">
                Privacy Policy
              </button>
              , which forms part of these Terms.
            </p>
            <p>
              We comply with <strong>GDPR</strong>, <strong>CCPA</strong>, and other global privacy regulations.
              We collect only necessary data to operate and enhance the platform, including analytics for engagement, payouts, and fraud prevention.
            </p>
            <p>
              We never sell personal data to advertisers.
            </p>
          </div>
        </section>

        {/* Section 9: Creator Commerce and QR Interactions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">9. Creator Commerce and QR Interactions</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              By using QR-Commerce and LivePush integration features, you authorize Subamerica to facilitate transactions between members and creators.
              Subamerica is not responsible for third-party fulfillment of physical goods or external store links.
            </p>
            <p>
              Creators using dropshipping integrations (e.g., Printful, Printify) must comply with those providers' policies.
            </p>
          </div>
        </section>

        {/* Section 10: Termination and Suspension */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">10. Termination and Suspension</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>Subamerica may suspend or terminate your account if:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You violate these Terms or applicable law</li>
              <li>You upload harmful or illegal material</li>
              <li>You engage in fraudulent or abusive activity</li>
              <li>We are required by legal order</li>
            </ul>
            <p>
              You may cancel your account anytime by deleting it from your dashboard or contacting{" "}
              <a href="mailto:support@subamerica.net" className="text-primary hover:underline">support@subamerica.net</a>.
            </p>
          </div>
        </section>

        {/* Section 11: DMCA & Copyright Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">11. DMCA & Copyright Policy</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              If you believe your work has been copied or used without authorization, please send a <strong>DMCA Takedown Notice</strong> to{" "}
              <a href="mailto:dmca@subamerica.net" className="text-primary hover:underline">dmca@subamerica.net</a> including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your contact info</li>
              <li>Description of the copyrighted work</li>
              <li>URL of the infringing content</li>
              <li>Statement of good faith belief</li>
              <li>Digital signature</li>
            </ul>
            <p>
              Subamerica will promptly investigate and, if warranted, remove or restrict access to the content.
            </p>
          </div>
        </section>

        {/* Section 12: Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica provides the Services "<strong>as is</strong>" without warranties of any kind.
              We do not guarantee uninterrupted service, specific audience size, or earnings.
              To the fullest extent permitted by law, Subamerica shall not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of data, revenue, or goodwill</li>
            </ul>
            <p>
              Some jurisdictions may not allow these limitations, so they may not apply to you.
            </p>
          </div>
        </section>

        {/* Section 13: Indemnification */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">13. Indemnification</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              You agree to defend, indemnify, and hold harmless Subamerica, its affiliates, officers, and employees from any claims or liabilities arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your content or conduct</li>
              <li>Your violation of these Terms or another person's rights</li>
            </ul>
          </div>
        </section>

        {/* Section 14: Dispute Resolution */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">14. Dispute Resolution</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              These Terms are governed by the laws of <strong>New York, USA</strong>.
              Any disputes will be resolved through <strong>binding arbitration in New York County</strong> unless prohibited by local law.
              You agree to waive participation in class actions or jury trials.
            </p>
          </div>
        </section>

        {/* Section 15: Changes to Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica may update these Terms periodically.
              We will post changes on <strong>subamerica.net/legal</strong> with an updated effective date.
              Your continued use of the Services after such changes constitutes acceptance.
            </p>
          </div>
        </section>

        {/* Section 16: Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">16. Contact</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>For questions about these Terms, email{" "}
              <a href="mailto:legal@subamerica.net" className="text-primary hover:underline">legal@subamerica.net</a>
            </p>
            <p>For DMCA issues, contact{" "}
              <a href="mailto:dmca@subamerica.net" className="text-primary hover:underline">dmca@subamerica.net</a>
            </p>
            <p>For creator support, reach{" "}
              <a href="mailto:creators@subamerica.net" className="text-primary hover:underline">creators@subamerica.net</a>
            </p>
          </div>
        </section>

        {/* Closing Statement */}
        <div className="border-t border-border pt-8 mt-12">
          <h3 className="text-xl font-semibold mb-4">Closing Statement</h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              At Subamerica, <strong>independence doesn't mean isolation</strong>.
              It means ownership, freedom, and connection.
              Together, we're building the infrastructure independent culture deserves — transparent, artist-first, fearless.
            </p>
            <p className="text-foreground font-semibold text-lg">
              Subamerica Network<br />
              <span className="text-primary">Indie Underground — Stream fearless art, sound & stories 24/7.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground text-sm space-y-2">
            <p>© {new Date().getFullYear()} Subamerica. Indie Underground. Built by Muse Platforms.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate("/terms")} className="text-primary hover:underline">Terms of Service</button>
              <span>•</span>
              <button onClick={() => navigate("/privacy")} className="text-primary hover:underline">Privacy Policy</button>
              <span>•</span>
              <button onClick={() => navigate("/copyright")} className="text-primary hover:underline">Copyright Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
