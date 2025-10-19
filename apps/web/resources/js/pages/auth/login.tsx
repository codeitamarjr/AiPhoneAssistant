import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [hasConsented, setHasConsented] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (!hasConsented) {
            event.preventDefault();
            event.stopPropagation();
            setShowConsentModal(true);
            return false;
        }

        return true;
    };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
                onSubmit={handleSubmit}
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={6}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <div className="flex items-start gap-3">
                                <input type="checkbox" name="policy_consent" className="sr-only" value="1" checked={hasConsented} readOnly required />
                                <Checkbox
                                    id="policy_consent"
                                    checked={hasConsented}
                                    onCheckedChange={(value) => setHasConsented(value === true)}
                                    tabIndex={4}
                                    aria-required
                                />
                                <Label htmlFor="policy_consent" className="text-sm leading-6 text-muted-foreground">
                                    As required under GDPR and EU regulations, I confirm that I agree to the necessary{' '}
                                    <Link href="/cookie-policy" className="font-medium text-primary underline-offset-4 hover:underline">
                                        Cookie Policy
                                    </Link>
                                    ,{' '}
                                    <Link href="/privacy-policy" className="font-medium text-primary underline-offset-4 hover:underline">
                                        Privacy Policy
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/terms-of-use" className="font-medium text-primary underline-offset-4 hover:underline">
                                        Terms of Use
                                    </Link>
                                    . Required cookies are essential for secure access to your workspace.
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={5}
                                disabled={processing}
                                data-test="login-button"
                                onClick={(event) => {
                                    if (!hasConsented) {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setShowConsentModal(true);
                                    }
                                }}
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Log in
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href={register()} tabIndex={6}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Accept required policies</DialogTitle>
                        <DialogDescription>
                            As per GDPR and EU regulations, you must accept the <Link href="/cookie-policy" className="font-medium text-primary underline-offset-4 hover:underline">
                                Cookie Policy
                            </Link>, <Link href="/privacy-policy" className="font-medium text-primary underline-offset-4 hover:underline">
                                Privacy Policy
                            </Link>{' '}, and <Link href="/terms-of-use" className="font-medium text-primary underline-offset-4 hover:underline">
                                Terms of Use
                            </Link> before continuing.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button">I understand</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthLayout>
    );
}
