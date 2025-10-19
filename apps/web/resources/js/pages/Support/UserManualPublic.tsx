import UserManualContent from '@/components/support/UserManualContent';
import { Button } from '@/components/ui/button';
import { dashboard, home, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

const bgImage = '/images/hero-light-waves.svg';
const logoImage = '/images/logo-mark.png';

export default function UserManualPublic() {
    const { auth } = usePage<SharedData>().props;

    const primaryCtaHref = useMemo(() => (auth?.user ? dashboard() : login()), [auth]);
    const primaryCtaLabel = auth?.user ? 'Go to dashboard' : 'Log in';

    return (
        <>
            <Head title="User manual" />
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

                <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-6 text-neutral-900 dark:text-neutral-100 md:px-10 md:pb-24">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Link href={home()} className="flex items-center gap-3 rounded-xl bg-white/80 p-2 shadow-lg dark:bg-slate-900/70">
                                <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                                    <img src={logoImage} alt="AI Phone Assistant" className="h-full w-full object-contain" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">AI Phone Assistant</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">User manual</p>
                                </div>
                            </Link>
                        </div>

                        <nav className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                            <Button
                                asChild
                                variant="ghost"
                                className="text-neutral-700 hover:bg-neutral-900/5 dark:text-neutral-200 dark:hover:bg-neutral-100/10"
                            >
                                <Link href={home()}>Back to home</Link>
                            </Button>
                            <Button
                                asChild
                                variant={auth?.user ? 'ghost' : 'secondary'}
                                className={
                                    auth?.user
                                        ? 'text-neutral-700 hover:bg-neutral-900/5 dark:text-neutral-200 dark:hover:bg-neutral-100/10'
                                        : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                                }
                            >
                                <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
                            </Button>
                        </nav>
                    </header>

                    <main className="mt-10 flex-1">
                        <div className="rounded-3xl border border-white/60 bg-white/85 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
                            <UserManualContent className="py-12" />
                        </div>
                    </main>

                    <footer className="mt-12 flex flex-col gap-3 text-xs text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} AI Phone Assistant. All rights reserved.</p>
                        <div className="flex items-center gap-3">
                            <span>Enterprise-ready</span>
                            <span>•</span>
                            <span>Powered by Twilio & OpenAI</span>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
