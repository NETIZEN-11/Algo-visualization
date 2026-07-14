import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaTrophy,
  FaClock,
  FaFire,
  FaUsers,
  FaPlay,
  FaCheckCircle,
  FaMedal,
  FaStar,
  FaChartLine,
} from 'react-icons/fa'
import toast from 'react-hot-toast'

function ContestPage() {
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming, ongoing, past
  const [selectedContest, setSelectedContest] = useState(null)
  const [isContestActive, setIsContestActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [, setCurrentProblemIndex] = useState(0)
  const [userSubmissions, setUserSubmissions] = useState({})

  // Mock contest data
  const contests = {
    upcoming: [
      {
        id: 1,
        title: 'Weekly Contest 123',
        description: 'Test your skills in this exciting weekly contest',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 90, // minutes
        problems: 4,
        participants: 0,
        difficulty: 'Mixed',
        prize: '500 XP',
      },
      {
        id: 2,
        title: 'Dynamic Programming Marathon',
        description: 'Focus on DP problems from easy to hard',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 120,
        problems: 5,
        participants: 0,
        difficulty: 'Advanced',
        prize: '750 XP + Badge',
      },
    ],
    ongoing: [
      {
        id: 3,
        title: 'Speed Coding Challenge',
        description: 'Solve problems as fast as you can!',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        duration: 60,
        totalProblems: 3,
        participants: 1247,
        difficulty: 'Medium',
        prize: '300 XP',
        problemList: [
          {
            title: 'Two Sum',
            difficulty: 'Easy',
            points: 100,
            solved: false,
          },
          {
            title: 'Valid Parentheses',
            difficulty: 'Easy',
            points: 100,
            solved: false,
          },
          {
            title: 'Longest Substring Without Repeating',
            difficulty: 'Medium',
            points: 200,
            solved: false,
          },
        ],
      },
    ],
    past: [
      {
        id: 4,
        title: 'Array Masters Contest',
        description: 'Arrays and sliding window problems',
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        duration: 90,
        problems: 4,
        participants: 2156,
        difficulty: 'Medium',
        winner: 'Alice_Coder',
        yourRank: 127,
        yourScore: 350,
      },
    ],
  }

  useEffect(() => {
    if (isContestActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsContestActive(false)
            toast.success('Contest ended! Submitting your solutions...')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isContestActive, timeRemaining])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  const startContest = (contest) => {
    setSelectedContest(contest)
    setIsContestActive(true)
    setTimeRemaining(contest.duration * 60)
    setCurrentProblemIndex(0)
    toast.success('Contest started! Good luck! 🚀')
  }

  const submitSolution = (problemIndex) => {
    setUserSubmissions({
      ...userSubmissions,
      [problemIndex]: {
        submitted: true,
        score: selectedContest.problems[problemIndex].points,
      },
    })
    toast.success('Solution submitted successfully!')
  }

  const ContestCard = ({ contest, type }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{contest.title}</h3>
          <p className="text-gray-400 text-sm">{contest.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          contest.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
          contest.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
          contest.difficulty === 'Advanced' ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {contest.difficulty}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <FaClock className="text-blue-400" />
          <span className="text-gray-400">{contest.duration} min</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FaCheckCircle className="text-green-400" />
          <span className="text-gray-400">{contest.problems} problems</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FaUsers className="text-purple-400" />
          <span className="text-gray-400">{contest.participants.toLocaleString()} joined</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FaTrophy className="text-yellow-400" />
          <span className="text-gray-400">{contest.prize}</span>
        </div>
      </div>

      {/* Time/Status */}
      {type === 'upcoming' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-400">Starts in:</span>
            <span className="text-lg font-bold text-blue-400">
              {formatDate(contest.startTime)}
            </span>
          </div>
        </div>
      )}

      {type === 'ongoing' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <FaFire className="text-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-green-400">LIVE NOW!</span>
          </div>
        </div>
      )}

      {type === 'past' && contest.yourRank && (
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Your Rank</div>
              <div className="text-2xl font-bold text-orange-400">#{contest.yourRank}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Your Score</div>
              <div className="text-2xl font-bold text-white">{contest.yourScore}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Winner</div>
              <div className="text-sm font-bold text-yellow-400">{contest.winner}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {type === 'upcoming' && (
        <button
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
          onClick={() => toast('You will be notified when the contest starts', { icon: 'ℹ️' })}
        >
          Set Reminder
        </button>
      )}

      {type === 'ongoing' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => startContest(contest)}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
        >
          <FaPlay />
          Enter Contest
        </motion.button>
      )}

      {type === 'past' && (
        <button
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
          onClick={() => toast('Viewing contest solutions', { icon: '📄' })}
        >
          View Solutions
        </button>
      )}
    </motion.div>
  )

  if (isContestActive && selectedContest) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-8">
        {/* Contest Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{selectedContest.title}</h1>
              <p className="text-white/80">Solve all problems to maximize your score</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/70 mb-1">Time Remaining</div>
              <div className="text-4xl font-bold text-white font-mono">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedContest.problems?.map((problem, index) => {
            const isSubmitted = userSubmissions[index]?.submitted

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-900 rounded-2xl p-6 border ${
                  isSubmitted
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-gray-800 hover:border-orange-500/50'
                } transition-all`}
              >
                {/* Problem Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Problem {index + 1}: {problem.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-400">
                      {problem.points}
                    </div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </div>

                {/* Status */}
                {isSubmitted ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <FaCheckCircle className="text-2xl text-green-400" />
                    <div>
                      <div className="font-semibold text-green-400">Submitted!</div>
                      <div className="text-sm text-gray-400">Score: {problem.points}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-xl p-4 mb-4">
                    <div className="text-sm text-gray-400 mb-2">Status: Not attempted</div>
                    <div className="text-xs text-gray-500">
                      Click "Solve" to start working on this problem
                    </div>
                  </div>
                )}

                {/* Action */}
                {!isSubmitted ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => submitSolution(index)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold transition-all"
                  >
                    Solve Problem
                  </motion.button>
                ) : (
                  <button
                    className="w-full py-3 bg-gray-800 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                    disabled
                  >
                    Already Submitted
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* End Contest Button */}
        <div className="mt-8 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsContestActive(false)
              setSelectedContest(null)
              toast.success('Contest ended! Your submissions have been recorded.')
            }}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-all"
          >
            End Contest Early
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Contest Mode
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Compete with others and test your skills under time pressure 🏆
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <FaTrophy className="text-3xl text-yellow-400" />
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-400">Contests Entered</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <FaMedal className="text-3xl text-orange-400" />
            <div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-400">Top 10 Finishes</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <FaStar className="text-3xl text-blue-400" />
            <div>
              <div className="text-2xl font-bold">1,420</div>
              <div className="text-sm text-gray-400">Contest Rating</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <FaChartLine className="text-3xl text-green-400" />
            <div>
              <div className="text-2xl font-bold">85%</div>
              <div className="text-sm text-gray-400">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {['upcoming', 'ongoing', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab} {tab === 'ongoing' && <span className="ml-2 text-green-400">●</span>}
          </button>
        ))}
      </div>

      {/* Contest Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {contests[activeTab].length > 0 ? (
            contests[activeTab].map((contest) => (
              <ContestCard key={contest.id} contest={contest} type={activeTab} />
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <FaTrophy className="text-6xl text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">No {activeTab} contests available</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ContestPage
