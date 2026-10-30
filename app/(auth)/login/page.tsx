// app/(auth)/login/page.tsx — sign in with an email code (Stytch).
//
// Split layout from lg up: brand panel with a short pitch on the left, the form on the
// right. Below lg only the form shows, with the logo above it.

import { LoginBox } from "@/components/auth/login-box";
import { GridGlow } from "@/components/grid-glow";
import { safeNext } from "@/lib/auth/config";

export const metadata = { title: "Sign in · ADXC" };

const POINTS = [
    {
        title: "See everything your agents ask",
        body: "Every question asked on your account, by people and AI agents, in one place.",
    },
    {
        title: "Know the price before you pay",
        body: "Each answer is quoted with a free preview first. You're only charged when it's bought.",
    },
    {
        title: "Keep each client's work apart",
        body: "Projects keep answers separate, and anything bought is free to reuse inside its project.",
    },
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
            {/* Brand panel */}
            <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex xl:p-16">
                <GridGlow />
                <Logo className="w-9" />

                <div className="max-w-md space-y-10">
                    <div className="space-y-4">
                        <p className="text-caption uppercase text-brand-200">ADXC client panel</p>
                        <h2 className="text-h2 text-white">Premium consumer data, answered for your AI agents.</h2>
                    </div>
                    <ul className="space-y-6">
                        {POINTS.map((p) => (
                            <li key={p.title} className="border-l-2 border-brand-400 pl-4">
                                <p className="font-medium text-white">{p.title}</p>
                                <p className="text-sm text-brand-100">{p.body}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-xs text-brand-200">© {new Date().getFullYear()} ADXC</p>
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
                </div>
            </section>
        </main>
    );
}
