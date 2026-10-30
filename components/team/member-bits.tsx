// Small presentational pieces shared by the members list and member detail.

import type { OrgMember } from "@/lib/adxc/types";
import { cn } from "@/lib/utils";

export const roleLabel = (r: OrgMember["role"]) => (r === "org_admin" ? "Admin" : "Member");

// TODO: wire up names — ask Rob to add `name` to the members list; until then, email only.
export function Avatar({ email, size = "md" }: { email: string; size?: "md" | "lg" }) {
    return (
        <span
            aria-hidden
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 uppercase",
                size === "lg" ? "size-12 text-base" : "size-8 text-xs",
            )}
        >
            {email.charAt(0)}
        </span>
    );
}

export function Tag({ children, tone }: { children: React.ReactNode; tone: "primary" | "neutral" }) {
    return (
        <span
            className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-xs border bg-card px-1.5 text-xs font-medium whitespace-nowrap",
                tone === "primary" ? "border-primary/30 text-primary" : "border-border text-muted-foreground",
            )}
        >
            {children}
        </span>
    );
}

export const RoleTag = ({ role }: { role: OrgMember["role"] }) => (
    <Tag tone={role === "org_admin" ? "primary" : "neutral"}>{roleLabel(role)}</Tag>
);

