import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { FaCode, FaPlay, FaCopy, FaTrash, FaDownload, FaServer } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { playgroundService } from '../services/playgroundService'
import { useReducedMotion } from '../hooks/useReducedMotion'

// Lazy-load syntax highlighter so the playground chunk doesn't block
// the initial route.
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter').then((m) => ({ default: m.Prism })))

const STARTER_SNIPPETS = {
  python: `# Two Sum — find two numbers that add to target
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
`,
  javascript: `// Two Sum
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // [ 0, 1 ]
`,
  java: `import java.util.*;
class Main {
  public static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int c = target - nums[i];
      if (seen.containsKey(c)) return new int[]{seen.get(c), i};
      seen.put(nums[i], i);
    }
    return new int[0];
  }
  public static void main(String[] args) {
    System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9)));
  }
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
int main() {
  vector<int> nums = {2, 7, 11, 15};
  int target = 9;
  unordered_map<int, int> seen;
  for (int i = 0; i < (int)nums.size(); i++) {
    int c = target - nums[i];
    if (seen.count(c)) { cout << "[" << seen[c] << "," << i << "]\n"; return 0; }
    seen[nums[i]] = i;
  }
  return 0;
}
`,
}

const LANGUAGES = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '⚡' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚙️' },
]

function PlaygroundPage() {
  const reduceMotion = useReducedMotion()
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(STARTER_SNIPPETS.python)
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [runtimeInfo, setRuntimeInfo] = useState(null)

  useEffect(() => {
    playgroundService.runtimes().then((d) => setRuntimeInfo(d)).catch(() => {})
  }, [])

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(STARTER_SNIPPETS[lang])
    setOutput('')
  }

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Nothing to run')
      return
    }
    setIsRunning(true)
    setOutput('⏳ Submitting to sandbox…\n')
    try {
      const data = await playgroundService.execute({ language, code, stdin })
      const result = data.data || data
      const lines = []
      if (result.stdout) lines.push(result.stdout)
      if (result.stderr) lines.push(`[stderr]\n${result.stderr}`)
      if (result.compile_output) lines.push(`[compile]\n${result.compile_output}`)
      if (result.message) lines.push(`[info] ${result.message}`)
      const exit = result.exitCode ?? result.code ?? 0
      lines.push(`\n— exit ${exit}${result.mocked ? ' (mock — sandbox unavailable)' : ''} —`)
      setOutput(lines.join('\n'))
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Execution failed'
      setOutput(`❌ ${msg}`)
      toast.error(msg)
    } finally {
      setIsRunning(false)
    }
  }

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); toast.success('Copied') }
    catch { toast.error('Copy failed') }
  }
  const handleDownload = () => {
    const ext = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp' }[language]
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `solution.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }
  const handleClear = () => { setCode(''); setOutput('') }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaCode className="text-orange-400" aria-hidden="true" />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Code Playground
          </span>
        </h1>
        <p className="text-gray-400">
          Write, run, and experiment with code in your favourite language.
        </p>
      </motion.div>

      <div className="bg-gray-900 rounded-t-2xl border border-gray-800 border-b-0 p-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="tablist" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={language === l.id}
              onClick={() => handleLanguageChange(l.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                language === l.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-1" aria-hidden="true">{l.icon}</span>{l.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={handleCopy} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-1.5" aria-label="Copy code">
          <FaCopy aria-hidden="true" /> Copy
        </button>
        <button onClick={handleDownload} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-1.5" aria-label="Download file">
          <FaDownload aria-hidden="true" /> Save
        </button>
        <button onClick={handleClear} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-1.5" aria-label="Clear">
          <FaTrash aria-hidden="true" /> Clear
        </button>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 rounded-lg text-sm font-semibold flex items-center gap-1.5"
        >
          <FaPlay aria-hidden="true" /> {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-800 border-t-0">
        <div className="bg-[#1e1e1e] rounded-bl-2xl lg:rounded-bl-2xl lg:rounded-br-none">
          <label htmlFor="playground-code" className="sr-only">Code editor</label>
          <textarea
            id="playground-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-[440px] p-4 bg-transparent text-gray-100 font-mono text-sm focus:outline-none resize-none"
            placeholder="// Start typing your code..."
          />
        </div>
        <div className="bg-[#0d1117] rounded-b-2xl lg:rounded-bl-none lg:rounded-br-2xl border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400 font-bold">
            Output
          </div>
          <pre className="p-4 text-sm font-mono text-gray-200 whitespace-pre-wrap flex-1 min-h-[400px]" aria-live="polite">
            {output || <span className="text-gray-600">{'// Click Run to execute your code'}</span>}
          </pre>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3">
          <label htmlFor="playground-stdin" className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-2">
            Stdin (optional)
          </label>
          <textarea
            id="playground-stdin"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={3}
            placeholder="Input for your program…"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 flex items-center gap-1.5">
            <FaServer aria-hidden="true" /> Runtime
          </div>
          <div className="text-sm text-gray-300">
            {runtimeInfo?.available ? (
              <ul className="list-disc pl-5 space-y-0.5">
                {runtimeInfo.runtimes?.slice(0, 6).map((r) => (
                  <li key={r.language}>{r.language} {r.version ? `(${r.version})` : ''}</li>
                ))}
              </ul>
            ) : runtimeInfo?.mocked ? (
              <p>Sandbox unavailable — results will be mocked.</p>
            ) : (
              <p className="text-gray-500">Runtime info unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaygroundPage
