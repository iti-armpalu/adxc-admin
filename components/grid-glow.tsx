// Brand depth for dark plum panels. Parent needs `relative isolate overflow-hidden`.
//  - Two soft glows drifting slowly across the whole panel (transform-only, so it stays
//    off the main thread; stops for people who prefer reduced motion).
//  - The DS grid at 20%, faded diagonally (hidden top-left, showing bottom-right),
//    as on the investor site.

export function GridGlow() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-1/4 -left-1/4 size-[42rem] rounded-full bg-brand-500/35 blur-3xl will-change-transform animate-[adxc-drift_28s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
            <div className="absolute -right-1/4 -bottom-1/3 size-[36rem] rounded-full bg-brand-900/70 blur-3xl will-change-transform animate-[adxc-drift_34s_ease-in-out_infinite_alternate-reverse] motion-reduce:animate-none" />
            <div
                className="absolute inset-0 bg-grid opacity-20"
                style={{
                    maskImage: "linear-gradient(135deg, transparent 35%, black 65%)",
                    WebkitMaskImage: "linear-gradient(135deg, transparent 35%, black 65%)",
                }}
            />
        </div>
    );
}
