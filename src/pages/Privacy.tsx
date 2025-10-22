import { useNavigate } from "react-router-dom";
import { ConditionalHeader } from "@/components/ConditionalHeader";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <ConditionalHeader />

      {/* Privacy Policy Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl pt-[80px]">
        <h1 className="text-4xl font-bold mb-2">Subamerica Network – Privacy Policy</h1>
        
        <div className="text-muted-foreground mb-8">
          <p><strong>Effective Date:</strong> October 2025</p>
          <p><strong>Last Updated:</strong> October 15, 2025</p>
        </div>
        
        <p className="text-xl mb-12 text-primary">
          Welcome to <strong>Subamerica Network</strong> — <em>Indie Underground. Stream fearless art, sound & stories 24/7.</em>
        </p>

        <div className="space-y-4 text-muted-foreground mb-12">
          <p>
            This Privacy Policy explains how Subamerica Network ("Subamerica," "we," "our," or "us") collects, uses, stores, and protects your personal information when you access our website, apps, OTT channels, and Creator Portal (collectively, the "Services").
          </p>
          <p>
            By using Subamerica, you agree to the terms of this Privacy Policy.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica Network is operated by <strong>Hercules Media, LLC</strong>, based in New York, NY, USA.
              We're an independent media and entertainment company dedicated to giving creators ownership and members access to fearless underground art.
            </p>
            <p>Contact:</p>
            <ul className="list-none space-y-2 ml-4">
              <li>📧 <a href="mailto:privacy@subamerica.net" className="text-primary hover:underline">privacy@subamerica.net</a></li>
              <li>📍 New York, NY</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We collect information to deliver personalized, secure, and fair experiences for both creators and fans.
            </p>

            <h3 className="text-xl font-semibold mb-3">A. Information You Provide</h3>
            <p>When you create an account or use our Creator Portal, we collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account Information:</strong> name, display name, email, password, artist name, bio, and social links</li>
              <li><strong>Payment Data:</strong> Stripe Connect details for payouts or purchases</li>
              <li><strong>Uploads & Posts:</strong> videos, artwork, music, events, merch listings, and captions</li>
              <li><strong>Support Requests:</strong> when you contact us via email or Discord</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">B. Information We Collect Automatically</h3>
            <p>When you use Subamerica (web, mobile, or TV apps), we automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Device Data:</strong> device type, OS, IP address, browser or app version</li>
              <li><strong>Usage Data:</strong> pages visited, buttons clicked, QR scans, watch time, and purchase history</li>
              <li><strong>Location (approximate):</strong> based on IP address, for analytics and legal compliance</li>
              <li><strong>Cookies & Local Storage:</strong> to keep you signed in and personalize recommendations</li>
            </ul>
            <p className="mt-4">
              We never track you off-platform or sell your data to third parties.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>We use your information to:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li><strong>Operate and improve</strong> the Subamerica platform</li>
              <li><strong>Process payments</strong> to and from creators (via Stripe)</li>
              <li><strong>Curate and recommend</strong> content using AI-driven "Vibe Engine" analysis</li>
              <li><strong>Display analytics dashboards</strong> for creators (e.g., views, tips, QR scans)</li>
              <li><strong>Ensure platform security</strong> and prevent fraud or abuse</li>
              <li><strong>Send updates</strong> (feature releases, artist opportunities, events)</li>
              <li><strong>Comply with legal obligations</strong> such as tax reporting, DMCA, or GDPR/CCPA</li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (GDPR)</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              If you are located in the <strong>European Economic Area (EEA)</strong>, our legal bases for collecting and processing your personal data are:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Performance of a Contract:</strong> to deliver our Services and pay creators</li>
              <li><strong>Legitimate Interests:</strong> to secure our platform and improve user experience</li>
              <li><strong>Consent:</strong> for marketing communications or cookies</li>
              <li><strong>Legal Obligation:</strong> for tax or compliance reporting</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. How We Share Your Information</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica does <strong>not sell</strong> your personal data.
            </p>
            <p>
              We may share limited information only with trusted partners necessary to operate the platform:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border border-border mt-4">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Partner</th>
                    <th className="border border-border px-4 py-2 text-left">Purpose</th>
                    <th className="border border-border px-4 py-2 text-left">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2"><strong>Stripe</strong></td>
                    <td className="border border-border px-4 py-2">Payment processing and payouts</td>
                    <td className="border border-border px-4 py-2">Name, email, payment details</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2"><strong>Supabase</strong></td>
                    <td className="border border-border px-4 py-2">Secure authentication and database</td>
                    <td className="border border-border px-4 py-2">Account and upload data</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2"><strong>AWS / Cloudflare</strong></td>
                    <td className="border border-border px-4 py-2">Hosting, storage, and CDN delivery</td>
                    <td className="border border-border px-4 py-2">Video files, analytics logs</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2"><strong>Discord</strong></td>
                    <td className="border border-border px-4 py-2">Optional creator community</td>
                    <td className="border border-border px-4 py-2">Display name and email (if joined)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              All partners comply with strict data protection agreements (DPAs).
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We use <strong>first-party cookies</strong> and secure local storage for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Session authentication</li>
              <li>User preferences (theme, language, layout)</li>
              <li>Analytics and playback optimization</li>
            </ul>
            <p>
              You can clear cookies at any time through your browser settings. Subamerica does not use invasive third-party trackers or behavioral ad networks.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>We retain your data only as long as necessary:</p>
            <div className="overflow-x-auto">
              <table className="w-full border border-border mt-4">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Data Type</th>
                    <th className="border border-border px-4 py-2 text-left">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">Account data</td>
                    <td className="border border-border px-4 py-2">Active account + 1 year post-deletion</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">Uploaded media</td>
                    <td className="border border-border px-4 py-2">Until deleted by creator</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Transaction data</td>
                    <td className="border border-border px-4 py-2">7 years (tax law compliance)</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">Analytics logs</td>
                    <td className="border border-border px-4 py-2">12 months rolling window</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              When data is deleted, it is purged from active databases and backup cycles.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access a copy of your personal data</li>
              <li>Correct or update your data</li>
              <li>Request deletion ("Right to be Forgotten")</li>
              <li>Restrict or object to processing</li>
              <li>Request data portability (export your data)</li>
            </ul>
            <p>
              To exercise these rights, email <a href="mailto:privacy@subamerica.net" className="text-primary hover:underline">privacy@subamerica.net</a> with the subject line "Data Request."
              We will respond within <strong>30 days</strong> as required by GDPR/CCPA.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">9. California Residents (CCPA)</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>If you are a California resident, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Know what personal data we collect and why</li>
              <li>Request access or deletion of your data</li>
              <li>Opt-out of any "sale" of data (we do not sell data)</li>
              <li>Appoint an authorized agent to submit requests on your behalf</li>
            </ul>
            <p>
              Submit requests to <a href="mailto:privacy@subamerica.net" className="text-primary hover:underline">privacy@subamerica.net</a> with "CCPA Request" in the subject.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">10. Security</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica uses end-to-end encryption and enterprise-grade infrastructure to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>SOC 2 Type II–certified</strong> cloud providers (Supabase, AWS, Stripe)</li>
              <li><strong>HTTPS/TLS encryption</strong> for all connections</li>
              <li><strong>Role-based access control (RLS)</strong> for all creator data</li>
              <li><strong>Periodic penetration tests</strong> and audit logging</li>
            </ul>
            <p>
              Despite our best efforts, no system is 100% secure. Please use strong passwords and protect your login credentials.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica is not directed toward children under 13.
              If we learn we have collected data from a child without parental consent, we will delete it immediately.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Your data may be processed in the United States or other countries where we or our service providers operate.
              We ensure all transfers comply with <strong>GDPR Standard Contractual Clauses (SCCs)</strong> and <strong>U.S. Data Privacy Framework (DPF)</strong> standards.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">13. Updates to This Policy</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We may update this Privacy Policy from time to time to reflect new features, technologies, or legal requirements.
              The latest version will always be available at <strong>subamerica.net/legal/privacy</strong>.
              If we make material changes, we'll notify you by email or in-app message.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>For all privacy inquiries or data requests:</p>
            <ul className="list-none space-y-2 ml-4">
              <li>📧 <a href="mailto:privacy@subamerica.net" className="text-primary hover:underline">privacy@subamerica.net</a></li>
              <li>📍 Hercules Media, LLC – Subamerica Network</li>
              <li>New York, NY</li>
            </ul>
          </div>
        </section>

        <div className="border-t pt-8 mt-12">
          <h3 className="text-xl font-semibold mb-4">Commitment to Transparency</h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              At Subamerica, we believe <strong>data sovereignty</strong> is as essential as creative sovereignty.
              You own your art — and you control your data.
              We use technology to empower, not exploit.
              Our mission is to build a transparent, ethical ecosystem where <strong>independent culture thrives fearlessly</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Subamerica Network. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm">
              <button onClick={() => navigate("/terms")} className="text-primary hover:underline">
                Terms of Service
              </button>
              <button onClick={() => navigate("/privacy")} className="text-primary hover:underline">
                Privacy Policy
              </button>
              <button onClick={() => navigate("/copyright")} className="text-primary hover:underline">
                Copyright Policy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
