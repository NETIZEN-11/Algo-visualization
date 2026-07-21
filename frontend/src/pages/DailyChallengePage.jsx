import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FaFire,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaTrophy,
  FaStar,
  FaCode,
  FaLightbulb,
  FaBolt,
  FaChartLine,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import { dailyChallengeService } from '../services/dailyChallengeService'
function DailyChallengePage() {
  const [challenge, setChallenge] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [timeTaken, setTimeTaken] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [userCode, setUserCode] = useState('')
  const [streak, setStreak] = useState(0)
  const [challengeHistory, setChallengeHistory] = useState([])

  useEffect(() => {
    loadDailyChallenge()
    loadChallengeHistory()
  }, [])

  useEffect(() => {
    let timer
    if (startTime && !hasCompleted) {
      timer = setInterval(() => {
        setTimeTaken(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [startTime, hasCompleted])

  const loadDailyChallenge = async () => {
    setIsLoading(true)
    try {

      const response = await dailyChallengeService.today()
      setChallenge(response.data || response)
      setHasCompleted(response.data?.userCompleted || response.userCompleted || false)

      dailyChallengeService.streak()
        .then((d) => setStreak(d.data?.streak || d.streak || 0))
        .catch(() => {})
    } catch (error) {

      setChallenge({
        _id: 'daily-1',
        title: 'Two Sum',
        description:
          'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'Easy',
        xpReward: 50,
        bonusXp: 25,
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]',
          },
        ],
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^4',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.',
        ],
        totalCompleted: 1523,
        tags: ['Array', 'Hash Table'],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadChallengeHistory = () => {

    setChallengeHistory([
      { date: 'Dec 30', completed: true, problem: 'Valid Parentheses', time: '12:34' },
      { date: 'Dec 29', completed: true, problem: 'Merge Two Sorted Lists', time: '18:22' },
      { date: 'Dec 28', completed: true, problem: 'Remove Duplicates', time: '08:45' },
      { date: 'Dec 27', completed: true, problem: 'Plus One', time: '15:11' },
      { date: 'Dec 26', completed: true, problem: 'Climbing Stairs', time: '22:05' },
      { date: 'Dec 25', completed: false, problem: 'Binary Tree Inorder', time: null },
      { date: 'Dec 24', completed: true, problem: 'Maximum Subarray', time: '11:38' },
    ])
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startChallenge = () => {
    setStartTime(Date.now())
    toast.success('Challenge started! Good luck! 🚀')
  }

  const submitChallenge = async () => {
    if (!userCode.trim()) {
      toast.error('Please write some code before submitting!')
      return
    }

    const finalTimeTaken = Math.floor((Date.now() - startTime) / 1000)
    const earnedBonus = finalTimeTaken < 1800

    try {

      await dailyChallengeService.complete({
        challengeId: challenge._id,
        timeTaken: finalTimeTaken,
      })

      const sr = await dailyChallengeService.streak().catch(() => null)
      if (sr) setStreak(sr.data?.streak || sr.streak || 0)

      setHasCompleted(true)
      const xpEarned = challenge.xpReward + (earnedBonus ? challenge.bonusXp : 0)

      toast.success(
        `Challenge completed! +${xpEarned} XP${earnedBonus ? ' (with bonus!)' : ''}`,
        { duration: 5000 }
      )
    } catch (error) {

      setHasCompleted(true)
      const xpEarned = challenge.xpReward + (earnedBonus ? challenge.bonusXp : 0)

      toast.success(
        `Challenge completed! +${xpEarned} XP${earnedBonus ? ' (with bonus!)' : ''}`,
        { duration: 5000 }
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading today's challenge...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-8">
      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Daily Challenge
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Complete today's challenge to keep your streak alive! 🔥
            </p>
          </div>

          {}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-center min-w-[150px]"
          >
            <FaFire className="text-4xl mx-auto mb-2" />
            <div className="text-3xl font-bold">{streak} days</div>
            <div className="text-sm text-white/80">Current Streak</div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-8 border border-gray-800"
          >
            {}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <FaCalendar className="text-2xl text-orange-400" />
                  <h2 className="text-2xl font-bold">{challenge.title}</h2>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      challenge.difficulty === 'Easy'
                        ? 'bg-green-500/20 text-green-400'
                        : challenge.difficulty === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {challenge.difficulty}
                  </span>

                  {challenge.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <span>+{challenge.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaBolt className="text-purple-400" />
                    <span>+{challenge.bonusXp} Bonus XP (under 30 min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400" />
                    <span>{challenge.totalCompleted.toLocaleString()} completed</span>
                  </div>
                </div>
              </div>

              {hasCompleted && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <FaCheckCircle className="text-3xl text-green-400 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-green-400">Completed!</div>
                  <div className="text-xs text-gray-400 mt-1">Time: {formatTime(timeTaken)}</div>
                </div>
              )}
            </div>

            {}
            {startTime && !hasCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FaClock className="text-2xl text-blue-400" />
                  <span className="text-sm text-gray-400">Time Elapsed:</span>
                </div>
                <div className="text-3xl font-bold font-mono text-blue-400">
                  {formatTime(timeTaken)}
                </div>
              </motion.div>
            )}

            {}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{challenge.description}</p>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold mb-2">Examples</h3>
                {challenge.examples?.map((example, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-4 mb-3">
                    <div className="font-semibold text-sm text-gray-400 mb-2">
                      Example {index + 1}:
                    </div>
                    <div className="space-y-1 font-mono text-sm">
                      <div>
                        <span className="text-blue-400">Input:</span> {example.input}
                      </div>
                      <div>
                        <span className="text-green-400">Output:</span> {example.output}
                      </div>
                      {example.explanation && (
                        <div className="text-gray-400 mt-2">{example.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                <ul className="space-y-1">
                  {challenge.constraints?.map((constraint, index) => (
                    <li key={index} className="text-gray-400 text-sm font-mono ml-4">
                      • {constraint}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {}
            {!hasCompleted && startTime && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaCode />
                  Your Solution
                </h3>
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="// Write your code here..."
                  className="w-full h-64 bg-gray-800 border border-gray-700 rounded-xl p-4 font-mono text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {}
            <div className="mt-6 flex gap-4">
              {!startTime && !hasCompleted && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startChallenge}
                  className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                >
                  <FaBolt />
                  Start Challenge
                </motion.button>
              )}

              {startTime && !hasCompleted && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitChallenge}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <FaCheckCircle />
                    Submit Solution
                  </motion.button>

                  <button
                    onClick={() => toast('Hint: Try using a hash map!', { icon: '💡' })}
                    className="px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold flex items-center gap-2 transition-all"
                  >
                    <FaLightbulb />
                    Get Hint
                  </button>
                </>
              )}

              {hasCompleted && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toast.success('Come back tomorrow for a new challenge!')}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                >
                  <FaTrophy />
                  View Solutions
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {}
        <div className="space-y-6">
          {}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h3 className="text-xl font-bold mb-4">Your Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" />
                  <span className="text-gray-400">Completed</span>
                </div>
                <span className="text-2xl font-bold">23</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFire className="text-orange-400" />
                  <span className="text-gray-400">Best Streak</span>
                </div>
                <span className="text-2xl font-bold">14</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaClock className="text-blue-400" />
                  <span className="text-gray-400">Avg Time</span>
                </div>
                <span className="text-2xl font-bold">18:32</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-gray-400">Total XP</span>
                </div>
                <span className="text-2xl font-bold">1,150</span>
              </div>
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaChartLine />
              Recent History
            </h3>

            <div className="space-y-2">
              {challengeHistory.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.completed ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.completed ? (
                      <FaCheckCircle className="text-green-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                    )}
                    <div>
                      <div className="text-sm font-semibold">{item.date}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[150px]">
                        {item.problem}
                      </div>
                    </div>
                  </div>
                  {item.time && (
                    <div className="text-xs font-mono text-gray-400">{item.time}</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-center"
          >
            <FaTrophy className="text-5xl mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Keep Going!</h3>
            <p className="text-white/80 text-sm">
              You're just 7 days away from earning the "Month Warrior" badge! 🏆
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default DailyChallengePage
