import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
    content: string;
}

// Convert LaTeX bracket delimiters \( \) and \[ \] to dollar-sign
// delimiters that remark-math understands.
function normalizeMathDelimiters(text: string): string {
    return text
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `\n$$\n${expr.trim()}\n$$\n`)
        .replace(/\\\((.*?)\\\)/g, (_, expr) => `$${expr.trim()}$`);
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="text-sm markdown-content space-y-2">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ children }) => <div className="text-2xl font-bold mt-6 mb-3 text-primary leading-tight">{children}</div>,
                    h2: ({ children }) => <div className="text-xl font-bold mt-5 mb-2 text-primary/90 leading-tight">{children}</div>,
                    h3: ({ children }) => <div className="text-lg font-bold mt-4 mb-2 text-foreground leading-tight">{children}</div>,
                    p: ({ children }) => <p className="mb-2 leading-7 text-foreground/90">{children}</p>,
                    ul: ({ children }) => <ul className="my-3 pl-6 space-y-1 list-disc marker:text-primary">{children}</ul>,
                    ol: ({ children }) => <ol className="my-3 pl-6 space-y-1 list-decimal marker:text-primary">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                    code: ({ children, className }) =>
                        className ? (
                            <pre className="bg-muted rounded-md p-3 my-2 overflow-x-auto text-xs"><code>{children}</code></pre>
                        ) : (
                            <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">{children}</code>
                        ),
                    table: ({ children }) => <table className="my-3 w-full border-collapse text-sm">{children}</table>,
                    th: ({ children }) => <th className="border border-border px-2 py-1 bg-muted text-left font-semibold">{children}</th>,
                    td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                }}
            >
                {normalizeMathDelimiters(content)}
            </ReactMarkdown>
        </div>
    );
}
