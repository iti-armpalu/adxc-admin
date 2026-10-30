// Placeholders shown instantly while a page's data loads on the server (via loading.tsx).
// Shapes mirror the real pages so nothing jumps when content arrives.

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const Bar = ({ className }: { className?: string }) => <Skeleton className={cn("rounded-none", className)} />;

function Header() {
    return (
        <div className="space-y-2">
            <Bar className="h-9 w-48" />
            <Bar className="h-4 w-72 max-w-full" />
        </div>
    );
}

function Rows({ count = 5 }: { count?: number }) {
    return (
        <div className="divide-y border bg-card">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="space-y-2 px-4 py-3">
                    <Bar className="h-4 w-3/4" />
                    <Bar className="h-3 w-1/3" />
                </div>
            ))}
        </div>
    );
}

function Wrap({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
    return (
        <div
            className={cn("mx-auto space-y-10 px-4 py-8 md:px-8", wide ? "max-w-6xl" : "max-w-5xl")}
            role="status"
            aria-label="Loading"
        >
            {children}
        </div>
    );
}

/** Overview and other card + list pages. */
export function PageSkeleton() {
    return (
        <Wrap>
            <Header />
            <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="space-y-3 border bg-card p-5">
                        <Bar className="h-3 w-24" />
                        <Bar className="h-8 w-20" />
                    </div>
                ))}
            </div>
            <div className="space-y-3">
                <Bar className="h-6 w-40" />
                <Rows />
            </div>
        </Wrap>
    );
}

/** Questions list: search, filters, table. */
export function QuestionsSkeleton() {
    return (
        <Wrap wide>
            <Header />
            <div className="space-y-3">
                <Bar className="h-9 w-full" />
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Bar className="h-9 w-full sm:w-56" />
                    <Bar className="h-9 w-full sm:w-56" />
                    <Bar className="h-9 w-full sm:w-56" />
                </div>
            </div>
            <Rows count={8} />
        </Wrap>
    );
}

/** Question detail: main column + facts column. */
export function QuestionDetailSkeleton() {
    return (
        <Wrap wide>
            <Bar className="h-4 w-24" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                <div className="space-y-10">
                    <div className="space-y-3">
                        <Bar className="h-6 w-28" />
                        <div className="space-y-2 border bg-card p-6">
                            <Bar className="h-4 w-full" />
                            <Bar className="h-4 w-2/3" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Bar className="h-6 w-24" />
                        <div className="space-y-2 border bg-card p-6">
                            <Bar className="h-4 w-full" />
                            <Bar className="h-4 w-full" />
                            <Bar className="h-4 w-5/6" />
                            <Bar className="h-4 w-1/2" />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Bar className="h-3 w-16" />
                    <div className="divide-y border bg-card">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="flex justify-between px-4 py-3">
                                <Bar className="h-4 w-16" />
                                <Bar className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Wrap>
    );
}
