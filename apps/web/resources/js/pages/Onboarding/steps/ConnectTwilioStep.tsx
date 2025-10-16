import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import InputError from '@/components/input-error';

type Props = {
    group: { id: number; name?: string };
    onDone: () => void;
};

export default function ConnectTwilioStep({ group, onDone }: Props) {
    const [form, setForm] = useState({
        account_sid: '',
        auth_token: '',
        incoming_phone_e164: '',
    });
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [saving, setSaving] = useState(false);

    const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await axios.post(`/api/v1/groups/${group.id}/twilio`, form);
            toast.success('Twilio connected');
            onDone();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors ?? {};
                const formatted: Record<string, string | undefined> = {};
                Object.entries(validationErrors).forEach(([key, messages]) => {
                    formatted[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setErrors(formatted);
                toast.error('Please check the highlighted fields.');
            } else {
                toast.error('Unable to connect Twilio right now.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-sidebar-border/60">
            <CardHeader>
                <CardTitle>Connect Twilio</CardTitle>
                <CardDescription>
                    Paste your Twilio credentials to let AI Phone Assistant route calls and capture leads for the “{group.name || 'workspace'}” workspace.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="account_sid">Account SID</Label>
                        <Input
                            id="account_sid"
                            placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            value={form.account_sid}
                            onChange={handleChange('account_sid')}
                            autoComplete="off"
                            required
                        />
                        <InputError message={errors.account_sid} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="auth_token">Auth token</Label>
                        <Input
                            id="auth_token"
                            placeholder="Paste your Twilio auth token"
                            value={form.auth_token}
                            onChange={handleChange('auth_token')}
                            type="password"
                            autoComplete="new-password"
                            required
                        />
                        <InputError message={errors.auth_token} />
                        <p className="text-xs text-muted-foreground">
                            Your auth token is encrypted as soon as it reaches our servers. You can rotate it anytime from Settings → Twilio & Calls.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="incoming_phone_e164">Workspace phone number (optional)</Label>
                        <Input
                            id="incoming_phone_e164"
                            placeholder="+15551234567"
                            value={form.incoming_phone_e164}
                            onChange={handleChange('incoming_phone_e164')}
                            autoComplete="tel"
                        />
                        <InputError message={errors.incoming_phone_e164} />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">Before you continue</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            <li>Log in to Twilio Console and copy your primary Account SID and Auth Token.</li>
                            <li>Choose the incoming number you want AI Phone Assistant to answer and paste it above.</li>
                            <li>After saving, we’ll guide you through setting webhook URLs for voice and status callbacks.</li>
                        </ul>
                    </div>

                    <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? 'Connecting…' : 'Save & continue'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
