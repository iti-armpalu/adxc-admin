// TODO: build Team — members, invites, not-admitted, API keys.
// Mock data until Stytch: these routes are org_admin only and answer 403 to an API key.
export default function TeamPage() {
    return (
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 md:px-8">
            <h1>Team</h1>
            <p className="text-sm text-muted-foreground">Who can use ADXC on your account, and the keys your tools use.</p>
        </div>
    );
}
