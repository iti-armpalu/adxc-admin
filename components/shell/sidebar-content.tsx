"use client";

// Sidebar body, shared by the desktop column and the mobile drawer.
// Org name on top, tabs in the middle (scrolls), balance + who you are pinned at the bottom.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "./org-switcher";
import { SignOutButton } from "./sign-out-button";

export type ShellUser = { primary: string; secondary: string };

export type ShellData = {
    orgName: string | null;
    balance: string | null;
    user: ShellUser | null;
    isAdmin: boolean;
    /** Signed in as a person (Stytch), not the dev API key. */
    isPerson: boolean;
};

function isActive(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({ orgName, balance, user, isAdmin, isPerson, onNavigate }: ShellData & { onNavigate?: () => void }) {
    const pathname = usePathname();
    const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-sidebar-border px-4 py-4">
                <OrgSwitcher orgName={orgName} />
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
                <ul className="space-y-0.5">
                    {items.map((item) => {
                        const active = isActive(pathname, item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={onNavigate}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex h-9 items-center rounded-xs border-l-2 px-3 text-sm transition-colors",
                                        active
                                            ? "border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                            : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="shrink-0 space-y-3 border-t border-sidebar-border px-4 py-4">
                <div>
                    <p className="text-caption uppercase text-sidebar-muted">Credits</p>
                    <p className="text-lg font-medium text-foreground">{balance ?? "—"}</p>
                </div>
                {user && (
                    <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{user.primary}</p>
                        <p className="truncate text-xs text-sidebar-muted">{user.secondary}</p>
                    </div>
                )}
                {isPerson && <SignOutButton />}
            </div>
        </div>
    );
}
