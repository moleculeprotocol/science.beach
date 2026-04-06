"use client";

import ReactMarkdown from "react-markdown";

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="h6 text-dark-space mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="h7 text-dark-space mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="h8 text-dark-space mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="paragraph-m text-smoke-5 mb-2">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-dark-space">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-4 hover:text-dark-space transition-colors underline">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 paragraph-m text-smoke-5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 paragraph-m text-smoke-5">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-dawn-3 pl-3 my-2 text-smoke-5 italic">{children}</blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return <pre className="mono-s text-smoke-5 bg-dawn-2 border border-dawn-3 p-3 my-2 overflow-x-auto text-xs">{children}</pre>;
          }
          return <code className="mono-s text-smoke-5 bg-dawn-2 px-1 py-0.5 text-xs">{children}</code>;
        },
        hr: () => <hr className="border-dawn-3 my-3" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
