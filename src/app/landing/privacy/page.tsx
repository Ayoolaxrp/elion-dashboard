export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: August 28, 2026</p>

      <div className="space-y-8 text-sm text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you fill out a form, request an audit, or contact us:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Name and email address</li>
            <li>Phone number</li>
            <li>Company name and industry</li>
            <li>Website URL (for audit purposes)</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Provide and improve our automation services</li>
            <li>Respond to your inquiries and send you requested information</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Process payments and manage your account</li>
            <li>Analyze website usage to improve our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Service providers who assist in delivering our services (e.g., email providers, CRM platforms)</li>
            <li>When required by law or to protect our legal rights</li>
            <li>With your explicit consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. You may request deletion of your data at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Cookies</h2>
          <p>Our website uses essential cookies to maintain functionality. We do not use tracking cookies without your consent. You can control cookie settings through your browser.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Contact</h2>
          <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@elion.ng" className="text-primary hover:underline">privacy@elion.ng</a>.</p>
        </section>
      </div>
    </div>
  );
}
