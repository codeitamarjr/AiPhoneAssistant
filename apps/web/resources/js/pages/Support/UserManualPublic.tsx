import PublicDocumentLayout from '@/components/support/PublicDocumentLayout';
import UserManualContent from '@/components/support/UserManualContent';
import { Head } from '@inertiajs/react';

const metaDescription =
    'Comprehensive onboarding manual for AI Phone Assistant: learn how to configure Twilio, manage leads, viewings, and workspace settings.';

export default function UserManualPublic() {
    return (
        <>
            <Head title="User manual">
                <meta name="description" content={metaDescription} />
            </Head>
            <PublicDocumentLayout title="User manual">
                <UserManualContent className="py-12" />
            </PublicDocumentLayout>
        </>
    );
}
