import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, SharedData } from '@/types';
import { show as showTeam } from '@/routes/team';

type TeamMember = {
    id: number;
    name: string;
    email: string;
    role: string;
    joined_at?: string | null;
};

type Invitation = {
    id: number;
    name: string | null;
    email: string;
    sent_at?: string | null;
};

type PageProps = SharedData & {
    group: {
        id: number;
        name: string;
    };
    members: TeamMember[];
    invitations: Invitation[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Workspace team',
        href: showTeam().url,
    },
];

export default function TeamSettings() {
    const { group, members, invitations, auth } = usePage<PageProps>().props;
    const [pendingInvites, setPendingInvites] = useState<Invitation[]>(invitations);
    const [form, setForm] = useState({ name: '', email: '' });
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const currentMember = members.find((member) => member.email === auth.user.email);
    const canInvite = currentMember ? ['owner', 'admin'].includes(currentMember.role) : false;

    const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const { data } = await axios.post(`/api/v1/groups/${group.id}/invitations`, form);
            const invitation = data?.invitation as Invitation | undefined;
            if (invitation) {
                setPendingInvites((prev) => [invitation, ...prev]);
            }
            setForm({ name: '', email: '' });
            toast.success('Invitation sent', {
                description: `${form.email} will receive an email with next steps.`,
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data?.errors ?? {});
            } else {
                toast.error('Unable to send invitation', {
                    description: 'Please try again in a moment.',
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workspace team" />

            <SettingsLayout>
                <div className="space-y-10">
                    <section className="space-y-4">
                        <HeadingSmall
                            title="Invite a teammate"
                            description={`Share access to the ${group.name} workspace by sending them an invitation.`}
                        />

                        <Card className="border-sidebar-border/60">
                            <CardHeader>
                                <CardTitle>Send an invite</CardTitle>
                                <CardDescription>
                                    We'll email your teammate a link to set their password and join the workspace.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="invite-name">Name</Label>
                                        <Input
                                            id="invite-name"
                                            name="name"
                                            placeholder="Teammate name"
                                            value={form.name}
                                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                            autoComplete="name"
                                            required
                                            disabled={!canInvite || submitting}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="invite-email">Email</Label>
                                        <Input
                                            id="invite-email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={form.email}
                                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                            autoComplete="email"
                                            required
                                            disabled={!canInvite || submitting}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="md:col-span-2 flex items-center gap-3">
                                        <Button type="submit" disabled={submitting || !canInvite}>
                                            {submitting ? 'Sending...' : 'Send invitation'}
                                        </Button>
                                        <p className="text-sm text-muted-foreground">
                                            {canInvite
                                                ? 'Invitations expire after 14 days.'
                                                : 'Only workspace owners or admins can invite new members.'}
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-4">
                        <HeadingSmall
                            title="Workspace members"
                            description="Manage everyone who can access this workspace."
                        />

                        <div className="overflow-hidden rounded-lg border border-sidebar-border/60">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Name</th>
                                        <th className="px-4 py-2 font-medium">Email</th>
                                        <th className="px-4 py-2 font-medium">Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.id} className="border-t border-sidebar-border/60 bg-background">
                                            <td className="px-4 py-2 font-medium text-foreground">{member.name}</td>
                                            <td className="px-4 py-2 text-muted-foreground">{member.email}</td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                                                        member.role === 'owner'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                                                            : member.role === 'admin'
                                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                              : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200',
                                                    )}
                                                >
                                                    {member.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <HeadingSmall
                            title="Pending invitations"
                            description="Invitations waiting to be accepted."
                        />

                        {pendingInvites.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pending invitations right now.</p>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-sidebar-border/60">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Name</th>
                                            <th className="px-4 py-2 font-medium">Email</th>
                                            <th className="px-4 py-2 font-medium">Sent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingInvites.map((invite) => (
                                            <tr key={invite.id} className="border-t border-sidebar-border/60 bg-background">
                                                <td className="px-4 py-2 font-medium text-foreground">{invite.name ?? '—'}</td>
                                                <td className="px-4 py-2 text-muted-foreground">{invite.email}</td>
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {invite.sent_at ? new Date(invite.sent_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <Separator />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
