import { useEffect, useState } from 'react';
import axios from 'axios';
import CreateGroupStep from './steps/CreateGroupStep';
import ConnectTwilioStep from './steps/ConnectTwilioStep';

export default function OnboardingWizard() {
    const [status, setStatus] = useState<any>();
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setError(null);
            const { data } = await axios.get('/api/v1/onboarding/status');
            setStatus(data);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load');
        }
    };
    useEffect(() => { load(); }, []);
    if (error) return <div className="text-red-600">Error: {error}</div>;
    if (!status) return <div>Loading…</div>;

    if (!status.has_group) return <CreateGroupStep onDone={load} />;

    if (!status.has_twilio)
        return <ConnectTwilioStep group={status.group} onDone={load} />;

    return (
        <div className="max-w-xl space-y-3">
            <h1 className="text-2xl font-semibold">All set 🎉</h1>
            <p>Your group and Twilio connection are ready.</p>
            <a className="inline-flex items-center px-4 py-2 rounded bg-indigo-600 text-white" href="/dashboard">
                Go to dashboard
            </a>
        </div>
    );
}
