import AppLayout from '@/layouts/app-layout';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/appointments' },
];

type SlotMode = 'open' | 'staggered';

type ListingOption = {
    id: number;
    title: string;
    address?: string | null;
    postcode?: string | null;
};

type Booking = {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    created_at?: string | null;
    scheduled_at?: string | null;
};

type Slot = {
    id: number;
    start_at?: string | null;
    capacity: number;
    booked: number;
    remaining: number;
    mode: SlotMode;
    slot_interval_minutes?: number | null;
    listing: ListingOption;
    bookings: Booking[];
};

type Defaults = {
    start_at?: string | null;
    capacity?: number | null;
    mode?: SlotMode;
    slot_interval_minutes?: number | null;
};

type Meta = {
    now?: string;
    timezone?: string;
};

type PageProps = {
    listings: ListingOption[];
    slots: Slot[];
    defaults: Defaults;
    meta?: Meta;
};

type SlotFormData = {
    listing_id: string;
    start_at: string;
    capacity: string;
    mode: SlotMode;
    slot_interval_minutes: string;
};

type BookingFormData = {
    viewing_slot_id: string;
    name: string;
    phone: string;
    email: string;
};

const toDateTimeLocal = (value?: string | null): string => {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);

    return local.toISOString().slice(0, 16);
};

