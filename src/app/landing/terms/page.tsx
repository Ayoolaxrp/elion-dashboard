export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">Last updated: August 28, 2026</p>

      <div className="space-y-8 text-sm text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using the services provided by ELION (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), including our website, automation platforms, and related services (collectively, the &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;).</p>
          <p className="mt-2">If you do not agree to these Terms, you must not access or use our Services.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Services Description</h2>
          <p>ELION provides business automation services including but not limited to:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Lead response automation systems</li>
            <li>Follow-up sequence automation</li>
            <li>Revenue recovery campaigns</li>
            <li>Appointment booking engines</li>
            <li>Operations workflow automation</li>
            <li>Website and digital presence auditing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Payment Terms</h2>
          <p>All pricing is listed in Nigerian Naira (NGN) unless otherwise stated. Payment is due in full before implementation begins unless otherwise agreed in writing. One-time payments grant full ownership of the delivered automation workflows. Monthly retainer fees are billed on the 1st of each month.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Ownership and Intellectual Property</h2>
          <p>Upon full payment, you own all automation workflows, configurations, and custom code built specifically for your business. ELION retains ownership of any pre-built components, frameworks, or tools used in the development process. Third-party services (such as WhatsApp Business API, email providers, CRM software, and hosting) are subject to their own terms and pricing, which are the responsibility of the client.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Warranty and Support</h2>
          <p>ELION warrants that delivered automation systems will function as specified in the agreed scope of work. If a system does not perform as documented within the applicable support period, ELION will address the issue at no additional cost.</p>
          <p className="mt-2">Results from automation depend on many factors including business processes, data quality, third-party service performance, and team adoption. ELION does not guarantee specific revenue or conversion outcomes.</p>
          <p className="mt-2">Monthly retainer services are billed on the 1st of each month and may be cancelled with 30 days written notice.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, ELION shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Services.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Termination</h2>
          <p>Either party may terminate the agreement with 30 days written notice. Upon termination, you retain ownership of all delivered automation workflows. Monthly retainer services will cease at the end of the current billing period.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:support@elion.ng" className="text-[var(--color-accent)] hover:underline">support@elion.ng</a>.</p>
        </section>
      </div>
    </div>
  );
}
