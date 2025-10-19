import UserManualContent from '@/components/support/UserManualContent';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'User manual', href: '/support/user-manual' },
];

export default function UserManual() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User manual" />
            <UserManualContent />
        </AppLayout>
    );
}
