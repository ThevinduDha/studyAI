import React, { useState } from 'react';
import { Copy, Check, RotateCw, Terminal, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * FormattedAIResponse
 *
 * Renders AI answers with production-grade academic typography:
 * - Structured headings (#, ##, ###)
 * - Fenced code blocks with language badge and one-click copy
 * - Bulleted and numbered lists with styled markers
 * - Inline code, bold, and italic highlights
 * - Action toolbar for copying full answers and retrying queries
 */
export function FormattedAIResponse({
  content = '',
  onRetry = null,
  isError = false,
  className = ''
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const handleCopyAll = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopyCode = async (codeText, id) => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Helper to parse inline styles (bold, code, italic)
  const renderInline = (text, keyPrefix = '') => {
    if (!text) return null;

    // Tokenize by code `...`, bold **...**, italic *...*
    const tokens = [];
    let remaining = text;
    let index = 0;

    while (remaining.length > 0) {
      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(
          <code
            key={`${keyPrefix}-code-${index++}`}
            className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[0.85em] border border-indigo-500/20"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold: **bold**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        tokens.push(
          <strong key={`${keyPrefix}-bold-${index++}`} className="font-semibold text-heading">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *italic* or _italic_
      const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
      if (italicMatch) {
        tokens.push(
          <em key={`${keyPrefix}-em-${index++}`} className="italic text-secondary">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Plain text slice up to next token
      const nextSpecial = remaining.search(/[`*_]/);
      if (nextSpecial === -1) {
        tokens.push(<span key={`${keyPrefix}-txt-${index++}`}>{remaining}</span>);
        break;
      } else if (nextSpecial === 0) {
        // Special character not part of a valid token
        tokens.push(<span key={`${keyPrefix}-txt-${index++}`}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      } else {
        tokens.push(
          <span key={`${keyPrefix}-txt-${index++}`}>
            {remaining.slice(0, nextSpecial)}
          </span>
        );
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  // Parse structured blocks (code blocks, headings, lists, paragraphs)
  const parseBlocks = (rawText) => {
    if (!rawText) return [];

    const blocks = [];
    const lines = rawText.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Fenced Code Block: ```lang
      if (line.trim().startsWith('```')) {
        const lang = line.trim().replace(/^```/, '').trim() || 'code';
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        blocks.push({
          type: 'code',
          lang,
          content: codeLines.join('\n')
        });
        continue;
      }

      // 2. Headings
      if (line.startsWith('### ')) {
        blocks.push({ type: 'h3', text: line.replace('### ', '').trim() });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push({ type: 'h2', text: line.replace('## ', '').trim() });
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push({ type: 'h1', text: line.replace('# ', '').trim() });
        i++;
        continue;
      }

      // 3. Unordered list item: - or *
      if (/^\s*[-*]\s+/.test(line)) {
        const listItems = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
          i++;
        }
        blocks.push({ type: 'ul', items: listItems });
        continue;
      }

      // 4. Ordered list item: 1. 2. etc
      if (/^\s*\d+\.\s+/.test(line)) {
        const listItems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
          i++;
        }
        blocks.push({ type: 'ol', items: listItems });
        continue;
      }

      // 5. Blank line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // 6. Regular Paragraph
      const pLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].startsWith('#') &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i])
      ) {
        pLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'p', text: pLines.join(' ') });
    }

    return blocks;
  };

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3.5 text-body text-sm sm:text-base leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h2
              key={idx}
              className="text-base sm:text-lg font-bold text-heading mt-4 mb-2 pb-1 border-b border-subtle/50"
            >
              {renderInline(block.text, `h1-${idx}`)}
            </h2>
          );
        }

        if (block.type === 'h2') {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-bold text-heading mt-3 mb-1.5"
            >
              {renderInline(block.text, `h2-${idx}`)}
            </h3>
          );
        }

        if (block.type === 'h3') {
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-semibold text-secondary mt-2.5 mb-1"
            >
              {renderInline(block.text, `h3-${idx}`)}
            </h4>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={idx} className="space-y-1.5 pl-2 my-2">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="text-indigo-400 font-bold mt-0.5 select-none shrink-0">•</span>
                  <span className="leading-relaxed">{renderInline(item, `ul-${idx}-${itemIdx}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className="space-y-1.5 pl-2 my-2">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="text-indigo-400 font-semibold text-xs mt-0.5 select-none shrink-0 min-w-[1.2rem]">
                    {itemIdx + 1}.
                  </span>
                  <span className="leading-relaxed">{renderInline(item, `ol-${idx}-${itemIdx}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          const isCopied = copiedCodeId === idx;
          return (
            <div
              key={idx}
              className="my-3 rounded-xl border border-subtle bg-canvas/80 overflow-hidden shadow-xs"
            >
              {/* Code Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-surface/50 border-b border-subtle text-[11px] text-muted select-none">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-mono text-secondary uppercase font-semibold text-[10px]">
                    {block.lang}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(block.content, idx)}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-heading transition"
                  title="Copy code to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Content */}
              <pre className="p-3.5 text-xs sm:text-sm font-mono text-heading overflow-x-auto leading-relaxed">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm text-body leading-relaxed">
            {renderInline(block.text, `p-${idx}`)}
          </p>
        );
      })}

      {/* Action Footer Bar */}
      {!isError && content && (
        <div className="pt-2 flex items-center justify-between text-xs text-muted border-t border-subtle/50 mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface text-[11px] text-muted hover:text-heading transition cursor-pointer"
              title="Copy entire answer"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied answer ✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy answer</span>
                </>
              )}
            </button>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface text-[11px] text-muted hover:text-heading transition cursor-pointer"
                title="Retry question"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>

          <span className="text-[10px] text-muted">
            Strictly grounded in lecture notes
          </span>
        </div>
      )}
    </div>
  );
}

export default FormattedAIResponse;
