/**
 * AI usage log — per-call, per-user, per-feature token accounting.
 *
 * Used to:
 *   - enforce the `DAILY_AI_TOKEN_LIMIT` per user
 *   - expose a Prometheus counter for total tokens used
 *   - power the billing page (Phase 15)
 */
import mongoose from 'mongoose'

const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feature: {
      type: String,
      enum: [
        'problemAnalysis',
        'hint',
        'codeReview',
        'interviewFeedback',
        'dryRun',
        'comparison',
        'visualization',
        'recommendation',
        'other',
      ],
      required: true,
    },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
    mocked: { type: Boolean, default: false },
    error: { type: String, default: null },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

aiUsageSchema.index({ userId: 1, createdAt: -1 })
aiUsageSchema.index({ feature: 1, createdAt: -1 })

const AiUsage = mongoose.model('AiUsage', aiUsageSchema)

export default AiUsage
