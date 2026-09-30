import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isMostlyDevanagari } from '../lib/lang';

/** The plain text inside rendered children, for deciding the block's language. */
const textOf = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return '';
};

/**
 * `lang="ne"` on a block that is mostly Nepali — see lib/lang.ts. Bilingual
 * posts alternate Nepali and English paragraphs, and Markdown cannot say
 * which is which.
 */
const lang = (children: React.ReactNode) => (isMostlyDevanagari(textOf(children)) ? 'ne' : undefined);

/**
 * Renders a post body written in Markdown.
 *
 * Uses react-markdown rather than setting innerHTML: post bodies are stored
 * text, and building React elements means a stray `<script>` in the content is
 * rendered as characters instead of executed.
 *
 * Headings map to real h2/h3 elements so posts carry a document outline that
 * search engines can read, which is the point of writing in Markdown here.
 */
const Markdown: React.FC<{ children: string; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`markdown ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children: c }) => (
          <h2 lang={lang(c)} className="display mb-5 mt-14 text-3xl md:text-4xl">{c}</h2>
        ),
        h2: ({ children: c }) => (
          <h2 lang={lang(c)} className="display mb-5 mt-14 text-3xl md:text-4xl">{c}</h2>
        ),
        h3: ({ children: c }) => (
          <h3 lang={lang(c)} className="mb-4 mt-10 text-xl font-medium md:text-2xl">{c}</h3>
        ),
        p: ({ children: c }) => (
          <p lang={lang(c)} className="mb-6 text-base font-light leading-[1.85] text-[var(--grey-1)] md:text-lg">
            {c}
          </p>
        ),
        ul: ({ children: c }) => <ul className="mb-6 list-disc space-y-2 pl-6">{c}</ul>,
        ol: ({ children: c }) => <ol className="mb-6 list-decimal space-y-2 pl-6">{c}</ol>,
        li: ({ children: c }) => (
          <li lang={lang(c)} className="text-base font-light leading-relaxed text-[var(--grey-1)] md:text-lg">
            {c}
          </li>
        ),
        blockquote: ({ children: c }) => (
          <blockquote className="mb-8 border-l-2 border-[var(--ink)] pl-6 text-lg font-light italic leading-relaxed md:text-xl">
            {c}
          </blockquote>
        ),
        a: ({ href, children: c }) => (
          <a
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="link-wipe font-medium text-[var(--ink)]"
          >
            {c}
          </a>
        ),
        img: ({ src, alt }) => (
          <img
            src={typeof src === 'string' ? src : undefined}
            alt={alt ?? ''}
            loading="lazy"
            className="mb-8 w-full rounded-2xl object-cover"
          />
        ),
        code: ({ children: c }) => (
          <code className="mono rounded bg-black/[0.05] px-1.5 py-0.5 text-[0.85em] normal-case tracking-normal">
            {c}
          </code>
        ),
        pre: ({ children: c }) => (
          <pre className="mb-8 overflow-x-auto rounded-2xl bg-[#0a0a0a] p-6 text-sm text-white">
            {c}
          </pre>
        ),
        hr: () => <hr className="my-12 border-[var(--hairline)]" />,
        table: ({ children: c }) => (
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left text-sm">{c}</table>
          </div>
        ),
        th: ({ children: c }) => (
          <th className="mono border-b border-[var(--hairline)] pb-2 text-[var(--grey-1)]">{c}</th>
        ),
        td: ({ children: c }) => (
          <td className="border-b border-[var(--hairline)] py-3 font-light">{c}</td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default Markdown;
