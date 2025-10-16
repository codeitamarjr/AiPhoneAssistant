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
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fdf6ff] via-[#f5fcff] to-[#fff8f0] text-neutral-900 dark:from-[#050810] dark:via-[#0a1b33] dark:to-[#050810] dark:text-neutral-100">
                <div className="pointer-events-none absolute inset-0 -z-20 h-full w-full">
                    <div className="absolute inset-0 h-full w-full bg-top bg-no-repeat bg-funky-pattern opacity-70 dark:opacity-40" />
                    <div
                        className="absolute inset-0 h-full w-full bg-top bg-no-repeat dark:opacity-80"
                        style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', mixBlendMode: 'screen' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/45 to-transparent dark:from-slate-900/80 dark:via-slate-950/40 dark:to-transparent" />
                </div>
                <div className="absolute inset-0 -z-10 h-full w-full animate-pulse-slow bg-[radial-gradient(circle_at_18%_25%,rgba(79,182,255,0.65),rgba(255,255,255,0)),radial-gradient(circle_at_82%_30%,rgba(255,189,255,0.5),rgba(255,255,255,0)),radial-gradient(circle_at_50%_80%,rgba(79,255,217,0.4),rgba(255,255,255,0))] opacity-90 dark:opacity-60" />
                <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(55%_65%_at_20%_20%,rgba(93,162,255,0.55),rgba(255,255,255,0)),radial-gradient(60%_50%_at_80%_10%,rgba(255,172,230,0.55),rgba(255,255,255,0))] blur-[60px] dark:opacity-70" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[360px] bg-[radial-gradient(50%_50%_at_30%_80%,rgba(129,213,255,0.55),rgba(255,255,255,0)),radial-gradient(40%_40%_at_70%_60%,rgba(255,219,180,0.48),rgba(255,255,255,0))] blur-[100px] dark:opacity-60" />
                <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[420px] bg-[radial-gradient(35%_70%_at_40%_50%,rgba(255,186,223,0.35),rgba(255,255,255,0))] blur-[140px] dark:opacity-60" />

                {/* Hero content */}
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
                    <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white shadow-lg">
                            <img src={logoImage} alt="AI Phone Assistant" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">AI Phone Assistant</p>
                            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Turn every call into a qualified lead.</p>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300 md:flex">
                        {auth?.user ? (
                            <Button asChild variant="ghost" className="text-neutral-700 hover:bg-neutral-900/5 dark:text-neutral-200 dark:hover:bg-neutral-100/10">
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="secondary" className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                                <Link href={login()}>Log in</Link>
                            </Button>
                        )}
                    </nav>
                </header>

                <main className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-24 pt-12 text-neutral-900 dark:text-neutral-100 md:px-10 md:pt-20">
                    <section className="flex flex-col items-start gap-10 md:flex-row md:items-center md:gap-16">
                        <div className="relative flex-1 space-y-6">
                            <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.3em] text-neutral-500 shadow-sm ring-1 ring-white/40 dark:bg-slate-900/70 dark:text-neutral-300 dark:ring-white/10">
                                AI-first voice concierge
                            </span>
                            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-neutral-900 dark:text-white md:text-5xl">
                                Delight callers, capture every opportunity, and sync the conversation instantly.
                            </h1>
                            <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300 md:text-lg">
                                AI Phone Assistant pairs Twilio’s realtime voice with OpenAI and your CRM to answer questions, qualify prospects, and book follow-ups automatically. Every call, transcript, and lead is waiting for your team inside the dashboard.
                            </p>
                            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                                <Button asChild size="lg" className="bg-emerald-400 text-neutral-900 shadow-lg hover:bg-emerald-300 dark:bg-emerald-500 dark:text-neutral-900 dark:hover:bg-emerald-400">
                                    <Link href={heroCtaHref}>{heroCtaLabel}</Link>
                                </Button>
                                {!auth?.user && (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        No account yet? <Link href={login()} className="underline underline-offset-4 dark:text-neutral-200">Log in or request access</Link>.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                            <div className="pointer-events-none relative h-64 w-64 overflow-visible animate-float md:h-80 md:w-80">
                                <div className="absolute inset-0 animate-pulse-slow rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-400/20" />
                                <div className="absolute -inset-6 animate-float-delay rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/30" />
                                <img
                                    src={logoImage}
                                    alt="AI Phone Assistant logo"
                                    className="relative mx-auto h-full w-full max-w-xs object-contain drop-shadow-[0_25px_55px_rgba(16,185,129,0.25)]"
                                />
                            </div>
                            <p className="pointer-events-none text-3xl font-bold text-transparent drop-shadow-sm animate-float-inverse bg-gradient-to-b from-blue-900 via-blue-600 to-blue-300 bg-clip-text md:text-5xl">
                                Synq Call
                            </p>
                        </div>
                    </section>

                    <section className="mt-24 grid gap-8 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none md:grid-cols-3">
                        {features.map((feature) => (
                            <article key={feature.title} className="space-y-3">
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{feature.title}</h2>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">{feature.description}</p>
                            </article>
                        ))}
                    </section>
                </main>

                <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-10 text-xs text-neutral-500 dark:text-neutral-400 md:px-10">
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
