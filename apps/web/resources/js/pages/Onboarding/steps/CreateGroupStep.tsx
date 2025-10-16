import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';

type Props = {
    onDone: () => void;
};

export default function CreateGroupStep({ onDone }: Props) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await axios.post('/api/v1/groups', { name });
            toast.success('Workspace created', {
                description: `${name} is ready to configure Twilio.`,
            });
            onDone();
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message ?? err.message
                : 'Unable to create workspace right now.';
            setError(message);
            toast.error('Workspace could not be created', {
                description: message,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-sidebar-border/60">
            <CardHeader>
                <CardTitle>Name your workspace</CardTitle>
                <CardDescription>
                    Start by creating a workspace. This keeps your listings, calls, and team members organised in one place.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="group_name">Workspace name</Label>
                        <Input
                            id="group_name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Real Enquiries Ltd"
                            autoFocus
                            required
                            minLength={3}
                        />
                        <InputError message={error ?? undefined} />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        You can invite your teammates once the workspace is created. Choose a name your customers will recognise.
                    </p>

                    <Button type="submit" disabled={saving || !name.trim()} className="w-full md:w-auto">
                        {saving ? 'Creating…' : 'Create workspace'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
