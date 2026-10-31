import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
}

/**
 * Safely renders a LaTeX string using KaTeX.
 * If KaTeX fails to parse, gracefully returns the raw LaTeX in a styled span.
 */
export function renderLatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: false,
    });
  } catch (err) {
    console.warn('[KaTeX Render Error]', err, latex);
    return `<span class="katex-error text-amber-400 font-mono text-xs">${latex}</span>`;
  }
}

/**
 * Parses a string containing LaTeX expressions and returns an array of React nodes.
 * Supports:
 * - $$...$$ and \[...\] for display equations
 * - $...$ and \(...\) for inline mathematical expressions
 */
export function parseMathAndText(input: string): React.ReactNode[] {
  if (!input) return [];

  const nodes: React.ReactNode[] = [];
  // Regex to match:
  // 1. $$...$$
  // 2. \[...\]
  // 3. $...$ (ensuring not followed or preceded by another $, and avoiding simple standalone currency like $50)
  // 4. \(...\)
  const mathRegex = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^\$\n]+?)\$|\\\(([^\n]+?)\\\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(input)) !== null) {
    const matchIndex = match.index;

    // Push preceding plain text
    if (matchIndex > lastIndex) {
      const textChunk = input.slice(lastIndex, matchIndex);
      nodes.push(renderFormattedInlineText(textChunk, `text-${lastIndex}`));
    }

    const displayMath = match[1] || match[2];
    const inlineMath = match[3] || match[4];

    if (displayMath) {
      const html = renderLatex(displayMath, true);
      nodes.push(
        <div
          key={`math-block-${matchIndex}`}
          className="my-3 overflow-x-auto py-1 text-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (inlineMath) {
      const html = renderLatex(inlineMath, false);
      nodes.push(
        <span
          key={`math-inline-${matchIndex}`}
          className="inline-math px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    lastIndex = mathRegex.lastIndex;
  }

  // Push remaining plain text
  if (lastIndex < input.length) {
    const trailingText = input.slice(lastIndex);
    nodes.push(renderFormattedInlineText(trailingText, `text-${lastIndex}`));
  }

  return nodes;
}

/**
 * Formats inline bold (**...**) and italic (*...*) text inside non-math segments.
 */
function renderFormattedInlineText(text: string, keyPrefix: string): React.ReactNode {
  // Simple bold and code formatting
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <React.Fragment key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={`${keyPrefix}-b-${idx}`} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={`${keyPrefix}-c-${idx}`}
              className="px-1.5 py-0.5 rounded-md bg-slate-800 text-blue-300 font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </React.Fragment>
  );
}

/**
 * Reusable component for rendering single-line or short text containing mathematical notation.
 * Ideal for questions, multiple-choice options, titles, and headers.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '', as = 'span' }) => {
  const renderedContent = useMemo(() => parseMathAndText(text), [text]);

  const Component = as;
  return <Component className={`math-content ${className}`}>{renderedContent}</Component>;
};

/**
 * Comprehensive formatted markdown and math renderer.
 * Ideal for tutor chats, evaluations, model solutions, and syllabus explanations.
 */
export const FormattedContent: React.FC<{ content: string; className?: string }> = ({
  content,
  className = '',
}) => {
  const blocks = useMemo(() => {
    if (!content) return [];
    return content.split(/\n\n+/);
  }, [content]);

  return (
    <div className={`space-y-3.5 leading-relaxed text-slate-200 ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // Horizontal rule
        if (trimmed === '***' || trimmed === '---' || trimmed === '___') {
          return <hr key={bIdx} className="border-slate-800 my-4" />;
        }

        // Heading 1 or 2
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
          const title = trimmed.replace(/^#+\s*/, '');
          return (
            <h3 key={bIdx} className="text-base sm:text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
              <MathText text={title} />
            </h3>
          );
        }

        // Heading 3 or 4
        if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
          const title = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={bIdx} className="text-sm sm:text-base font-semibold text-blue-300 mt-3 mb-1">
              <MathText text={title} />
            </h4>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^>\s*/, '');
          return (
            <div
              key={bIdx}
              className="p-3 my-2 rounded-xl bg-blue-950/40 border border-blue-800/50 text-slate-200 text-sm italic"
            >
              <MathText text={quoteText} />
            </div>
          );
        }

        // Bullet lists or steps
        const lines = trimmed.split('\n');
        const isList = lines.every(
          (l) => /^\s*[-*•]\s+/.test(l) || /^\s*\d+[\.\)]\s+/.test(l) || l.trim() === ''
        );

        if (isList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-2">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\s*(?:[-*•]|\d+[\.\)])\s+/, '').trim();
                if (!itemText) return null;
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-sm sm:text-base text-slate-300">
                    <span className="text-blue-400 font-bold shrink-0 mt-0.5">·</span>
                    <div className="flex-1">
                      <MathText text={itemText} />
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Step callout card
        if (trimmed.startsWith('**Step ') || trimmed.startsWith('**Rule ')) {
          return (
            <div key={bIdx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 my-2">
              <MathText text={trimmed} className="text-sm sm:text-base text-slate-200" />
            </div>
          );
        }

        // Regular paragraph with potential embedded math
        return (
          <p key={bIdx} className="text-sm sm:text-base text-slate-300">
            <MathText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
};