const formatDateTime = (value?: string | null): string => {
    if (!value) {
        return 'Time to be confirmed';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

const listingSummary = (listing: ListingOption): string => {
    const parts = [listing.address, listing.postcode]
        .filter((part): part is string => !!part && part.trim().length > 0);

    return parts.join(', ');
};

const minutesLabel = (value: number): string =>
    `${value} minute${value === 1 ? '' : 's'}`;

const computeScheduledDate = (slot: Slot, position: number): Date | null => {
    if (
        slot.mode !== 'staggered' ||
        !slot.slot_interval_minutes ||
        !slot.start_at
    ) {
        return null;
    }

    const start = new Date(slot.start_at);
    if (Number.isNaN(start.getTime())) {
        return null;
    }

    return new Date(
        start.getTime() + slot.slot_interval_minutes * position * 60000,
    );
};

const nextScheduledDate = (slot: Slot): Date | null =>
    computeScheduledDate(slot, slot.bookings.length);

const BookingRow = ({ booking }: { booking: Booking }) => {
    const cancelForm = useForm({});
    const scheduledLabel = booking.scheduled_at
        ? formatDateTime(booking.scheduled_at)
        : null;

    const handleCancel = () => {
        if (!confirm('Cancel this appointment?')) {
            return;
        }

        cancelForm.delete(`/appointments/bookings/${booking.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <li className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <div className="space-y-1">
                <p className="font-medium text-foreground">{booking.name}</p>
                {scheduledLabel && (
                    <p className="text-xs text-muted-foreground">
                        Scheduled for {scheduledLabel}
                    </p>
                )}
                <p className="text-muted-foreground space-x-2">
                    <span>{booking.phone}</span>
                    {booking.email && (
                        <span>
                            <span aria-hidden="true">•</span>{' '}
                            <span className="break-all">{booking.email}</span>
                        </span>
                    )}
                </p>
                {booking.created_at && (
                    <p className="text-xs text-muted-foreground">
                        Added {formatDateTime(booking.created_at)}
                    </p>
                )}
            </div>

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={cancelForm.processing}
            >
                Cancel
            </Button>
        </li>
    );
};

type SlotCardProps = {
    slot: Slot;
    listings: ListingOption[];
    now: Date;
    onSelectSlot: (slotId: number) => void;
};

const SlotCard = ({ slot, listings, now, onSelectSlot }: SlotCardProps) => {
    const bookedCount = slot.bookings.length;
    const remaining =
        Number.isFinite(slot.remaining) && slot.remaining >= 0
            ? slot.remaining
            : Math.max(0, slot.capacity - bookedCount);
    const isFull = remaining <= 0;
    const startsAt = slot.start_at ? new Date(slot.start_at) : null;
    const isPast = startsAt ? startsAt.getTime() < now.getTime() : false;
    const isStaggered = slot.mode === 'staggered';
    const intervalMinutes = slot.slot_interval_minutes ?? 0;
    const modeLabel = isStaggered && intervalMinutes
        ? `Timed visits • ${minutesLabel(intervalMinutes)}`
        : 'Open arrival (group viewing)';
    const nextAppointmentDate = nextScheduledDate(slot);

    const [editOpen, setEditOpen] = useState(false);

    const editForm = useForm<SlotFormData>({
        listing_id: String(slot.listing.id),
        start_at: toDateTimeLocal(slot.start_at),
        capacity: String(slot.capacity),
        mode: slot.mode,
        slot_interval_minutes: slot.slot_interval_minutes
            ? String(slot.slot_interval_minutes)
            : '15',
    });
    const {
        data: editData,
        setData: setEditData,
        put: putSlotUpdate,
        delete: destroySlotRequest,
        processing: editProcessing,
        errors: editErrors,
    } = editForm;

    useEffect(() => {
        setEditData({
            listing_id: String(slot.listing.id),
            start_at: toDateTimeLocal(slot.start_at),
            capacity: String(slot.capacity),
            mode: slot.mode,
            slot_interval_minutes: slot.slot_interval_minutes
                ? String(slot.slot_interval_minutes)
                : '15',
        });
    }, [slot.listing.id, slot.start_at, slot.capacity, slot.mode, slot.slot_interval_minutes, setEditData]);

    const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        editForm.transform((data) => ({
            ...data,
            slot_interval_minutes:
                data.mode === 'staggered'
                    ? Number(data.slot_interval_minutes || 0)
                    : null,
        }));

        putSlotUpdate(`/appointments/slots/${slot.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditOpen(false),
            onFinish: () => {
                editForm.transform((data) => data);
            },
        });
    };

    const handleDelete = () => {
        if (!confirm('Delete this viewing slot? This cannot be undone.')) {
            return;
        }

        destroySlotRequest(`/appointments/slots/${slot.id}`, {
            preserveScroll: true,
        });
    };

    const handleSelectSlot = () => {
        onSelectSlot(slot.id);
        const form = document.getElementById('booking-form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <Card>
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                        {slot.listing.title}
                    </CardTitle>
                    {isPast ? (
                        <Badge variant="outline">Past</Badge>
                    ) : (
                        <Badge variant={isFull ? 'destructive' : 'secondary'}>
                            {isFull
                                ? 'Full'
                                : `${remaining} ${
                                      remaining === 1 ? 'space' : 'spaces'
                                  } left`}
                        </Badge>
                    )}
                    <Badge variant="outline">
                        {isStaggered && intervalMinutes
                            ? `Every ${intervalMinutes} min`
                            : 'Open arrival'}
                    </Badge>
                </div>
                <CardDescription>
                    {formatDateTime(slot.start_at)}
                    {listingSummary(slot.listing) && (
                        <span className="mt-1 block text-xs">
                            {listingSummary(slot.listing)}
                        </span>
                    )}
                    <span className="mt-2 block text-xs text-muted-foreground">
                        {modeLabel}
                    </span>
                    {isStaggered && nextAppointmentDate && remaining > 0 && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                            Next opening at {formatDateTime(nextAppointmentDate.toISOString())}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <p>
                        Capacity{' '}
                        <span className="font-medium text-foreground">
                            {slot.capacity}
                        </span>
                    </p>
                    <p>
                        Booked{' '}
                        <span className="font-medium text-foreground">
                            {bookedCount}
                        </span>
                    </p>
                    <p>
                        Remaining{' '}
                        <span className="font-medium text-foreground">
                            {remaining}
                        </span>
                    </p>
                    {isStaggered && intervalMinutes > 0 && (
                        <p>
                            Interval{' '}
                            <span className="font-medium text-foreground">
                                {minutesLabel(intervalMinutes)}
                            </span>
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                        Bookings
                    </h4>

                    {slot.bookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No appointments booked yet.
                        </p>
                    ) : (
                        <ul className="divide-y rounded-lg border">
                            {slot.bookings.map((booking) => (
                                <BookingRow key={booking.id} booking={booking} />
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex w-full flex-wrap gap-2">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" type="button">
                            Edit slot
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit viewing slot</DialogTitle>
                            <DialogDescription>
                                Update the associated listing, start time,
                                attendance style, or capacity.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleUpdate}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor={`edit-listing-${slot.id}`}>
                                    Listing
                                </Label>
                                <Select
                                    value={editData.listing_id}
                                    onValueChange={(value) =>
                                        setEditData('listing_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id={`edit-listing-${slot.id}`}
                                        aria-invalid={Boolean(
                                            editErrors.listing_id,
                                        )}
                                    >
                                        <SelectValue placeholder="Select a listing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {listings.map((listing) => (
                                            <SelectItem
                                                key={listing.id}
                                                value={String(listing.id)}
                                            >
                                                {listing.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.listing_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`edit-start-${slot.id}`}>
                                    Start time
                                </Label>
                                <Input
                                    id={`edit-start-${slot.id}`}
                                    type="datetime-local"
                                    value={editData.start_at}
                                    onChange={(event) =>
                                        setEditData(
                                            'start_at',
                                            event.currentTarget.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        editErrors.start_at,
                                    )}
                                />
                                <InputError message={editErrors.start_at} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`edit-capacity-${slot.id}`}>
                                    Capacity
                                </Label>
                                <Input
                                    id={`edit-capacity-${slot.id}`}
                                    type="number"
                                    min={bookedCount}
                                    value={editData.capacity}
                                    onChange={(event) =>
                                        setEditData(
                                            'capacity',
                                            event.currentTarget.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        editErrors.capacity,
                                    )}
                                />
                                <InputError message={editErrors.capacity} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`edit-mode-${slot.id}`}>
                                    Attendance style
                                </Label>
                                <Select
                                    value={editData.mode}
                                    onValueChange={(value) => {
                                        const nextMode = value as SlotMode;
                                        setEditData('mode', nextMode);
                                        if (
                                            nextMode === 'staggered' &&
                                            !editData.slot_interval_minutes
                                        ) {
                                            setEditData(
                                                'slot_interval_minutes',
                                                slot.slot_interval_minutes
                                                    ? String(
                                                          slot.slot_interval_minutes,
                                                      )
                                                    : '15',
                                            );
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        id={`edit-mode-${slot.id}`}
                                        aria-invalid={Boolean(
                                            editErrors.mode,
                                        )}
                                    >
                                        <SelectValue placeholder="Choose attendance style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">
                                            Open arrival (everyone together)
                                        </SelectItem>
                                        <SelectItem value="staggered">
                                            Timed appointments
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.mode} />
                            </div>

                            {editData.mode === 'staggered' && (
                                <div className="space-y-2">
                                    <Label htmlFor={`edit-interval-${slot.id}`}>
                                        Slot length (minutes)
                                    </Label>
                                    <Input
                                        id={`edit-interval-${slot.id}`}
                                        type="number"
                                        min={5}
                                        max={240}
                                        step={5}
                                        value={editData.slot_interval_minutes}
                                        onChange={(event) =>
                                            setEditData(
                                                'slot_interval_minutes',
                                                event.currentTarget.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            editErrors.slot_interval_minutes,
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Each booking will be spaced by this
                                        amount.
                                    </p>
                                    <InputError
                                        message={
                                            editErrors.slot_interval_minutes
                                        }
                                    />
                                </div>
                            )}

                            {editErrors.slot && (
                                <InputError message={editErrors.slot} />
                            )}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editProcessing}>
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleSelectSlot}
                    disabled={isPast || isFull}
                >
                    Add booking
                </Button>

                <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={handleDelete}
                    disabled={editProcessing || slot.bookings.length > 0}
                    title={
                        slot.bookings.length > 0
                            ? 'Remove bookings before deleting this slot'
                            : undefined
                    }
                >
                    Delete
                </Button>

                {editErrors.slot && (
                    <InputError
                        message={editErrors.slot}
                        className="basis-full"
                    />
                )}
            </CardFooter>
        </Card>
    );
};

export default function AppointmentsIndex({
    listings,
    slots,
    defaults,
    meta,
}: PageProps) {
    const now = useMemo(
        () => (meta?.now ? new Date(meta.now) : new Date()),
        [meta?.now],
    );

    const upcomingSlots = useMemo(
        () =>
            slots.filter((slot) => {
                if (!slot.start_at) {
                    return true;
                }
                const start = new Date(slot.start_at);
                return !Number.isNaN(start.getTime()) && start >= now;
            }),
        [slots, now],
    );

    const pastSlots = useMemo(
        () =>
            slots.filter((slot) => {
                if (!slot.start_at) {
                    return false;
                }
                const start = new Date(slot.start_at);
                return !Number.isNaN(start.getTime()) && start < now;
            }),
        [slots, now],
    );

    const availableSlots = useMemo(
        () =>
            upcomingSlots.filter(
                (slot) =>
                    slot.remaining > 0 ||
                    slot.capacity - slot.bookings.length > 0,
            ),
        [upcomingSlots],
    );

    const fallbackListingId = listings.length
        ? String(listings[0].id)
        : '';
    const fallbackStart =
        defaults.start_at ?? meta?.now ?? new Date().toISOString();
    const fallbackCapacity = String(defaults.capacity ?? 4);
    const fallbackMode: SlotMode = defaults.mode ?? 'open';
    const fallbackInterval = defaults.slot_interval_minutes != null
        ? String(defaults.slot_interval_minutes)
        : '15';

    const slotForm = useForm<SlotFormData>({
        listing_id: fallbackListingId,
        start_at: toDateTimeLocal(fallbackStart),
        capacity: fallbackCapacity,
        mode: fallbackMode,
        slot_interval_minutes: fallbackInterval,
    });
    const {
        data: slotData,
        setData: setSlotData,
        post: postSlot,
        processing: slotProcessing,
        errors: slotErrors,
        reset: resetSlot,
    } = slotForm;

    const bookingForm = useForm<BookingFormData>({
        viewing_slot_id: availableSlots.length
            ? String(availableSlots[0].id)
            : '',
        name: '',
        phone: '',
        email: '',
    });
    const {
        data: bookingData,
        setData: setBookingData,
        post: postBooking,
        processing: bookingProcessing,
        errors: bookingErrors,
        reset: resetBooking,
    } = bookingForm;

    useEffect(() => {
        if (!listings.length && slotData.listing_id !== '') {
            setSlotData('listing_id', '');
        }

        if (
            listings.length &&
            !listings.some(
                (listing) =>
                    String(listing.id) === slotData.listing_id,
            )
        ) {
            setSlotData('listing_id', fallbackListingId);
        }
    }, [listings, slotData.listing_id, fallbackListingId, setSlotData]);

    useEffect(() => {
        const matchesSelection = availableSlots.some(
            (slot) =>
                String(slot.id) === bookingData.viewing_slot_id,
        );

        if (!availableSlots.length) {
            if (bookingData.viewing_slot_id !== '') {
                setBookingData('viewing_slot_id', '');
            }
            return;
        }

        if (!matchesSelection) {
            setBookingData(
                'viewing_slot_id',
                String(availableSlots[0].id),
            );
        }
    }, [availableSlots, bookingData.viewing_slot_id, setBookingData]);

    const selectedBookingSlot = useMemo(
        () =>
            slots.find(
                (slot) =>
                    String(slot.id) ===
                    bookingData.viewing_slot_id,
            ),
        [slots, bookingData.viewing_slot_id],
    );

    const nextSelectedSlotDate = useMemo(() => {
        if (!selectedBookingSlot) {
            return null;
        }
        return nextScheduledDate(selectedBookingSlot);
    }, [selectedBookingSlot]);

    const submitSlot = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        slotForm.transform((data) => ({
            ...data,
            slot_interval_minutes:
                data.mode === 'staggered'
                    ? Number(data.slot_interval_minutes || 0)
                    : null,
        }));

        postSlot('/appointments/slots', {
            preserveScroll: true,
            onSuccess: () => {
                resetSlot();
                setSlotData(
                    'start_at',
                    toDateTimeLocal(
                        defaults.start_at ??
                            meta?.now ??
                            new Date().toISOString(),
                    ),
                );
                setSlotData('listing_id', fallbackListingId);
                setSlotData('capacity', fallbackCapacity);
                setSlotData('mode', fallbackMode);
                setSlotData('slot_interval_minutes', fallbackInterval);
            },
            onFinish: () => {
                slotForm.transform((data) => data);
            },
        });
    };

    const submitBooking = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        postBooking('/appointments/bookings', {
            preserveScroll: true,
            onSuccess: () =>
                resetBooking('name', 'phone', 'email'),
        });
    };

    const handleSelectSlotForBooking = (slotId: number) => {
        setBookingData('viewing_slot_id', String(slotId));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointments" />

            <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                        Appointments
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create viewing slots, capture bookings, and keep
                        upcoming appointments organised.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create viewing slot</CardTitle>
                            <CardDescription>
                                Choose a listing, pick a start time, and set
                                how many attendees you can host.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!listings.length && (
                                <Alert className="mb-4">
                                    <AlertTitle>
                                        No active listings yet
                                    </AlertTitle>
                                    <AlertDescription>
                                        Create a listing before adding viewing
                                        slots. You will be able to assign
                                        appointments once a listing exists.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form
                                className="space-y-4"
                                onSubmit={submitSlot}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="slot-listing">
                                        Listing
                                    </Label>
                                    <Select
                                        value={slotData.listing_id}
                                        onValueChange={(value) =>
                                            setSlotData(
                                                'listing_id',
                                                value,
                                            )
                                        }
                                        disabled={!listings.length}
                                    >
                                        <SelectTrigger
                                            id="slot-listing"
                                            aria-invalid={Boolean(
                                                slotErrors
                                                    .listing_id,
                                            )}
                                        >
                                            <SelectValue placeholder="Select a listing" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {listings.map((listing) => (
                                                <SelectItem
                                                    key={listing.id}
                                                    value={String(
                                                        listing.id,
                                                    )}
                                                >
                                                    {listing.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={slotErrors.listing_id}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slot-start">
                                        Starts at
                                    </Label>
                                    <Input
                                        id="slot-start"
                                        type="datetime-local"
                                        value={slotData.start_at}
                                        onChange={(event) =>
                                            setSlotData(
                                                'start_at',
                                                event.currentTarget.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            slotErrors.start_at,
                                        )}
                                    />
                                    <InputError
                                        message={slotErrors.start_at}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slot-capacity">
                                        Capacity
                                    </Label>
                                    <Input
                                        id="slot-capacity"
                                        type="number"
                                        min={1}
                                        value={slotData.capacity}
                                        onChange={(event) =>
                                            setSlotData(
                                                'capacity',
                                                event.currentTarget.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            slotErrors.capacity,
                                        )}
                                    />
                                    <InputError
                                        message={slotErrors.capacity}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slot-mode">
                                        Attendance style
                                    </Label>
                                    <Select
                                        value={slotData.mode}
                                        onValueChange={(value) => {
                                            const nextMode = value as SlotMode;
                                            setSlotData('mode', nextMode);
                                            if (
                                                nextMode === 'staggered' &&
                                                !slotData.slot_interval_minutes
                                            ) {
                                                setSlotData(
                                                    'slot_interval_minutes',
                                                    fallbackInterval,
                                                );
                                            }
                                        }}
                                        disabled={!listings.length}
                                    >
                                        <SelectTrigger
                                            id="slot-mode"
                                            aria-invalid={Boolean(
                                                slotErrors.mode,
                                            )}
                                        >
                                            <SelectValue placeholder="Choose attendance style" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">
                                                Open arrival (everyone together)
                                            </SelectItem>
                                            <SelectItem value="staggered">
                                                Timed appointments
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={slotErrors.mode} />
                                </div>

                                {slotData.mode === 'staggered' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="slot-interval">
                                            Slot length (minutes)
                                        </Label>
                                        <Input
                                            id="slot-interval"
                                            type="number"
                                            min={5}
                                            max={240}
                                            step={5}
                                            value={slotData.slot_interval_minutes}
                                            onChange={(event) =>
                                                setSlotData(
                                                    'slot_interval_minutes',
                                                    event.currentTarget.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                slotErrors.slot_interval_minutes,
                                            )}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Each appointment will be spaced by
                                            this number of minutes.
                                        </p>
                                        <InputError
                                            message={
                                                slotErrors.slot_interval_minutes
                                            }
                                        />
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={
                                        slotProcessing ||
                                        !listings.length
                                    }
                                >
                                    Create slot
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card id="booking-form">
                        <CardHeader>
                            <CardTitle>Book an appointment</CardTitle>
                            <CardDescription>
                                Assign a client to an open slot. We&apos;ll
                                keep the count in sync automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!availableSlots.length ? (
                                <Alert>
                                    <AlertTitle>
                                        No open slots available
                                    </AlertTitle>
                                    <AlertDescription>
                                        Create a viewing slot before booking an
                                        appointment. Slots must have remaining
                                        capacity to accept bookings.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <form
                                    className="space-y-4"
                                    onSubmit={submitBooking}
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="booking-slot">
                                            Viewing slot
                                        </Label>
                                        <Select
                                            value={
                                                bookingData
                                                    .viewing_slot_id
                                            }
                                            onValueChange={(value) =>
                                                setBookingData(
                                                    'viewing_slot_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="booking-slot"
                                                aria-invalid={Boolean(
                                                    bookingErrors
                                                        .viewing_slot_id,
                                                )}
                                            >
                                                <SelectValue placeholder="Select a slot" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableSlots.map(
                                                    (slot) => (
                                                    <SelectItem
                                                            key={
                                                                slot.id
                                                            }
                                                            value={String(
                                                                slot.id,
                                                            )}
                                                        >
                                                            {slot
                                                                .listing
                                                                .title}{' '}
                                                            —{' '}
                                                            {formatDateTime(
                                                                slot.start_at,
                                                            )}
                                                            {slot.mode === 'staggered' &&
                                                            slot.slot_interval_minutes
                                                                ? ` • every ${slot.slot_interval_minutes} min`
                                                                : ' • open arrival'}
                                                            {` • ${slot.remaining} left`}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                bookingErrors
                                                    .viewing_slot_id
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="booking-name">
                                            Guest name
                                        </Label>
                                        <Input
                                            id="booking-name"
                                            value={bookingData.name}
                                            onChange={(event) =>
                                                setBookingData(
                                                    'name',
                                                    event.currentTarget.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                bookingErrors.name,
                                            )}
                                        />
                                        <InputError
                                            message={bookingErrors.name}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="booking-phone">
                                            Phone
                                        </Label>
                                        <Input
                                            id="booking-phone"
                                            value={bookingData.phone}
                                            onChange={(event) =>
                                                setBookingData(
                                                    'phone',
                                                    event.currentTarget.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                bookingErrors.phone,
                                            )}
                                        />
                                        <InputError
                                            message={bookingErrors.phone}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="booking-email">
                                            Email (optional)
                                        </Label>
                                        <Input
                                            id="booking-email"
                                            type="email"
                                            value={bookingData.email}
                                            onChange={(event) =>
                                                setBookingData(
                                                    'email',
                                                    event.currentTarget.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                bookingErrors.email,
                                            )}
                                        />
                                        <InputError
                                            message={bookingErrors.email}
                                        />
                                    </div>

                                    {selectedBookingSlot && (
                                        <p className="text-xs text-muted-foreground">
                                            Booking{' '}
                                            <span className="font-medium text-foreground">
                                                {
                                                    selectedBookingSlot
                                                        .listing.title
                                                }
                                            </span>{' '}
                                            for{' '}
                                            {selectedBookingSlot.mode ===
                                            'staggered'
                                                ? formatDateTime(
                                                      (nextSelectedSlotDate
                                                          ?? null)?.toISOString() ??
                                                          selectedBookingSlot.start_at,
                                                  )
                                                : formatDateTime(
                                                      selectedBookingSlot.start_at,
                                                  )}
                                            {selectedBookingSlot.mode ===
                                            'staggered' &&
                                            selectedBookingSlot.slot_interval_minutes
                                                ? ` • ${minutesLabel(selectedBookingSlot.slot_interval_minutes)} per visit`
                                                : ' • open arrival'}
                                            .
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={
                                            bookingProcessing ||
                                            !bookingData.viewing_slot_id
                                        }
                                    >
                                        Add booking
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                            Upcoming slots
                        </h2>
                        {upcomingSlots.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {upcomingSlots.length}{' '}
                                {upcomingSlots.length === 1
                                    ? 'slot scheduled'
                                    : 'slots scheduled'}
                            </span>
                        )}
                    </div>

                    {upcomingSlots.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                            No upcoming slots yet. Create a slot to start
                            receiving bookings.
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {upcomingSlots.map((slot) => (
                                <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    listings={listings}
                                    now={now}
                                    onSelectSlot={
                                        handleSelectSlotForBooking
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                            Recent slots
                        </h2>
                    </div>

                    {pastSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No historical slots yet — finished viewings will
                            appear here for reference once you start booking
                            appointments.
                        </p>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {pastSlots.map((slot) => (
                                <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    listings={listings}
                                    now={now}
                                    onSelectSlot={
                                        handleSelectSlotForBooking
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
