import { useNavigate } from "react-router-dom";
import { ConditionalHeader } from "@/components/ConditionalHeader";

export default function Copyright() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <ConditionalHeader />

      {/* Copyright Policy Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl pt-[80px]">
        <h1 className="text-4xl font-bold mb-2">Subamerica Network — Copyright & Licensing Policy</h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          Because protecting creators protects the underground.
        </p>

        {/* Our Philosophy */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 Our Philosophy</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica exists to amplify fearless creators and protect the culture that makes independent art possible.
            </p>
            <p>
              We believe in creative freedom — but also in respecting the rights of artists, musicians, and filmmakers whose work inspires the movement.
            </p>
            <p>
              That means your rights are protected here, and so are the rights of every creator whose work we share.
            </p>
          </div>
        </div>

        {/* Our Licensing Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 Our Licensing Status</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica Network is currently in the process of securing performance rights and broadcast licenses with the major U.S. Performing Rights Organizations (PROs): <strong>BMI, ASCAP, SESAC, and GMR</strong>.
            </p>
            <p>
              These licenses will allow Subamerica to legally broadcast and stream musical works across our network (web, mobile, and OTT channels) once fully active.
            </p>
            <p>
              Until those licenses are finalized, we operate under a <strong>creator-owned, permission-based model</strong> — meaning all uploaded and streamed content must be:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Original work owned by the creator, or</li>
              <li>Properly licensed or used with written permission.</li>
            </ul>
            <p>
              We are also finalizing <strong>DMCA Safe Harbor registration</strong> with the U.S. Copyright Office to ensure we remain compliant and responsive to copyright requests during this build phase.
            </p>
          </div>
        </div>

        {/* What's Allowed Right Now */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 What's Allowed Right Now</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              While our broader network licensing is in progress, artists and creators may:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Upload original works that they personally own or control the rights to.</li>
              <li>Share live performances, music videos, podcasts, or films featuring original compositions or properly cleared content.</li>
              <li>Use Creative Commons or royalty-free material, as long as it meets the licensing terms.</li>
            </ul>
            <p>
              Subamerica encourages artists to include attribution and metadata to protect their ownership and ensure proper credit across the network.
            </p>
          </div>
        </div>

        {/* What's Not Allowed */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 What's Not Allowed</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Until full PRO and broadcast licenses are in place, please do not upload or stream:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Commercially released music you don't own (even short clips).</li>
              <li>Songs or videos owned by record labels, studios, or publishers.</li>
              <li>Mashups, samples, or remixes without proper clearance.</li>
              <li>Any third-party content you do not have explicit permission to use.</li>
            </ul>
            <p>
              This protects both Subamerica and our artists from legal risk while we build a fully licensed foundation.
            </p>
          </div>
        </div>

        {/* Future Licensing Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 Future Licensing Plans</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Once finalized, Subamerica's blanket performance licenses with BMI, ASCAP, SESAC, and GMR will allow us to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Broadcast music in live events, showcases, and FAST channels.</li>
              <li>Stream background music and licensed compositions as part of curated programming.</li>
              <li>Support independent artists with royalty tracking and revenue participation.</li>
            </ul>
            <p>
              We will update this page and notify creators when these licenses are fully active.
            </p>
          </div>
        </div>

        {/* Fair Use & Remix Culture */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 Fair Use & Remix Culture</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica embraces remix culture and transformative art — when done legally and respectfully.
              We welcome creative reinterpretations under Fair Use, including:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Commentary, review, or educational content</li>
              <li>Parody or critical transformation</li>
              <li>Short clips used for analysis or creative expression</li>
            </ul>
            <p>
              When in doubt, keep clips brief, add commentary or context, and always credit the original creator.
            </p>
          </div>
        </div>

        {/* DMCA Safe Harbor */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 DMCA Safe Harbor</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica complies with the Digital Millennium Copyright Act (DMCA) and maintains a policy to respond to copyright takedown requests.
            </p>
            <p>
              If you believe your copyrighted work has been used without authorization, please contact:<br />
              📧 <a href="mailto:dmca@subamerica.net" className="text-primary hover:underline">dmca@subamerica.net</a>
            </p>
            <p>Include:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Your full name and contact information</li>
              <li>A description of your copyrighted work</li>
              <li>The URL or location of the material in question</li>
              <li>A statement under penalty of perjury that you own or represent the rights holder</li>
              <li>Your physical or digital signature</li>
            </ul>
            <p>
              We review all valid claims within 48 hours.
            </p>
          </div>
        </div>

        {/* How We Protect Artists */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 How We Protect Artists</h2>
          <div className="space-y-4 text-muted-foreground">
            <ul className="list-disc ml-6 space-y-2">
              <li>We verify creators during onboarding and require all uploads to be original or licensed.</li>
              <li>We provide tools for artists to tag ownership and link to their official sites, stores, or performance pages.</li>
              <li>We will soon enable copyright registration integration and optional watermarking for digital uploads.</li>
            </ul>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">🔹 Our Commitment</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Subamerica is more than a platform — it's a collective effort to build a fairer creative economy.
              We're taking the right steps to ensure the underground can thrive legally, sustainably, and fearlessly.
            </p>
            <p>
              As we complete our licensing process, our promise remains:<br />
              <strong>Every artist owns their work. Every stream honors creators. Every upload fuels the movement.</strong>
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <p className="text-muted-foreground">
            © Subamerica Network. All Rights Reserved.<br />
            <em>Indie Underground — Stream Fearless Art, Sound, and Stories 24/7.</em>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground space-y-4">
            <p>© 2025 Subamerica Network. All rights reserved.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate("/terms")} className="text-primary hover:underline">Terms of Service</button>
              <span>•</span>
              <button onClick={() => navigate("/privacy")} className="text-primary hover:underline">Privacy Policy</button>
              <span>•</span>
              <button onClick={() => navigate("/copyright")} className="text-primary hover:underline">Copyright Policy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
