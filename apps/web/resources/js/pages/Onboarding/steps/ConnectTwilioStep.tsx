import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Props = {
    group: { id: number; name?: string };
    onDone: () => void;
};

type ConnectUrlResponse = {
    url: string;
    expires_at: string;
};

const TWILIO_ICON =
    'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA2MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPgoJPHRpdGxlPnR3aWxpby1sb2dvbWFyay13aGl0ZUFydGJvYXJkIDE8L3RpdGxlPgoJPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMzAsMTVBMTUsMTUsMCwxLDAsNDUsMzAsMTUsMTUsMCwwLDAsMzAsMTVabTAsMjZBMTEsMTEsMCwxLDEsNDEsMzAsMTEsMTEsMCwwLDEsMzAsNDFabTYuOC0xNC43YTMuMSwzLjEsMCwxLDEtMy4xLTMuMUEzLjEyLDMuMTIsMCwwLDEsMzYuOCwyNi4zWm0wLDcuNGEzLjEsMy4xLDAsMSwxLTMuMS0zLjFBMy4xMiwzLjEyLDAsMCwxLDM2LjgsMzMuN1ptLTcuNCwwYTMuMSwzLjEsMCwxLDEtMy4xLTMuMUEzLjEyLDMuMTIsMCwwLDEsMjkuNCwzMy43Wm0wLTcuNGEzLjEsMy4xLDAsMSwxLTMuMS0zLjFBMy4xMiwzLjEyLDAsMCwxLDI5LjQsMjYuM1oiLz4KPC9zdmc+';

export default function ConnectTwilioStep({ group, onDone }: Props) {
    const [connectUrl, setConnectUrl] = useState<string | null>(null);
    const [loadingLink, setLoadingLink] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const isLinkDisabled = loadingLink || !connectUrl;

    const fetchConnectUrl = useCallback(async () => {
        setLoadingLink(true);
        setLinkError(null);

        try {
            const { data } = await axios.post<ConnectUrlResponse>(`/api/v1/groups/${group.id}/twilio/connect-url`);
            setConnectUrl(data.url);
        } catch (error) {
            setConnectUrl(null);

            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setLinkError(error.response.data.message);
            } else {
                setLinkError('Unable to prepare the Twilio Connect link right now.');
            }
        } finally {
            setLoadingLink(false);
        }
    }, [group.id]);

    useEffect(() => {
        fetchConnectUrl();
    }, [fetchConnectUrl]);

    const checkStatus = useCallback(async () => {
        setChecking(true);

        try {
            const { data } = await axios.get(`/api/v1/groups/${group.id}/twilio`);

            if (data) {
                toast.success('Twilio account connected');
                onDone();
            } else {
                toast.info('Still waiting on Twilio. Finish the authorization and try again.');
            }
        } catch (error) {
            toast.error('Unable to check the Twilio connection right now.');
        } finally {
            setChecking(false);
        }
    }, [group.id, onDone]);

    return (
        <Card className="border-sidebar-border/60">
            <CardHeader>
                <CardTitle>Connect Twilio</CardTitle>
                <CardDescription>
                    Use Twilio Connect to securely link your account so AI Phone Assistant can purchase numbers and configure webhooks for the “{group.name || 'workspace'}” workspace.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Click the button below to open the Twilio Connect approval flow. Once approved, we receive a scoped subaccount SID so we can provision numbers and manage voice webhooks for you.
                    </p>
                    {linkError ? (
                        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                            <p className="text-sm text-destructive">{linkError}</p>
                            <Button variant="destructive" onClick={fetchConnectUrl} disabled={loadingLink} className="w-full sm:w-auto">
                                {loadingLink ? 'Preparing…' : 'Try again'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <a
                                href={connectUrl ?? '#'}
                                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#F22F46] px-4 text-sm font-semibold text-white transition hover:bg-[#d71939] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F22F46] sm:w-auto ${isLinkDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
                                aria-disabled={isLinkDisabled}
                                onClick={(event) => {
                                    if (isLinkDisabled) {
                                        event.preventDefault();
                                    }
                                }}
                            >
                                <span className="flex items-center justify-center">
                                    <img src={TWILIO_ICON} alt="Twilio" className="h-5 w-5" />
                                </span>
                                {loadingLink ? 'Preparing…' : 'Connect with Twilio'}
                            </a>
                            <Button variant="ghost" onClick={fetchConnectUrl} disabled={loadingLink} className="justify-start px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground sm:w-auto sm:px-3">
                                Need a fresh link?
                            </Button>
                        </div>
                    )}
                </div>

                <Separator />

                <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">What to expect</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>Twilio may ask you to sign in and confirm the AI Phone Assistant Connect App permissions.</li>
                        <li>We automatically save the returned Account SID for this workspace.</li>
                        <li>Once connected, we can buy phone numbers on your behalf and configure the necessary voice webhooks.</li>
                    </ul>
                </div>

                <Button type="button" className="w-full sm:w-auto" onClick={checkStatus} disabled={checking}>
                    {checking ? 'Checking connection…' : 'I’ve connected Twilio'}
                </Button>
            </CardContent>
        </Card>
    );
}
