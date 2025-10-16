import { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem, SharedData } from '@/types';
import { show as showTwilio } from '@/routes/twilio';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Twilio & Calls',
        href: showTwilio().url,
    },
];

type Credential = {
    id: number;
    account_sid: string;
    incoming_phone_e164: string | null;
    incoming_phone_sid: string | null;
    subaccount_sid: string | null;
    is_active: boolean;
    connected_at?: string | null;
    updated_at?: string | null;
};

type PageProps = SharedData & {
    group: {
        id: number;
        name: string;
    };
    credential: Credential | null;
};

const initialForm = (credential?: Credential | null) => ({
    account_sid: credential?.account_sid ?? '',
    auth_token: '',
    incoming_phone_e164: credential?.incoming_phone_e164 ?? '',
    incoming_phone_sid: credential?.incoming_phone_sid ?? '',
    subaccount_sid: credential?.subaccount_sid ?? '',
});

export default function TwilioSettings() {
    const { group, credential: initialCredential } = usePage<PageProps>().props;
    const [credential, setCredential] = useState<Credential | null>(initialCredential);
    const [form, setForm] = useState(initialForm(initialCredential));
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        setForm(initialForm(credential));
    }, [credential]);

    const statusLabel = useMemo(() => {
        if (!credential) return 'Not connected';
        if (!credential.is_active) return 'Inactive';
        return 'Connected';
    }, [credential]);

    const statusVariant = useMemo(() => {
        if (!credential) return 'secondary' as const;
        if (!credential.is_active) return 'outline' as const;
        return 'default' as const;
    }, [credential]);

    const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const { data } = await axios.put(`/api/v1/groups/${group.id}/twilio`, form);
            if (data?.saved) {
                const response = await axios.get<Credential | null>(`/api/v1/groups/${group.id}/twilio`);
                setCredential(response.data);
                toast.success('Twilio connection updated');
            } else {
                toast.success('Twilio connection saved');
            }
            setForm((prev) => ({ ...prev, auth_token: '' }));
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors ?? {};
                const formatted: Record<string, string | undefined> = {};
                Object.entries(validationErrors).forEach(([key, messages]) => {
                    formatted[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setErrors(formatted);
                toast.error('Check the highlighted fields and try again.');
            } else {
                toast.error('Unable to save Twilio settings', {
                    description: 'Please try again in a moment.',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        try {
            await axios.delete(`/api/v1/groups/${group.id}/twilio`);
            setCredential(null);
            setForm(initialForm(null));
            toast.success('Twilio disconnected');
        } catch (error) {
            toast.error('Unable to disconnect Twilio', {
                description: 'Please try again in a moment.',
            });
        } finally {
            setDisconnecting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Twilio & Calls" />

            <SettingsLayout>
                <div className="space-y-10">
                    <section className="space-y-4">
                        <HeadingSmall
                            title="Twilio connection"
                            description="Securely connect your Twilio account so incoming calls and SMS can be handled by AI Phone Assistant."
                        />

                        <Card className="border-sidebar-border/60">
                            <CardHeader>
                                <CardTitle>Connection status</CardTitle>
                                <CardDescription>
                                    Manage your Twilio credentials. Your auth token is always encrypted at rest and never displayed after saving.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Workspace</p>
                                        <p className="text-base font-medium text-foreground">{group.name}</p>
                                    </div>
                                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                                </div>

                                {credential ? (
                                    <dl className="grid gap-3 md:grid-cols-2 text-sm">
                                        <div>
                                            <dt className="text-muted-foreground">Account SID</dt>
                                            <dd className="font-medium text-foreground break-all">{credential.account_sid}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Workspace number</dt>
                                            <dd className="font-medium text-foreground">
                                                {credential.incoming_phone_e164 || 'Not set'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Subaccount SID</dt>
                                            <dd className="font-medium text-foreground">
                                                {credential.subaccount_sid || 'Not provided'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Last updated</dt>
                                            <dd className="font-medium text-foreground">
                                                {credential.updated_at
                                                    ? new Date(credential.updated_at).toLocaleString()
                                                    : '—'}
                                            </dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Connect your Twilio account to unlock call routing, caller capture, and automated follow ups.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-4">
                        <HeadingSmall
                            title={credential ? 'Update credentials' : 'Connect Twilio'}
                            description={
                                credential
                                    ? 'Enter your Twilio credentials to rotate tokens, update numbers, or change the connected account.'
                                    : 'Paste your Twilio Account SID and Auth Token to link your workspace.'
                            }
                        />

                        <Card className="border-sidebar-border/60">
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="account_sid">Account SID</Label>
                                        <Input
                                            id="account_sid"
                                            name="account_sid"
                                            placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                            value={form.account_sid}
                                            onChange={handleChange('account_sid')}
                                            autoComplete="off"
                                            required
                                        />
                                        <InputError message={errors.account_sid} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="auth_token">Auth token</Label>
                                        <Input
                                            id="auth_token"
                                            name="auth_token"
                                            placeholder="Paste your Twilio auth token"
                                            value={form.auth_token}
                                            onChange={handleChange('auth_token')}
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <InputError message={errors.auth_token} />
                                        <p className="text-xs text-muted-foreground">
                                            Twilio only shows your auth token once. Generate a new token if you no longer have it saved.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="incoming_phone_e164">Workspace phone number</Label>
                                        <Input
                                            id="incoming_phone_e164"
                                            name="incoming_phone_e164"
                                            placeholder="+15551234567"
                                            value={form.incoming_phone_e164}
                                            onChange={handleChange('incoming_phone_e164')}
                                        />
                                        <InputError message={errors.incoming_phone_e164} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="incoming_phone_sid">Incoming phone SID (optional)</Label>
                                        <Input
                                            id="incoming_phone_sid"
                                            name="incoming_phone_sid"
                                            placeholder="PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                            value={form.incoming_phone_sid}
                                            onChange={handleChange('incoming_phone_sid')}
                                        />
                                        <InputError message={errors.incoming_phone_sid} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="subaccount_sid">Subaccount SID (optional)</Label>
                                        <Input
                                            id="subaccount_sid"
                                            name="subaccount_sid"
                                            placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                            value={form.subaccount_sid}
                                            onChange={handleChange('subaccount_sid')}
                                        />
                                        <InputError message={errors.subaccount_sid} />
                                    </div>

                                    <div className="md:col-span-2 flex items-center gap-3">
                                        <Button type="submit" disabled={saving}>
                                            {saving ? 'Saving...' : credential ? 'Update connection' : 'Connect Twilio'}
                                        </Button>
                                        <p className="text-sm text-muted-foreground">
                                            Need help? Follow the step-by-step guide in the documentation to locate these values inside Twilio Console.
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-4">
                        <HeadingSmall
                            title="Danger zone"
                            description="Disconnecting removes your credentials and stops AI Phone Assistant from handling calls."
                        />
                        <Card className="border-destructive/20">
                            <CardContent className="flex flex-col items-start gap-3 py-6 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="font-medium text-foreground">Disconnect Twilio</p>
                                    <p className="text-sm text-muted-foreground">
                                        You can reconnect anytime. No phone numbers will be released automatically.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={!credential || disconnecting}
                                    onClick={handleDisconnect}
                                >
                                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                </Button>
                            </CardContent>
                        </Card>
                    </section>

                    <Separator />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
