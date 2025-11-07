import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

const prerequisites = [
    'Leasing, lettings, or customer success teams who manage inbound property enquiries.',
    'Access to AI Phone Assistant with an active login.',
    'A Twilio project with at least one voice-capable number configured for inbound calls.',
    'At least one property listing ready to publish to callers.',
    'Use the latest Chrome, Edge, or Safari. Allow pop-ups for Twilio console links and safelist workspace notification emails.',
];

const coreConcepts: Array<{ term: string; description: string }> = [
    {
        term: 'Workspace',
        description:
            'The shared home for listings, calls, bookings, and settings. Created during onboarding and managed under Settings.',
    },
    {
        term: 'Call log',
        description:
            'A timeline of every Twilio call the assistant handles, including status, timestamps, direction, and duration.',
    },
    {
        term: 'Lead',
        description:
            'A caller qualified by the assistant. Leads include contact details, linked listings, notes, and the originating call.',
    },
    {
        term: 'Listing',
        description:
            'A property record (custom, unit, unit type, or collection) that powers the assistant’s responses and viewing availability.',
    },
    {
        term: 'Viewing slot',
        description:
            'An appointment window tied to a listing. Slots can be open arrivals or staggered individual visits.',
    },
    {
        term: 'Booking',
        description:
            'A guest assigned to a specific viewing slot. Bookings sync back to the lead and appointment summary.',
    },
    {
        term: 'Notification channels',
        description:
            'Email alerts (new leads, bookings, cancellations) that each teammate can opt into from their own settings.',
    },
];

const gettingStartedSteps: Array<{ id: string; title: string; steps: string[] }> = [
    {
        id: 'sign-in',
        title: 'Sign in and launch the onboarding wizard',
        steps: [
            'Visit the landing page and select Log in.',
            'On first sign-in the onboarding wizard opens automatically. You can reopen it from the welcome screen if you step away.',
        ],
    },
    {
        id: 'workspace',
        title: 'Create your workspace',
        steps: [
            'Enter a workspace name that callers will recognise.',
            'Submit to create the workspace. You can rename it later from Settings > Workspace team.',
        ],
    },
    {
        id: 'twilio',
        title: 'Connect Twilio',
        steps: [
            'Use the onboarding wizard to launch Twilio Connect and approve access for AI Phone Assistant.',
            'We store the Account SID Twilio returns. Optional fields (phone SID, workspace number) can be added later in Settings > Twilio & Calls.',
            'After saving, follow the in-app link to set the voice and status callback URLs inside the Twilio Console.',
        ],
    },
    {
        id: 'listings',
        title: 'Seed your listings',
        steps: [
            'Open the user menu in the sidebar footer and choose Listings.',
            'Create at least one listing so the assistant serves current availability, pricing, and policy information.',
            'Mark the listing as Published when it is ready for callers.',
        ],
    },
    {
        id: 'team',
        title: 'Invite your team',
        steps: [
            'Navigate to Settings > Workspace team.',
            'Only owners or admins can invite new members. Enter the teammate’s name and email, then send the invite.',
            'Pending invitations appear in the list so you can resend or revoke them if needed.',
        ],
    },
    {
        id: 'preferences',
        title: 'Configure notifications and theme',
        steps: [
            'Visit Settings > Notification preferences to choose the email alerts you want (new leads, bookings, cancellations).',
            'Visit Settings > Appearance to switch between light, dark, or system themes.',
        ],
    },
];

const navigationPoints = [
    'The left sidebar highlights the main surfaces: Dashboard and Appointments. It collapses to icons on smaller screens.',
    'The sidebar footer shows your avatar. Click it for Settings, Listings, and Log out.',
    'Breadcrumbs across the top remind you where you are and provide quick back-navigation.',
    'Tables include search, filters, and pagination. Selections persist while you remain on the page.',
];

const dashboardHighlights = [
    'Call stats widget tracks monthly call volume, completion rate, and minutes handled. Data refreshes every 60 seconds.',
    'Lead stats widget surfaces new leads, capture rate, unique callers, and open pipeline segments.',
    'Viewing stats widget summarises total viewings, fulfilment rate, and cancellations for the current period.',
    'The lower card toggles between Calls and Leads for live activity. Use the buttons to switch without leaving the dashboard.',
];

