// config/nav.ts — the panel's tabs. Team is for org admins only.

export type NavItem = { label: string; href: string; adminOnly?: boolean };

export const NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/" },
    { label: "Questions", href: "/questions" },
    { label: "Projects", href: "/projects" },
    { label: "Team", href: "/team", adminOnly: true },
];
