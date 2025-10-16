import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';

const bgImage = '/images/hero-light-waves.svg';
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
    const heroCtaHref = useMemo(() => (auth?.user ? dashboard() : login()), [auth]);
    const heroCtaLabel = auth?.user ? 'Go to dashboard' : 'Log in to get started';

    return (
        <>
            <Head title="AI Phone Assistant" />
            <div className="relative min-h-screen overflow-hidden bg-[#f7f9fc] text-neutral-900">
                <div className="pointer-events-none absolute inset-0 -z-20 h-full w-full">
                    <div
                        className="absolute inset-0 h-full w-full bg-top bg-no-repeat"
                        style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-transparent" />
                </div>
                <div className="absolute inset-0 -z-10 h-full w-full animate-[float_14s_ease-in-out_infinite] bg-[radial-gradient(circle_at_20%_20%,rgba(79,182,255,0.35),rgba(255,255,255,0)),radial-gradient(circle_at_80%_30%,rgba(79,255,217,0.25),rgba(255,255,255,0))] opacity-80" />

                {/* Hero content */}
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
                    <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white shadow-lg">
                            <img src={logoImage} alt="AI Phone Assistant" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">AI Phone Assistant</p>
                            <p className="text-base font-semibold text-neutral-900">Turn every call into a qualified lead.</p>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-4 text-sm text-neutral-600 md:flex">
                        {auth?.user ? (
                            <Button asChild variant="ghost" className="text-neutral-700 hover:bg-neutral-900/5">
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="secondary" className="bg-neutral-900 text-white hover:bg-neutral-800">
                                <Link href={login()}>Log in</Link>
                            </Button>
                        )}
                    </nav>
                </header>

                <main className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-24 pt-12 md:px-10 md:pt-20">
                    <section className="flex flex-col items-start gap-10 md:flex-row md:items-center md:gap-16">
                        <div className="relative flex-1 space-y-6">
                            <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.3em] text-neutral-500 shadow-sm ring-1 ring-white/40">
                                AI-first voice concierge
                            </span>
                            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-neutral-900 md:text-5xl">
                                Delight callers, capture every opportunity, and sync the conversation instantly.
                            </h1>
                            <p className="max-w-2xl text-base text-neutral-600 md:text-lg">
                                AI Phone Assistant pairs Twilio’s realtime voice with OpenAI and your CRM to answer questions, qualify prospects, and book follow-ups automatically. Every call, transcript, and lead is waiting for your team inside the dashboard.
                            </p>
                            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                                <Button asChild size="lg" className="bg-emerald-400 text-neutral-900 shadow-lg hover:bg-emerald-300">
                                    <Link href={heroCtaHref}>{heroCtaLabel}</Link>
                                </Button>
                                {!auth?.user && (
                                    <p className="text-sm text-neutral-500">
                                        No account yet? <Link href={login()} className="underline underline-offset-4">Log in or request access</Link>.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="relative flex flex-1 items-center justify-center">
                            <div className="pointer-events-none relative h-64 w-64 overflow-visible md:h-80 md:w-80">
                                <div className="absolute inset-0 animate-[float_10s_ease-in-out_infinite] rounded-full bg-emerald-400/30 blur-3xl" />
                                <div className="absolute -inset-6 animate-[float_14s_ease-in-out_infinite] rounded-full bg-sky-200/40 blur-3xl" />
                                <img src={logoImage} alt="AI Phone Assistant logo" className="relative mx-auto h-full w-full max-w-xs object-contain drop-shadow-[0_25px_55px_rgba(16,185,129,0.25)]" />
                            </div>
                        </div>
                    </section>

                    <section className="mt-24 grid gap-8 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-lg backdrop-blur md:grid-cols-3">
                        {features.map((feature) => (
                            <article key={feature.title} className="space-y-3">
                                <h2 className="text-lg font-semibold text-neutral-900">{feature.title}</h2>
                                <p className="text-sm text-neutral-600">{feature.description}</p>
                            </article>
                        ))}
                    </section>
                </main>

                <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-10 text-xs text-neutral-500 md:px-10">
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
