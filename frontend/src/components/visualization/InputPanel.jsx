import { useState } from 'react'
import { FaPlay, FaRandom } from 'react-icons/fa'

function InputPanel({ presets, defaultPreset, onRun, initialInput, customHint, targetKey = 'arr' }) {
  const presetNames = Object.keys(presets || {})
  const [activePreset, setActivePreset] = useState(defaultPreset || presetNames[0])
  const [error, setError] = useState('')

  const currentPreset = presets?.[activePreset]
  const initialInputStr = stringifyInput(initialInput || currentPreset?.input, currentPreset?.target, currentPreset?.k, currentPreset?.value)
  const [text, setText] = useState(initialInputStr)

  const handleSelectPreset = (name) => {
    setActivePreset(name)
    setError('')
    const p = presets[name]
    if (!p) return
    setText(stringifyInput(p.input, p.target, p.k, p.value))
    onRun?.(normalize(p.input, p.target, p.k, p.value))
  }

  const handleRun = () => {
    setError('')
    try {
      const parsed = parseInput(text, targetKey)
      onRun?.(parsed)
    } catch (e) {
      setError(e.message || 'Invalid input')
    }
  }

  const handleRandomize = () => {
    const size = 5 + Math.floor(Math.random() * 4)
    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1)
    const newText = `arr=[${arr.join(', ')}]`
    setText(newText)
    try {
      onRun?.(normalize(arr))
    } catch {

    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          Input
        </h3>
        <button
          onClick={handleRandomize}
          className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1.5"
          title="Generate random input"
        >
          <FaRandom /> Random
        </button>
      </div>

      {}
      {presetNames.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {presetNames.map((name) => (
            <button
              key={name}
              onClick={() => handleSelectPreset(name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activePreset === name
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
              }`}
            >
              {presets[name].label || name}
            </button>
          ))}
        </div>
      )}

      {}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-500 block">
          Custom input {customHint && <span className="text-gray-600">— {customHint}</span>}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder={customHint || 'arr=[5,3,8,1,9,2]'}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg text-sm flex items-center gap-1.5"
          >
            <FaPlay className="text-xs" /> Run
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

function stringifyInput(input, _target, _k, _value) {
  if (Array.isArray(input)) return `arr=[${input.join(', ')}]`
  if (typeof input === 'string') return `s="${input}"`
  if (typeof input === 'number') return `n=${input}`
  if (input && typeof input === 'object') {
    if (input.amount !== undefined) {
      return `amount=${input.amount}, coins=[${(input.coins || []).join(', ')}]`
    }
    if (input.tree) {
      return `tree=[${input.tree.join(', ')}], value=${input.value ?? 1}`
    }
    if (input.source) {
      return `source=${input.source}, graph={"A":[["B",1]]}`
    }
    return JSON.stringify(input)
  }
  return ''
}

function parseInput(text, targetKey = 'arr') {
  const tokens = text.split(/,(?![^[]*\])/)
  const out = {}
  for (const raw of tokens) {
    const t = raw.trim()
    if (!t) continue
    const eq = t.indexOf('=')
    if (eq === -1) throw new Error(`Expected key=value, got "${t}"`)
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim()
      out[key] = inner === '' ? [] : inner.split(',').map((x) => coerce(x.trim()))
    } else if (val.startsWith('"') && val.endsWith('"')) {
      out[key] = val.slice(1, -1)
    } else if (val.startsWith('{') && val.endsWith('}')) {
      try {
        out[key] = JSON.parse(val)
      } catch {
        throw new Error(`Invalid JSON in "${key}"`)
      }
    } else {
      out[key] = coerce(val)
    }
  }
  return normalize(out[targetKey] ?? out.arr ?? Object.values(out)[0], out.target, out.k, out.value, out)
}

function coerce(s) {
  if (s === 'true') return true
  if (s === 'false') return false
  if (s === 'null') return null
  if (s === '') return null
  const n = Number(s)
  return Number.isNaN(n) ? s : n
}

function normalize(input, target, k, value, fullObj) {
  if (Array.isArray(input)) {
    if (target !== undefined) return { array: input, target: Number(target) }
    if (k !== undefined) return { array: input, k: Number(k) }
    if (value !== undefined) return { tree: input, value: Number(value) }
    return input
  }
  if (typeof input === 'string') return input
  if (typeof input === 'number') return input
  if (fullObj && fullObj.amount !== undefined) {
    return { amount: Number(fullObj.amount), coins: fullObj.coins }
  }
  return input
}

export default InputPanel
