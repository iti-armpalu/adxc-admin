// app/(app)/layout.tsx
//
// Authenticated shell. Brand rail on desktop, 48px top bar on mobile.
// TODO: tabs (Overview, Questions, Projects, Team), org switcher and balance
// land here with the shell rebuild.

import { NavRail } from "@/components/nav-rail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <NavRail />
            <main className="flex-1 min-w-0">{children}</main>
        </div>
    );
}
