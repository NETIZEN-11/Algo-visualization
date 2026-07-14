/**
 * Roadmap model — per-user progress through a learning track.
 *
 * There are two views of a "roadmap":
 *   1. The *system* roadmap template (name, description, ordered topics
 *      with problems). Authors can create these.
 *   2. The *per-user* progress: which topics the user has finished, how
 *      many problems they've solved in each, free-form notes.
 *
 * Both live in this single collection. System roadmaps omit `userId`;
 * user-progress roadmaps are scoped by `userId` and have only the topic
 * progress fields, no nested problems. The controller decides which
 * shape to create.
 */
import mongoose from 'mongoose'

const topicProgressSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    problemsSolved: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
)

const userRoadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'DSA Mastery' },
    topics: { type: [topicProgressSchema], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
)
userRoadmapSchema.index({ userId: 1 }, { unique: true })

const systemRoadmapSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, required: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
    estimatedTime: { type: String, default: '2 weeks' },
    topics: [
      {
        name: { type: String, required: true },
        description: { type: String },
        order: { type: Number, required: true },
        estimatedTime: { type: String, default: '1-2 days' },
        concepts: [
          {
            name: String,
            description: String,
            resources: [
              {
                title: String,
                url: String,
                type: { type: String, enum: ['article', 'video', 'tutorial', 'documentation'] },
              },
            ],
          },
        ],
        problems: [
          {
            problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
            title: String,
            difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
            importance: { type: String, enum: ['must_do', 'recommended', 'optional'], default: 'recommended' },
          },
        ],
      },
    ],
    prerequisites: [{ type: String }],
    skills: [{ type: String }],
    totalProblems: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)
systemRoadmapSchema.index({ order: 1, isActive: 1 })

// Two-collection hack via discriminated union? Simpler: use two models
// on the same collection. We name the user-progress model differently
// to keep mongoose from clashing.
const Roadmap = mongoose.model('Roadmap', systemRoadmapSchema)
const UserRoadmap = mongoose.model('UserRoadmap', userRoadmapSchema)

export { Roadmap, UserRoadmap }
export default Roadmap