const callMonitoringPoints = [
    'Open the Calls panel on the dashboard for the full call log.',
    'Search by number, caller name, or Twilio SID. Filter by status (in-progress, completed, busy, no-answer, failed, canceled) and adjust rows per page.',
    'Columns include start time, from/to numbers, caller name, status badge, duration, and Twilio SID (visible on wide screens).',
    'The table auto-refreshes every 10 seconds. Manual pagination, sorting, and filters remain in place.',
    'Click a row to inspect the linked lead in the companion panel when available.',
];

const leadManagementPoints = [
    'Switch the dashboard activity panel to Leads for a structured queue.',
    'Search across name, phone, email, and listing; filter by lead status; and sort by created time, name, status, or source.',
    'Select a lead to open the detail dialog with editable status dropdown (new, contacted, qualified, waitlist, rejected). Updates save optimistically.',
    'Review caller details, capture source, timestamps, notes, and linked listing information.',
    'Use the Booking quick view to see slot mode, scheduled time, and contact information whenever a viewing exists.',
    'Lead data refreshes every 15 seconds. Failed status updates revert to the previous value automatically.',
];

const appointmentCreationPoints = [
    'Open Appointments from the sidebar to plan viewings.',
    'Choose a listing, start date/time, capacity, and attendance style (open arrival or timed appointments).',
    'Timed appointments require an interval length between 5 and 240 minutes.',
    'Defaults (start time, capacity, interval) repopulate after each successful submission.',
];

const bookingManagementPoints = [
    'Use Book an appointment to assign a guest to an open slot.',
    'Select the slot first, then provide the guest’s name, phone, and optional email.',
    'Helper text confirms the listing and timestamp that will be booked, including per-visit duration for staggered slots.',
    'Cancel bookings from the slot card. Cancellation requests require confirmation and immediately reopen the space.',
    'Slots cannot be deleted while bookings exist, helping prevent accidental data loss.',
];

const slotOverviewPoints = [
    'Upcoming slots display capacity, remaining spaces, mode, listing summary, and next available interval.',
    'Slot cards offer quick actions to edit details, add a booking (scrolls to the booking form), or delete the slot when empty.',
    'Past slots remain available for historical reference in the Recent slots section once viewings complete.',
];

const listingCreationPoints = [
    'Access listings through the user menu > Listings.',
    'Select New Listing and choose the inventory scope: Custom listing, Single unit, Unit type, or Collection of units.',
    'Fill headline details (title, address, postcode, rent, availability), marketing content (summary, amenities, policies), and operational data (BER, floor area, furnishing, parking, heating).',
    'Attach a phone number so call routing remains accurate. JSON-friendly fields accept formatted data and preserve indentation.',
    'Inline validation errors appear next to each field for quick corrections.',
];

const listingLifecyclePoints = [
    'Toggle Published when the listing is ready for callers. Draft listings remain hidden from the assistant.',
    'Use the listings table for search, column sorting, status badges, and pagination.',
    'Choose Edit for updates or Delete to retire a listing (with confirmation).',
];

const settingsSections: Array<{ title: string; items: string[] }> = [
    {
        title: 'Profile & security',
        items: [
            'Settings > Profile lets you change your name and primary email. Errors surface inline.',
            'Settings > Password handles password rotation with current, new, and confirmation fields.',
            'Settings > Two-factor Authentication guides you through enabling TOTP apps, downloading recovery codes, and disabling 2FA.',
        ],
    },
    {
        title: 'Notification preferences',
        items: [
            'Settings > Notification preferences toggles email channels such as new leads and new bookings/cancellations.',
            'Click Save preferences to persist your selection. Errors display as toast messages.',
        ],
    },
    {
        title: 'Workspace team',
        items: [
            'Settings > Workspace team lists members and invitations.',
            'Owners or admins can invite teammates, resend or revoke invitations, and remove members.',
            'Invitations expire after 14 days. Removing a member revokes access immediately.',
        ],
    },
    {
        title: 'Twilio & Calls',
        items: [
            'Settings > Twilio & Calls shows connection status, timestamps, and configured numbers.',
            'Use Connect/Edit Twilio to update the Account SID, workspace number, phone SID, or subaccount SID. Twilio auth tokens stay in your main account and are never stored here.',
            'You can disconnect Twilio or reopen the modal from the same page. Field errors display inline and via toast notifications.',
        ],
    },
    {
        title: 'Appearance',
        items: [
            'Settings > Appearance offers light, dark, and system themes.',
            'Theme choices persist locally per user and apply across the app.',
        ],
    },
];

