import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const bgImage = '/images/hero-office.jpg';
const logoImage = '/images/logo-mark.png';

const features = [
    {
        title: 'Answer every lead 24/7',
        description: 'AI Phone Assistant greets callers instantly, captures intent, and books follow-ups while your team sleeps.',
    },
    {
        title: 'Context-aware conversations',
        description: 'Pulls live property data, unit availability, and policies from your CRM to guide the call naturally.',
    },
    {
        title: 'Seamless Twilio + CRM sync',
        description: 'Logs every call, transcribes highlights, and creates qualified leads in your Laravel workspace automatically.',
    },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const heroCtaHref = useMemo(() => (auth?.user ? dashboard().url ?? dashboard() : login().url ?? login()), [auth]);
    const heroCtaLabel = auth?.user ? 'Go to dashboard' : 'Log in to get started';

    return (
        <>
            <Head title="AI Phone Assistant" />
            <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
                {/* Hero background */}
                <div
                    className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-cover bg-center bg-no-repeat will-change-transform"
                    style={{
                        backgroundImage: `linear-gradient(rgba(5, 7, 12, 0.75), rgba(5, 7, 12, 0.65)), url('${bgImage}')`,
                        backgroundAttachment: 'fixed',
                    }}
                />

                {/* Hero content */}
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
                    <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/10 shadow-lg backdrop-blur">
                            <img src={logoImage} alt="AI Phone Assistant" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-white/60">AI Phone Assistant</p>
                            <p className="text-base font-semibold text-white">Turn every call into a qualified lead.</p>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-4 text-sm text-white/80 md:flex">
                        {auth?.user ? (
                            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="secondary" className="bg-white text-neutral-900 hover:bg-white/90">
                                <Link href={login()}>Log in</Link>
                            </Button>
                        )}
                    </nav>
                </header>

                <main className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-24 pt-12 md:px-10 md:pt-20">
                    <section className="flex flex-col items-start gap-10 md:flex-row md:items-center md:gap-16">
                        <div className="relative flex-1 space-y-6">
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70 backdrop-blur">
                                AI-first voice concierge
                            </span>
                            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white md:text-5xl">
                                Delight callers, capture every opportunity, and sync the conversation instantly.
                            </h1>
                            <p className="max-w-2xl text-base text-white/80 md:text-lg">
                                AI Phone Assistant pairs Twilio’s realtime voice with OpenAI and your CRM to answer questions, qualify prospects, and book follow-ups automatically. Every call, transcript, and lead is waiting for your team inside the dashboard.
                            </p>
                            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                                <Button asChild size="lg" className="bg-emerald-400 text-neutral-950 shadow-lg hover:bg-emerald-300">
                                    <Link href={heroCtaHref}>{heroCtaLabel}</Link>
                                </Button>
                                {!auth?.user && (
                                    <p className="text-sm text-white/70">
                                        No account yet? <Link href={login()} className="underline underline-offset-4">Log in or request access</Link>.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="relative flex flex-1 items-center justify-center">
                            <div className="pointer-events-none relative h-64 w-64 overflow-visible md:h-80 md:w-80">
                                <div className="absolute inset-0 animate-[float_8s_ease-in-out_infinite] rounded-full bg-emerald-400/20 blur-3xl" />
                                <img
                                    src={logoImage}
                                    alt="AI Phone Assistant logo"
                                    className="relative mx-auto h-full w-full max-w-xs object-contain drop-shadow-[0_35px_45px_rgba(16,185,129,0.35)]"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="mt-24 grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur md:grid-cols-3">
                        {features.map((feature) => (
                            <article key={feature.title} className="space-y-3">
                                <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
                                <p className="text-sm text-white/70">{feature.description}</p>
                            </article>
                        ))}
                    </section>
                </main>

                <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-10 text-xs text-white/60 md:px-10">
                    <p>© {new Date().getFullYear()} AI Phone Assistant. All rights reserved.</p>
                    <div className="flex items-center gap-3">
                        <span>Enterprise-ready</span>
                        <span>•</span>
                        <span>Powered by Twilio & OpenAI</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
