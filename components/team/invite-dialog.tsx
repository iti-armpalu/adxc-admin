"use client";

// "Invite member" button + dialog. The API takes an email and a role only.

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { inviteMember, type InviteState } from "@/app/(app)/team/actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dialogContentClass, dialogFooterClass } from "./dialog-styles";

const INITIAL: InviteState = { error: null, invited: null };

export function InviteDialog({ onInvited }: { onInvited: (message: string) => void }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");

    const [state, action, pending] = useActionState(async (prev: InviteState, formData: FormData) => {
        const result = await inviteMember(prev, formData);
        if (result.invited) {
            setOpen(false);
            setEmail("");
            setRole("member");
            onInvited(`Invite sent to ${result.invited}.`);
            return INITIAL;
        }
        return result;
    }, INITIAL);

    return (
        <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
            <DialogTrigger asChild>
                <Button className="h-9 rounded-xs">
                    <UserPlus className="size-4" />
                    Invite member
                </Button>
            </DialogTrigger>
            <DialogContent className={dialogContentClass}>
                <form action={action} className="grid gap-5">
                    <DialogHeader>
                        <DialogTitle>Invite member</DialogTitle>
                        <DialogDescription>They&apos;ll get an email with a link to sign in.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="invite-email">Email address</Label>
                        <Input
                            id="invite-email"
                            name="email"
                            type="email"
                            placeholder="name@company.com"
                            autoComplete="off"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={Boolean(state.error)}
                            className="h-9 rounded-xs bg-card"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invite-role">Role</Label>
                        <Select name="role" value={role} onValueChange={setRole}>
                            <SelectTrigger id="invite-role" className="h-9 w-full rounded-xs bg-card text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none bg-card text-card-foreground" position="popper">
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="org_admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {role === "org_admin"
                                ? "Admins can also invite people, change roles and manage API keys."
                                : "Members can see questions and bought answers on the account."}
                        </p>
                    </div>

                    {state.error && <p className="text-sm text-destructive-text">{state.error}</p>}

                    <DialogFooter className={dialogFooterClass}>
                        <Button type="button" variant="outline" className="rounded-xs" onClick={() => setOpen(false)} disabled={pending}>
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-xs" disabled={pending || !email.trim()}>
                            {pending ? "Inviting…" : "Invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
