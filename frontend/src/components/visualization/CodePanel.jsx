import { useState, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FaCode, FaCopy, FaCheck } from 'react-icons/fa'

/**
 * Multi-language code panel with line-level highlight sync.
 *
 * Props:
 *   - code: { javascript, python, java, cpp, pseudocode }
 *   - currentLine: 1-indexed line number to highlight (driven by step)
 *   - language: which language to display
 *
 * The highlight is implemented by splitting the source on \n and
 * mapping each line to a span whose background changes when its
 * 1-based index matches currentLine. This is more reliable than
 * `highlight-line` props in the highlighter library and survives
 * re-renders without flicker.
 */
function CodePanel({ code = {}, currentLine, language, onLanguageChange }) {
  const languages = useMemo(() => {
    const ls = [
      { id: 'javascript', label: 'JavaScript' },
      { id: 'python', label: 'Python' },
      { id: 'java', label: 'Java' },
      { id: 'cpp', label: 'C++' },
      { id: 'pseudocode', label: 'Pseudocode' },
    ].filter((l) => code[l.id])
    return ls
  }, [code])

  const initial = languages[0]?.id || 'javascript'
  const [lang, setLang] = useState(language || initial)
  const [copied, setCopied] = useState(false)

  // If the parent doesn't control language, keep it in sync with available tabs
  const effectiveLang = languages.find((l) => l.id === lang) ? lang : initial
  const source = code[effectiveLang] || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  // Map pseudocode to a generic language for the highlighter
  const highlighterLang = effectiveLang === 'pseudocode' ? 'plaintext' : effectiveLang

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/40">
        <div className="flex items-center px-2 py-1.5 gap-1 overflow-x-auto">
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLang(l.id)
                onLanguageChange?.(l.id)
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                effectiveLang === l.id
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/60'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="mr-2 p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors"
          title="Copy code"
        >
          {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
        </button>
      </div>

      {/* Code body — line-by-line so we can highlight the active line */}
      <div className="relative text-sm">
        <SyntaxHighlighter
          language={highlighterLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            background: 'transparent',
            padding: '12px 0',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
          wrapLines
          lineProps={(lineNumber) => {
            const isActive = lineNumber === currentLine
            return {
              style: {
                display: 'block',
                background: isActive ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #fb923c' : '3px solid transparent',
                paddingLeft: '12px',
                transition: 'background 120ms ease',
              },
            }
          }}
        >
          {source}
        </SyntaxHighlighter>

        {/* No-highlighter fallback label */}
        {effectiveLang === 'pseudocode' && (
          <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded">
            <FaCode className="inline mr-1" /> pseudocode
          </div>
        )}
      </div>

      {/* Empty state if no code for this language */}
      {!source && (
        <div className="p-4 text-gray-500 text-sm">No source for {effectiveLang}.</div>
      )}
    </div>
  )
}

export default CodePanel
