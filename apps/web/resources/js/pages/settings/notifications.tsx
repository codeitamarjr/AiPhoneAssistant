import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import type { CheckedState } from '@radix-ui/react-checkbox';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notification preferences',
        href: '/settings/notifications',
    },
];

type Channel = {
    key: string;
    label: string;
    description: string;
};

type PageProps = SharedData & {
    channels: Channel[];
    subscriptions: string[];
};

export default function NotificationSettings() {
    const { channels, subscriptions } = usePage<PageProps>().props;
    const [selected, setSelected] = useState<Set<string>>(new Set(subscriptions));
    const [saving, setSaving] = useState(false);

    const handleToggle = (key: string) => (checked: CheckedState) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(key);
            } else {
                next.delete(key);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put('/api/v1/notification-preferences', {
                channels: Array.from(selected),
            });
            toast.success('Notification preferences updated');
        } catch (error) {
            toast.error('Unable to save notification preferences', {
                description: 'Please try again in a moment.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification preferences" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Notification preferences"
                        description="Choose which AI Phone Assistant events should send you an email."
                    />

                    <Card className="border-sidebar-border/60">
                        <CardHeader>
                            <CardTitle>Email alerts</CardTitle>
                            <CardDescription>
                                Manage the types of notifications you receive from AI Phone Assistant.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                {channels.map((channel) => {
                                    const isChecked = selected.has(channel.key);
                                    return (
                                        <div
                                            key={channel.key}
                                            className="flex items-start gap-3 rounded-lg border border-border/60 p-4 shadow-sm"
                                        >
                                            <Checkbox
                                                id={`channel-${channel.key}`}
                                                checked={isChecked}
                                                onCheckedChange={handleToggle(channel.key)}
                                                disabled={saving}
                                                className="mt-1"
                                            />
                                            <div className="space-y-1">
                                                <Label htmlFor={`channel-${channel.key}`} className="text-base font-medium">
                                                    {channel.label}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">{channel.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save preferences'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
