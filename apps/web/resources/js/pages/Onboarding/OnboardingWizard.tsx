import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import CreateGroupStep from './steps/CreateGroupStep';
import ConnectTwilioStep from './steps/ConnectTwilioStep';

type OnboardingStatus = {
    has_group: boolean;
    has_twilio: boolean;
    next: 'create_group' | 'connect_twilio' | 'complete';
    group: {
        id: number;
        name: string;
    } | null;
};

const STEPS = [
    {
        id: 'create_group',
        title: 'Create workspace',
        description: 'Name the workspace your callers will interact with.',
    },
    {
        id: 'connect_twilio',
        title: 'Connect Twilio',
        description: 'Link your Twilio account so calls and SMS can reach the AI assistant.',
    },
    {
        id: 'complete',
        title: 'All set',
        description: 'Head to your dashboard to start capturing leads.',
    },
] as const;

export default function OnboardingWizard() {
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get<OnboardingStatus>('/api/v1/onboarding/status');
            setStatus(data);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load onboarding status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const currentStepIndex = useMemo(() => {
        if (!status) return 0;
        if (status.next === 'create_group') return 0;
        if (status.next === 'connect_twilio') return 1;
        return 2;
    }, [status]);

    const renderStepContent = () => {
        if (!status) {
            return null;
        }

        if (!status.has_group) {
            return <CreateGroupStep onDone={load} />;
        }

        if (!status.has_twilio) {
            return <ConnectTwilioStep group={status.group!} onDone={load} />;
        }

        return (
            <Card className="border-sidebar-border/60">
                <CardHeader className="space-y-2">
                    <CardTitle>All set 🎉</CardTitle>
                    <CardDescription>
                        {status.group?.name ?? 'Your workspace'} is ready. You can now manage calls, capture leads, and invite your team.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            If you ever need to change these settings, head to Settings → Team or Settings → Twilio & Calls.
                        </p>
                    </div>
                    <Button asChild>
                        <a href="/dashboard">Go to dashboard</a>
                    </Button>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="space-y-8">
                <header className="space-y-3 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        Let’s get your AI Phone Assistant ready
                    </h1>
                    <p className="text-muted-foreground">
                        We’ll get you set up in just a couple of steps. You can always come back later to make changes.
                    </p>
                </header>

                <section className="rounded-2xl border border-sidebar-border/60 bg-background/80 shadow-sm">
                    <div className="flex flex-col gap-6 p-6">
                        <nav className="grid gap-4 sm:grid-cols-3">
                            {STEPS.map((step, index) => {
                                const isActive = currentStepIndex === index;
                                const isCompleted = currentStepIndex > index;
                                return (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            'flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                                            isCompleted
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                : isActive
                                                    ? 'border-primary/40 bg-primary/5 text-primary-foreground/90 dark:border-primary/40'
                                                    : 'border-sidebar-border/60 text-muted-foreground'
                                        )}
                                    >
                                        <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full">
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : isActive ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Circle className="h-5 w-5" />
                                            )}
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">{step.title}</p>
                                            <p className="text-xs text-muted-foreground">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="min-h-[320px]">
                            {error ? (
                                <Card className="border-destructive/30">
                                    <CardHeader>
                                        <CardTitle className="text-destructive">Something went wrong</CardTitle>
                                        <CardDescription>{error}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button onClick={load} variant="destructive">
                                            Try again
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-2/3" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-10 w-1/3" />
                                </div>
                            ) : (
                                renderStepContent()
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
