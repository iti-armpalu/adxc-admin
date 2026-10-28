"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

// NavRail renders differently per breakpoint:
// Mobile (<md): horizontal top bar with logo + hamburger trigger
// Desktop (≥md): vertical brand strip on the left
//
// The hamburger button dispatches a custom event picked up by AppShell
// to open/close the mobile sidebar drawer.

export function NavRail({
    mobileMenuOpen,
    onMobileMenuToggle,
}: {
    mobileMenuOpen?: boolean;
    onMobileMenuToggle?: () => void;
}) {
    const homeHref = "/";

    return (
        <>
            {/* ── Desktop: vertical rail ──────────────────────────────────────── */}
            <div className="hidden md:flex flex-col items-center w-12 h-screen bg-brand-700 shrink-0 sticky top-0 z-50 py-3 gap-6">
                <Link href={homeHref} className="shrink-0">
                    <Image
                        src="/adxc-logo-white-stacked.svg"
                        alt="ADXC"
                        width={21}
                        height={24}
                        className="w-7 object-contain"
                        priority
                    />
                </Link>
                <div className="w-5 h-px bg-white/15 shrink-0" />
            </div>

            {/* ── Mobile: horizontal top bar ──────────────────────────────────── */}
            <div className="md:hidden flex items-center justify-between px-4 h-12 bg-brand-700 shrink-0 sticky top-0 z-50 w-full">
                <Link href={homeHref} className="shrink-0">
                    <Image
                        src="/adxc-logo-white-stacked.svg"
                        alt="ADXC"
                        width={21}
                        height={24}
                        className="w-7 object-contain"
                        priority
                    />
                </Link>
                <button
                    onClick={onMobileMenuToggle}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
        </>
    );
}