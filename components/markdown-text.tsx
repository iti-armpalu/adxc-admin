// Small, safe markdown renderer for answers: paragraphs, line breaks, bullet and numbered
// lists, headings, **bold**, *italic* and `code`. No raw HTML is ever rendered.
// If answers start carrying tables, swap in react-markdown + remark-gfm.

import { Fragment, type ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

function inline(text: string): ReactNode[] {
    return text.split(INLINE).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
            return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
            return <code key={i} className="bg-muted px-1 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
        return <Fragment key={i}>{part}</Fragment>;
    });
}

function withBreaks(lines: string[]) {
    return lines.map((line, i) => (
        <Fragment key={i}>
            {i > 0 && <br />}
            {inline(line)}
        </Fragment>
    ));
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^\s*#{1,6}\s+/;

export function MarkdownText({ text }: { text: string }) {
    const blocks = text.trim().split(/\n\s*\n/);
    return (
        <div className="space-y-4 leading-relaxed">
            {blocks.map((block, i) => {
                const lines = block.split("\n").filter((l) => l.trim() !== "");
                if (lines.every((l) => BULLET.test(l)))
                    return (
                        <ul key={i} className="list-disc space-y-1 pl-5">
                            {lines.map((l, j) => <li key={j}>{inline(l.replace(BULLET, ""))}</li>)}
                        </ul>
                    );
                if (lines.every((l) => NUMBERED.test(l)))
                    return (
                        <ol key={i} className="list-decimal space-y-1 pl-5">
                            {lines.map((l, j) => <li key={j}>{inline(l.replace(NUMBERED, ""))}</li>)}
                        </ol>
                    );
                if (lines.length === 1 && HEADING.test(lines[0]))
                    return <p key={i} className="font-semibold text-foreground">{inline(lines[0].replace(HEADING, ""))}</p>;
                return <p key={i}>{withBreaks(lines)}</p>;
            })}
        </div>
    );
}
