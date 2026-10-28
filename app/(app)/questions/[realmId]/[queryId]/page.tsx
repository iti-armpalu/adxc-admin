// TODO: build Question detail — progress log, clarifications, supplier coverage, price,
// and (if bought) the answer, provenance and files. Read-only.

import Link from "next/link";

export default async function QuestionDetailPage({
    params,
}: {
    params: Promise<{ realmId: string; queryId: string }>;
}) {
    const { queryId } = await params;
    return (
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 md:px-8">
            <Link href="/questions" className="text-sm text-primary underline-offset-4 hover:underline">
                ← Questions
            </Link>
            <h1>Question</h1>
            <p className="font-mono text-xs text-muted-foreground">{queryId}</p>
        </div>
    );
}
