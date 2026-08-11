import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose-sm max-w-none leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="font-display text-base font-semibold mt-4 mb-1.5 text-teal-deep dark:text-ink-dark">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-semibold text-sm mt-3 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2 text-sm">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 text-sm">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-sm">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (!isBlock) {
              return (
                <code
                  className="font-mono-data text-[0.85em] bg-paper-dim dark:bg-paper-dim-dark px-1 py-0.5 rounded"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{String(children)}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children.replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-line dark:border-line-dark my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-paper-dim dark:bg-paper-dim-dark text-[11px] text-ink-soft dark:text-ink-soft-dark">
        <span className="font-mono-data">{language}</span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 hover:text-teal transition-colors",
            copied && "text-teal"
          )}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="font-mono-data text-[0.8em] p-3 overflow-x-auto bg-white dark:bg-paper-dark">
        <code>{children}</code>
      </pre>
    </div>
  );
}