const emailSyncPoints = [
    'Email channels line up with the API documented in apps/web/README.MD.',
    'The leads channel emails summaries whenever the assistant captures a new lead.',
    'The bookings channel emails confirmations and cancellations.',
    'Channels are per-user, so each teammate chooses their own notifications.',
    'Events always appear in the dashboard and appointments pages even if email is delayed.',
];

const dailyChecklist = [
    'Start on the Dashboard to review overnight call, lead, and viewing metrics.',
    'Scan the Calls panel for failed or missed calls that may need manual follow-up.',
    'Process the Leads queue: update statuses, read notes, and review linked bookings.',
    'Visit Appointments to confirm upcoming capacities, add manual bookings, and archive past slots.',
    'Update Listings whenever availability, pricing, or policies change.',
    'Check Settings > Notification preferences after staffing changes to ensure alerts reach the right inboxes.',
];

const troubleshootingItems: Array<{ prompt: string; resolution: string }> = [
    {
        prompt: 'Dashboard stats are blank or stale',
        resolution:
            'Refresh the page to restart polling. If metrics stay empty, confirm Twilio connectivity under Settings > Twilio & Calls.',
    },
    {
        prompt: 'Calls are not appearing',
        resolution:
            'Verify that Twilio webhook URLs target the assistant endpoints and that the workspace number is correct.',
    },
    {
        prompt: 'Cannot add a booking',
        resolution:
            'Ensure the slot has remaining capacity, the start time is in the future, and staggered slots are not already full for the selected interval.',
    },
    {
        prompt: 'Invitation failed',
        resolution:
            'Only owners and admins can invite teammates. Double-check the email and confirm the user does not already belong to the workspace.',
    },
    {
        prompt: 'Lead status reverted',
        resolution:
            'The API can reject invalid transitions. Reopen the lead dialog—if the change failed, the original value restores automatically.',
    },
];

const supportResources = [
    'Share this page or the Markdown version at docs/user-manual.md with new teammates.',
    'Technical teams can reference the API examples in apps/web/README.MD and the OpenAPI document in apps/web/api-openapi.baseurl.yaml.',
    'When escalating issues, capture timestamps and Twilio Call SIDs from the dashboard to speed up investigations.',
];

const callStatuses = [
    { status: 'in-progress', description: 'Caller is currently connected to the assistant.' },
    { status: 'completed', description: 'Call ended normally.' },
    { status: 'busy', description: 'Twilio reported the destination line was busy.' },
    { status: 'no-answer', description: 'The assistant rang but nobody picked up before timeout.' },
    { status: 'failed', description: 'Twilio could not place or sustain the call (for example invalid number or network issue).' },
    { status: 'canceled', description: 'The call ended before connection (for example caller hung up immediately).' },
];

const leadStatuses = [
    { status: 'new', description: 'Fresh lead awaiting review.' },
    { status: 'contacted', description: 'Your team has reached out to the lead.' },
    { status: 'qualified', description: 'Lead meets your criteria and is ready for next steps.' },
    { status: 'waitlist', description: 'Lead is interested but waiting on availability or timing.' },
    { status: 'rejected', description: 'Lead is not a fit or asked to be removed from follow-up.' },
];

const appointmentModes = [
    { mode: 'Open arrival', description: 'All guests share the same window; capacity reflects the total people expected at once.' },
    { mode: 'Timed appointments', description: 'Guests are spaced by the slot interval; the assistant calculates the next available start time.' },
];

const toc = [
    { id: 'overview', label: 'Overview' },
    { id: 'getting-started', label: 'Getting started' },
    { id: 'interface', label: 'Interface' },
    { id: 'dashboard', label: 'Dashboard activity' },
    { id: 'call-monitoring', label: 'Call monitoring' },
    { id: 'lead-management', label: 'Lead management' },
    { id: 'appointments', label: 'Appointments & viewings' },
    { id: 'listings', label: 'Listings' },
    { id: 'settings', label: 'Settings & configuration' },
    { id: 'notifications', label: 'Email & sync' },
    { id: 'workflow', label: 'Daily workflow' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'support', label: 'Support & appendix' },
];

type SectionProps = {
    id: string;
    title: string;
    children: ReactNode;
};

function Section({ id, title, children }: SectionProps) {
    return (
        <section id={id} className="scroll-mt-24 space-y-4">
            <header>
                <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            </header>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
        </section>
    );
}

export type UserManualContentProps = {
    className?: string;
};

