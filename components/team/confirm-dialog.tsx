"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/app/(app)/team/actions";
import { dialogContentClass, dialogFooterClass } from "./dialog-styles";

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
    onDone,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    onConfirm: () => Promise<ActionResult>;
    onDone: (result: ActionResult) => void;
}) {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function confirm() {
        setError(null);
        startTransition(async () => {
            const result = await onConfirm();
            if (result.ok) {
                onOpenChange(false);
                onDone(result);
            } else {
                setError(result.error);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => (pending ? null : onOpenChange(o))}>
            <DialogContent className={dialogContentClass} showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {error && <p className="text-sm text-destructive-text">{error}</p>}
                <DialogFooter className={dialogFooterClass}>
                    <Button variant="outline" className="rounded-xs" onClick={() => onOpenChange(false)} disabled={pending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" className="rounded-xs" onClick={confirm} disabled={pending}>
                        {pending ? "Working…" : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
