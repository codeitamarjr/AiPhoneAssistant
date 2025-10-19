import PublicDocumentLayout from '@/components/support/PublicDocumentLayout';
import { Head } from '@inertiajs/react';

const lastUpdated = '1 October 2025';
const metaDescription =
    'Terms of Use governing access to the AI Phone Assistant platform operated by Itamar Junior in Ireland, outlining responsibilities, acceptable use, and governing law.';

export default function TermsOfUse() {
    return (
        <>
            <Head title="Terms of Use">
                <meta name="description" content={metaDescription} />
            </Head>
            <PublicDocumentLayout title="Terms of use" subtitle={`Last updated: ${lastUpdated}`}>
                <article className="mx-auto w-full max-w-4xl space-y-10 px-6 py-12 sm:px-10">
                    <header className="space-y-4">
                        <h1 className="text-3xl font-semibold text-foreground">Terms of Use</h1>
                        <p className="text-sm leading-6 text-muted-foreground">
                            These Terms of Use (&ldquo;Terms&rdquo;) form a legally binding agreement between Itamar Junior, trading as AI Phone Assistant
                            (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;), and the person or organisation that accesses or uses the AI Phone Assistant
                            platform (&ldquo;you&rdquo;, &ldquo;Customer&rdquo;). By creating an account, accessing the dashboard, or deploying any feature of
                            the service, you agree to these Terms.
                        </p>
                    </header>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">1. Service description</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            AI Phone Assistant provides AI-powered voice concierge, lead management, and appointment scheduling tools designed for property
                            teams. The service includes web applications, APIs, telephony integrations, documentation, and any associated support. We may
                            continually enhance the service; significant changes will be communicated via release notes or email.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">2. Eligibility and account registration</h2>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>You must be at least 18 years old and authorised to act on behalf of the organisation you represent.</li>
                            <li>
                                Workspace owners are responsible for inviting team members and assigning appropriate roles. You must ensure that user
                                information is accurate and kept up to date.
                            </li>
                            <li>You are responsible for maintaining the confidentiality of login credentials and for any activity under your account.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">3. Customer responsibilities</h2>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>Configure call flows, scripts, and workspace settings in a manner that complies with applicable laws and internal policies.</li>
                            <li>Obtain and document all necessary consents from callers, leads, and staff for recording, processing, and storing data.</li>
                            <li>
                                Ensure that information uploaded to the platform (including listings, notes, and responses) is accurate, lawful, and does not
                                infringe third-party rights.
                            </li>
                            <li>Use commercially reasonable efforts to prevent unauthorised access to the service and notify us promptly of any breach.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">4. Acceptable use</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            You agree not to engage in any of the following while using the service:
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>Reverse engineer, decompile, or otherwise attempt to extract source code or underlying models.</li>
                            <li>Introduce malware, automated scraping, or excessive load that interferes with system stability or other customers.</li>
                            <li>Transmit unlawful, defamatory, or discriminatory content, or use the service for unsolicited marketing without consent.</li>
                            <li>Misrepresent your affiliation, impersonate another person, or mislead callers about the identity of the service.</li>
                            <li>Bypass or undermine usage limits, security controls, or the consent mechanisms presented to end users.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">5. Third-party services</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            The service integrates with telephony and messaging providers such as Twilio, as well as customer relationship management systems,
                            calendars, and analytics tools. Your use of third-party services is governed by their terms, and you are responsible for any fees
                            or obligations arising from those integrations.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">6. Fees and payment</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Subscription fees, usage charges, payment schedules, and billing terms are specified in the ordering document or master services
                            agreement executed between you and Itamar Junior. Unless otherwise agreed, invoices are due within 30 days. Late payments may incur
                            interest at the statutory rate under the European Communities (Late Payment in Commercial Transactions) Regulations 2012.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">7. Suspension and termination</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We may suspend or terminate access with notice if you materially breach these Terms, fail to pay undisputed amounts when due, or
                            if continued access would violate law or pose a security risk. You may terminate the service in accordance with your agreement by
                            providing written notice. Upon termination we will securely delete or return customer data in line with our Privacy Policy.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">8. Confidentiality and data protection</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Each party must protect confidential information received from the other using no less than reasonable care. We process personal
                            data as described in our Privacy Policy and, where required, a separate Data Processing Agreement (DPA). You remain the controller
                            of personal data processed on your behalf.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">9. Warranties</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We warrant that the service will materially conform to the documentation and be provided with reasonable care and skill. Except as
                            explicitly stated, the service is provided &ldquo;as is&rdquo; and we disclaim all other warranties, including implied warranties of
                            merchantability, fitness for a particular purpose, and non-infringement.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">10. Limitation of liability</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            To the maximum extent permitted by law, neither party will be liable for indirect, consequential, exemplary, or punitive damages,
                            or for loss of profits, revenues, or data, even if advised of the possibility. Each party&rsquo;s aggregate liability under these
                            Terms is limited to the fees paid or payable for the service in the 12 months preceding the event giving rise to the claim. The
                            limitations above do not apply to liability for death or personal injury, wilful misconduct, or breach of confidentiality
                            obligations.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">11. Indemnity</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            You will indemnify and hold Itamar Junior harmless from claims arising from your misuse of the service, violation of these Terms,
                            or infringement of third-party rights. We will defend and indemnify you against claims alleging that the service infringes EU or UK
                            intellectual property rights, provided you promptly notify us and allow us to control the defence.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">12. Governing law and dispute resolution</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            These Terms are governed by the laws of Ireland without regard to conflict of law principles. The parties agree to submit to the
                            exclusive jurisdiction of the Irish courts located in Dublin. If required by law, we will participate in alternative dispute
                            resolution procedures mandated by the EU Online Dispute Resolution platform.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">13. Changes to the Terms</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We may update these Terms from time to time. We will provide at least 30 days&rsquo; notice of material changes through the
                            platform or email. Continued use of the service after the effective date constitutes acceptance of the revised Terms.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">14. Contact</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Questions about these Terms can be sent to{' '}
                            <a href="mailto:hello@itjunior.dev" className="underline underline-offset-4">
                                hello@itjunior.dev
                            </a>{' '}
                            or by post to Itamar Junior, 34a Patrician Villas, Stillorgan, Dublin A94 VW74, Ireland.
                        </p>
                    </section>
                </article>
            </PublicDocumentLayout>
        </>
    );
}
