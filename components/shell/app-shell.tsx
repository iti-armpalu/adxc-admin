"use client";

// Desktop: 48px brand rail + sidebar column + content.
// Mobile: 48px top bar; the hamburger opens the same sidebar in a drawer.

import { useState } from "react";
import { NavRail } from "@/components/nav-rail";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent, type ShellData } from "./sidebar-content";

export function AppShell({ children, ...data }: ShellData & { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <NavRail mobileMenuOpen={open} onMobileMenuToggle={() => setOpen((v) => !v)} />

            <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
                <SidebarContent {...data} />
            </aside>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="w-72 gap-0 bg-sidebar p-0 text-sidebar-foreground"
                >
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SidebarContent {...data} onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}
