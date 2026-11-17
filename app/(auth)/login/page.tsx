// app/(auth)/login/page.tsx — sign in with an email code (Stytch).
//
// Split layout from lg up (50/50): brand panel on the left — logo top, headline centred,
// data-partner strip at the bottom — and the form on the right. Below lg only the form shows.

import { LoginBox } from "@/components/auth/login-box";
import { GridGlow } from "@/components/grid-glow";
import { safeNext } from "@/lib/auth/config";

export const metadata = { title: "Sign in · ADXC" };

// Monitoring/testing mode: copy avoids spend, credits and billing.
// Partner logos are the providers' own SVGs, shown in one neutral colour (see the filter below).
const PARTNERS: { name: string; src: string }[] = [
    { name: "YouGov", src: "/yougov-logo.svg" },
    { name: "Quid", src: "/quid-logo.svg" },
    { name: "Serpstat", src: "/serpstat-logo-1.svg" },
];

function Logo({ className }: { className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- SVG: plain img by convention
        <img src="/adxc-logo-white-stacked.svg" alt="ADXC" width={21} height={24} className={className} />
    );
}

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);

    return (
        <main className="grid min-h-screen lg:grid-cols-2">
            {/* Brand panel (lg+ only) */}
            <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
                <GridGlow />
                <Logo className="w-9" />

                <div className="max-w-[480px] space-y-4">
                    <h2 className="text-h1 text-white">
                        <span className="block">Data you can rely on</span>
                        <span className="block">for big decisions</span>
                    </h2>
                    <p className="text-brand-100">Monitor queries, answers and activity across ADXC.</p>
                </div>

                <div className="space-y-3">
                    <p className="text-caption uppercase text-brand-200">Answers from</p>
                    <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        {PARTNERS.map((p) => (
                            <li key={p.name}>
                                {/* brightness(0) invert(1) turns every colour in the file white, so the
                                    brand logos read as one neutral set on the plum panel. */}
                                {/* eslint-disable-next-line @next/next/no-img-element -- SVG: plain img by convention */}
                                <img src={p.src} alt={p.name} className="h-6 w-auto opacity-80 brightness-0 invert" />
                            </li>
                        ))}
                        <li className="text-sm text-brand-200">More coming soon</li>
                    </ul>
                </div>
            </section>

            {/* Form */}
            <section className="flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex size-12 items-center justify-center bg-brand-700 lg:hidden">
                        <Logo className="w-7" />
                    </div>
                    <header className="space-y-1">
                        <h1 className="text-h3">Sign in</h1>
                        <p className="text-sm text-muted-foreground">Enter your work email and we&apos;ll send you a code.</p>
                    </header>
                    <div className="border bg-card">
                        <LoginBox next={next} />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        Need access? Contact your ADXC account manager.
                    </p>
                </div>
            </section>
        </main>
    );
}
