import PublicDocumentLayout from '@/components/support/PublicDocumentLayout';
import { Head } from '@inertiajs/react';

const lastUpdated = '1 October 2025';
const metaDescription =
    'Understand which first-party cookies AI Phone Assistant (Laravel app by Itamar Junior) uses and how to manage your preferences under EU ePrivacy rules.';

export default function CookiePolicy() {
    return (
        <>
            <Head title="Cookie Policy">
                <meta name="description" content={metaDescription} />
            </Head>
            <PublicDocumentLayout title="Cookie policy" subtitle={`Last updated: ${lastUpdated}`}>
                <article className="mx-auto w-full max-w-4xl space-y-10 px-6 py-12 sm:px-10">
                    <header className="space-y-4">
                        <h1 className="text-3xl font-semibold text-foreground">Cookie Policy</h1>
                        <p className="text-sm leading-6 text-muted-foreground">
                            This Cookie Policy explains how Itamar Junior (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) uses cookies and similar
                            technologies on the AI Phone Assistant website and web application. It complements our Privacy Policy and is intended to satisfy
                            the ePrivacy Regulations (S.I. No. 336 of 2011) and GDPR requirements in Ireland.
                        </p>
                    </header>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">1. What are cookies?</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Cookies are small data files stored on your device when you visit a website or use a web application. They may be set by us
                            (first-party cookies) or by third-party providers acting on our behalf. Cookies can remain for the duration of your session or for
                            a defined period. Similar technologies such as local storage, pixels, and device identifiers operate in comparable ways and are
                            treated as cookies for the purpose of this policy.
                        </p>
                    </section>

                    <section className="space-y-5">
                        <h2 className="text-2xl font-semibold text-foreground">2. Cookies we use</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            The table below outlines the cookies currently placed when you use our Laravel-based web application. Specific names may change as
                            we improve the product, but the purpose and retention periods will stay within the ranges indicated.
                        </p>
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border/60 p-5">
                                <h3 className="text-lg font-semibold text-foreground">
                                    First-party cookies set by AI Phone Assistant
                                </h3>
                                <div className="mt-3 overflow-x-auto">
                                    <table className="w-full text-left text-sm text-muted-foreground">
                                        <thead className="text-xs uppercase text-foreground">
                                            <tr className="border-b border-border/60">
                                                <th className="py-2 pr-4">Name</th>
                                                <th className="py-2 pr-4">Purpose</th>
                                                <th className="py-2">Retention</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-border/40">
                                                <td className="py-2 pr-4 font-medium text-foreground">aiphoneassistant_session</td>
                                                <td className="py-2 pr-4">
                                                    Maintains your authenticated session so you can securely access the dashboard and API without
                                                    re-authenticating on every request.
                                                </td>
                                                <td className="py-2">Up to 12 months (rotated for security)</td>
                                            </tr>
                                            <tr className="border-b border-border/40">
                                                <td className="py-2 pr-4 font-medium text-foreground">XSRF-TOKEN</td>
                                                <td className="py-2 pr-4">
                                                    Stores a token used to protect forms and API requests from cross-site request forgery (CSRF) attacks.
                                                </td>
                                                <td className="py-2">Session-only</td>
                                            </tr>
                                            <tr className="border-b border-border/40">
                                                <td className="py-2 pr-4 font-medium text-foreground">remember_web_*</td>
                                                <td className="py-2 pr-4">
                                                    Saves your choice to remain signed in when you select &ldquo;Remember me&rdquo; on the login screen.
                                                </td>
                                                <td className="py-2">Up to 18 months</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 pr-4 font-medium text-foreground">appearance</td>
                                                <td className="py-2 pr-4">
                                                    Stores your preferred appearance mode (light, dark, or system) so the UI looks the same across visits.
                                                </td>
                                                <td className="py-2">Up to 16 months</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 pr-4 font-medium text-foreground">sidebar_state</td>
                                                <td className="py-2 pr-4">
                                                    Remembers whether you collapsed or expanded the navigation sidebar, keeping your chosen layout next time you
                                                    sign in.
                                                </td>
                                                <td className="py-2">Approx. 3 weeks</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                                We do not currently set third-party analytics, advertising, or social sharing cookies. If we introduce optional analytics in
                                future, we will request your consent and update this section.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">3. Consent and preference management</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            When you first land on our public site or sign into the app, we display a consent banner that allows you to accept, reject, or
                            customise non-essential cookies. We store your selection in a strictly necessary cookie so that the banner does not reappear on
                            every visit. You may revisit your preferences from the footer link titled &ldquo;Cookie settings&rdquo;.
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                            You can also manage cookies through your browser settings by blocking or deleting them. If you block strictly necessary cookies,
                            parts of the service may no longer function correctly.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">4. Third-party technologies</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            The app currently operates solely with first-party Laravel cookies. Our telephony integration with Twilio does not drop cookies in
                            the browser interface, and we do not embed external analytics, chat widgets, or marketing pixels. Should that change, we will
                            update this policy and request consent where required.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">5. Updates</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            We review our cookie practice regularly. Material changes will be highlighted within the banner or our product updates feed. You
                            can revisit this page at any time to stay informed.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">6. Contact</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Questions about this policy can be directed to{' '}
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
