// Brand depth for dark plum panels: two soft glows drifting slowly (transform-only, so it
// stays off the main thread; stops for people who prefer reduced motion).
// Parent needs `relative isolate overflow-hidden`. (The background grid was removed
// on design feedback; a replacement pattern is still to be explored.)

export function BrandGlow() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-1/4 -left-1/4 size-[42rem] rounded-full bg-brand-500/35 blur-3xl will-change-transform animate-[adxc-drift_18s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
            <div className="absolute -right-1/4 -bottom-1/3 size-[36rem] rounded-full bg-brand-900/70 blur-3xl will-change-transform animate-[adxc-drift_22s_ease-in-out_infinite_alternate-reverse] motion-reduce:animate-none" />
        </div>
    );
}
