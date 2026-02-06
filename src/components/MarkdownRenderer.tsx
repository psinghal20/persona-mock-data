"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="obsidian-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        children={content}
        components={{
          a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
            if (href && href.startsWith("/")) {
              return (
                <Link href={href} className="obsidian-link" {...props}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} className="obsidian-link" target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
            <div className="obsidian-table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
          input: ({ ...props }: ComponentPropsWithoutRef<"input">) => (
            <input {...props} disabled />
          ),
          pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => (
            <pre className="obsidian-code-block" {...props}>{children}</pre>
          ),
          code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
            // If inside a pre (has className with language-), render as block
            if (className) {
              return <code className={className} {...props}>{children}</code>;
            }
            return <code className="obsidian-inline-code" {...props}>{children}</code>;
          },
        }}
      />
    </div>
  );
}