export default function UserManualContent({ className }: UserManualContentProps) {
    return (
        <div className={cn('mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8', className)}>
            <header className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        AI Phone Assistant
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        User manual & onboarding guide
                    </h1>
                    <p className="text-base text-muted-foreground">
                        Everything your team needs to set up, operate, and troubleshoot the AI Phone Assistant inside your workspace.
                        Link this page from your CRM or share it with new teammates during onboarding.
                    </p>
                </div>

                <nav aria-label="Manual sections">
                    <ul className="flex flex-wrap gap-2 text-sm">
                        {toc.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    className="inline-flex items-center rounded-full border border-border/60 px-3 py-1 text-muted-foreground transition hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400"
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <Section id="overview" title="Audience & prerequisites">
                <ul className="list-disc space-y-2 pl-5">
                    {prerequisites.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Core concepts</h3>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        {coreConcepts.map((concept) => (
                            <div key={concept.term} className="rounded-lg border border-border/60 p-4">
                                <dt className="text-sm font-semibold text-foreground">{concept.term}</dt>
                                <dd className="mt-2 text-sm text-muted-foreground">{concept.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </Section>

            <Section id="getting-started" title="Getting started">
                <ol className="space-y-6 text-sm">
                    {gettingStartedSteps.map((step, index) => (
                        <li key={step.id} id={step.id} className="rounded-lg border border-border/60 p-4">
                            <p className="text-base font-semibold text-foreground">
                                {index + 1}. {step.title}
                            </p>
                            <ul className="mt-3 list-disc space-y-2 pl-5">
                                {step.steps.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ol>
            </Section>

            <Section id="interface" title="Navigating the interface">
                <ul className="list-disc space-y-2 pl-5">
                    {navigationPoints.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </Section>

            <Section id="dashboard" title="Dashboard KPIs & live activity">
                <ul className="list-disc space-y-2 pl-5">
                    {dashboardHighlights.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </Section>

            <Section id="call-monitoring" title="Call monitoring">
                <ul className="list-disc space-y-2 pl-5">
                    {callMonitoringPoints.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </Section>

            <Section id="lead-management" title="Lead management">
                <ul className="list-disc space-y-2 pl-5">
                    {leadManagementPoints.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </Section>

            <Section id="appointments" title="Appointments & viewings">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Create slots</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5">
                            {appointmentCreationPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-foreground">Manage bookings</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5">
                            {bookingManagementPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-foreground">Monitor slots</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5">
                            {slotOverviewPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            <Section id="listings" title="Listings">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Create listings</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5">
                            {listingCreationPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-foreground">Lifecycle</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5">
                            {listingLifecyclePoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            <Section id="settings" title="Settings & configuration">
                <div className="space-y-6">
                    {settingsSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                            <ul className="mt-2 list-disc space-y-2 pl-5">
                                {section.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </Section>

            <Section id="notifications" title="Email & sync">
                <ul className="list-disc space-y-2 pl-5">
                    {emailSyncPoints.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </Section>

            <Section id="workflow" title="Daily workflow">
                <ul className="list-disc space-y-2 pl-5">
                    {dailyChecklist.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            </Section>

            <Section id="troubleshooting" title="Troubleshooting">
                <div className="space-y-4">
                    {troubleshootingItems.map((item) => (
                        <div key={item.prompt} className="rounded-lg border border-border/60 p-4">
                            <p className="text-sm font-semibold text-foreground">{item.prompt}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{item.resolution}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section id="support" title="Support & appendix">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Resources</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5">
                            {supportResources.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-foreground">Status glossary</h3>
                        <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-lg border border-border/60 p-4">
                                <h4 className="text-sm font-semibold text-foreground">Call statuses</h4>
                                <dl className="mt-3 space-y-2">
                                    {callStatuses.map((status) => (
                                        <div key={status.status}>
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {status.status}
                                            </dt>
                                            <dd className="text-sm text-muted-foreground">{status.description}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            <div className="rounded-lg border border-border/60 p-4">
                                <h4 className="text-sm font-semibold text-foreground">Lead statuses</h4>
                                <dl className="mt-3 space-y-2">
                                    {leadStatuses.map((status) => (
                                        <div key={status.status}>
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {status.status}
                                            </dt>
                                            <dd className="text-sm text-muted-foreground">{status.description}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-foreground">Appointment modes</h3>
                        <dl className="mt-2 space-y-3">
                            {appointmentModes.map((mode) => (
                                <div key={mode.mode} className="rounded-lg border border-border/60 p-4">
                                    <dt className="text-sm font-semibold text-foreground">{mode.mode}</dt>
                                    <dd className="mt-2 text-sm text-muted-foreground">{mode.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </Section>
        </div>
    );
}
