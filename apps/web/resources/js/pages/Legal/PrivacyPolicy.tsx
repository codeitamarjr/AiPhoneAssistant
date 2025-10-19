import PublicDocumentLayout from '@/components/support/PublicDocumentLayout';
import { Head } from '@inertiajs/react';

const lastUpdated = '1 October 2025';
const metaDescription =
    'Learn how AI Phone Assistant collects, uses, and protects personal data in line with the GDPR and Irish law, including details for contacting Itamar Junior.';

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy">
                <meta name="description" content={metaDescription} />
            </Head>
            <PublicDocumentLayout title="Privacy policy" subtitle={`Last updated: ${lastUpdated}`}>
                <article className="mx-auto w-full max-w-4xl space-y-10 px-6 py-12 sm:px-10">
                    <header className="space-y-4">
                        <h1 className="text-3xl font-semibold text-foreground">Privacy Policy</h1>
                        <p className="text-sm leading-6 text-muted-foreground">
                            This Privacy Policy explains how Itamar Junior (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) processes personal data when
                            you use the AI Phone Assistant platform and related services. We operate as controller under the EU General Data Protection
                            Regulation (GDPR) and the Irish Data Protection Act 2018.
                        </p>
                    </header>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">1. Who we are and how to contact us</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            AI Phone Assistant is operated by sole developer Itamar Junior from 34a Patrician Villas, Stillorgan, Dublin A94 VW74, Ireland. You
                            can reach our data protection contact at{' '}
                            <a href="mailto:hello@itjunior.dev" className="underline underline-offset-4">
                                hello@itjunior.dev
                            </a>{' '}
                            or by post at the address above, marked &ldquo;Data Protection&rdquo;.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">2. Personal data we collect</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We collect and process the following categories of information:
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>
                                <strong>Account and authentication data</strong> such as name, email address, organisation details, role and password hash
                                when you register or are invited to a workspace.
                            </li>
                            <li>
                                <strong>Workspace configuration data</strong> including Twilio account identifiers, phone numbers, call routing rules, and
                                availability settings that you provide to deliver the service.
                            </li>
                            <li>
                                <strong>Call and lead records</strong> containing caller contact details, notes, appointment information, audio transcripts
                                and metadata generated through the assistant&rsquo;s interactions.
                            </li>
                            <li>
                                <strong>Usage and diagnostic data</strong> such as login timestamps, feature interactions, device/browser characteristics,
                                IP address, error logs and crash reports to secure and improve the platform.
                            </li>
                            <li>
                                <strong>Support correspondence</strong> from emails, chat sessions, or feedback forms that you submit directly to Itamar Junior.
                            </li>
                            <li>
                                <strong>Marketing preferences</strong> including opt-in status, email engagement and event registrations, when you choose to
                                receive updates from us.
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">3. How we use personal data</h2>
                        <p className="text-sm leading-6 text-muted-foreground">We process personal data to:</p>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>Provision and maintain workspaces, including authenticating users and enforcing security controls.</li>
                            <li>Deliver AI-led voice concierge services, call handling, lead capture, and appointment scheduling on your behalf.</li>
                            <li>Monitor platform reliability, detect fraud or abuse, and troubleshoot issues reported by customers.</li>
                            <li>Provide customer support, onboarding assistance, and product training.</li>
                            <li>Send transactional communications such as password resets, system notifications, and service updates.</li>
                            <li>Conduct analytics to improve product performance and develop new features, using aggregated or pseudonymised data where possible.</li>
                            <li>Comply with legal obligations, respond to lawful requests, and enforce our Terms of Use.</li>
                            <li>Send marketing communications when you have provided consent or we rely on legitimate interest, with the option to opt out at any time.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">4. Legal bases for processing</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Our processing is grounded in GDPR Article 6(1). Depending on the context, we rely on:
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>
                                <strong>Contractual necessity</strong> to provide the services described in the customer agreement and respond to user
                                requests.
                            </li>
                            <li>
                                <strong>Legitimate interests</strong> in securing our infrastructure, preventing misuse, and improving the product. We
                                balance these interests against your rights.
                            </li>
                            <li>
                                <strong>Consent</strong> for optional analytics cookies, marketing communications, and processing call recordings when you
                                enable features that require prior caller consent.
                            </li>
                            <li>
                                <strong>Legal obligation</strong> to maintain records, cooperate with authorities, and meet regulatory requirements.
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">5. Sharing and international transfers</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We only share personal data with trusted processors that support our service delivery, including Twilio Inc. for telephony, cloud
                            hosting providers within the EEA, identity and security vendors, analytics platforms, and customer support tooling. Each processor
                            is bound by a written data processing agreement and may only process data under our instructions.
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Where data is transferred outside the EEA or the United Kingdom, we implement appropriate safeguards such as the European
                            Commission&rsquo;s Standard Contractual Clauses and supplementary technical and organisational measures. Copies of relevant
                            safeguards are available upon request.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">6. Data retention</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We retain personal data for as long as necessary to fulfil the purposes described in this Privacy Policy, unless a longer retention
                            period is required or permitted by law. As a guide:
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            <li>Account data is held for the lifetime of the workspace and deleted within 90 days of closure.</li>
                            <li>Call records, transcripts, and leads follow the retention settings configured by workspace administrators.</li>
                            <li>Support tickets and audit logs are retained for up to 24 months to resolve issues and maintain compliance evidence.</li>
                            <li>Marketing preference data is retained until you withdraw consent or unsubscribe.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">7. Your rights</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Under the GDPR you have the right to request access, rectification, erasure, restriction, data portability, object to processing,
                            and to withdraw consent at any time. You can exercise these rights by emailing{' '}
                            <a href="mailto:hello@itjunior.dev" className="underline underline-offset-4">
                                hello@itjunior.dev
                            </a>
                            . We will respond within one month, subject to verification of identity and applicable legal exemptions.
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                            You also have the right to lodge a complaint with the Irish Data Protection Commission (www.dataprotection.ie) or your local
                            supervisory authority.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">8. Security</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We apply administrative, technical, and organisational safeguards including encryption at rest and in transit, role-based access
                            controls, continuous monitoring, and vendor due diligence to protect personal data. If we identify a personal data breach, we will
                            notify affected customers and regulators in line with legal obligations.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">9. Changes to this policy</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We may update this Privacy Policy from time to time. Significant changes will be communicated through the platform or by email to
                            workspace owners. The revision date at the top of the page reflects the most recent update.
                        </p>
                    </section>
                </article>
            </PublicDocumentLayout>
        </>
    );
}
