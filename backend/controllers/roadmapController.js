import { UserRoadmap } from '../models/Roadmap.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const DEFAULT_TOPICS = [
  { topicId: 'arrays-hashing', title: 'Arrays & Hashing' },
  { topicId: 'two-pointers', title: 'Two Pointers' },
  { topicId: 'sliding-window', title: 'Sliding Window' },
  { topicId: 'stack', title: 'Stack' },
  { topicId: 'binary-search', title: 'Binary Search' },
  { topicId: 'linked-list', title: 'Linked List' },
  { topicId: 'trees', title: 'Trees' },
  { topicId: 'tries', title: 'Tries' },
  { topicId: 'heap', title: 'Heap / Priority Queue' },
  { topicId: 'backtracking', title: 'Backtracking' },
  { topicId: 'graphs', title: 'Graphs' },
  { topicId: 'dp', title: 'Dynamic Programming' },
]

const ensureRoadmap = async (userId) => {
  let rm = await UserRoadmap.findOne({ userId })
  if (!rm) {
    rm = await UserRoadmap.create({ userId, topics: DEFAULT_TOPICS.map((t) => ({ ...t, completed: false })) })
  }
  return rm
}

export const getRoadmap = wrap(async (req, res) => {
  const rm = await ensureRoadmap(req.user._id)
  res.json({ success: true, data: rm })
})

export const updateTopicProgress = wrap(async (req, res) => {
  const { topicId, completed, problemsSolved, notes } = req.body
  if (!topicId) throw new ValidationError('topicId is required')
  const rm = await ensureRoadmap(req.user._id)
  const topic = rm.topics.find((t) => t.topicId === topicId)
  if (!topic) throw new NotFoundError('Topic not found')
  if (typeof completed === 'boolean') {
    topic.completed = completed
    topic.completedAt = completed ? new Date() : null
  }
  if (typeof problemsSolved === 'number') topic.problemsSolved = problemsSolved
  if (typeof notes === 'string') topic.notes = notes
  rm.lastUpdated = new Date()
  await rm.save()
  res.json({ success: true, data: rm })
})

export const resetRoadmap = wrap(async (req, res) => {
  await UserRoadmap.deleteOne({ userId: req.user._id })
  const rm = await ensureRoadmap(req.user._id)
  res.json({ success: true, message: 'Roadmap reset', data: rm })
})

export default { getRoadmap, updateTopicProgress, resetRoadmap }
