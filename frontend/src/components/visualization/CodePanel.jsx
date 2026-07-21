import { useState, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FaCode, FaCopy, FaCheck } from 'react-icons/fa'

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

  const effectiveLang = languages.find((l) => l.id === lang) ? lang : initial
  const source = code[effectiveLang] || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {

    }
  }

  const highlighterLang = effectiveLang === 'pseudocode' ? 'plaintext' : effectiveLang

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
      {}
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

      {}
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

        {}
        {effectiveLang === 'pseudocode' && (
          <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded">
            <FaCode className="inline mr-1" /> pseudocode
          </div>
        )}
      </div>

      {}
      {!source && (
        <div className="p-4 text-gray-500 text-sm">No source for {effectiveLang}.</div>
      )}
    </div>
  )
}

export default CodePanel
