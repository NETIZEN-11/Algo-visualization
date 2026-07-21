import mongoose from 'mongoose'

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tier: {
      type: String,
      enum: ['FAANG', 'Tier-1', 'Tier-2', 'Startup'],
      default: 'Tier-1',
    },
    website: { type: String, default: null },
    logoUrl: { type: String, default: null },
    description: { type: String, default: '' },

    focusTags: [{ type: String, lowercase: true, trim: true }],

    problemCount: { type: Number, default: 0 },

    avgFrequency: { type: Number, default: 0 },
  },
  { timestamps: true }
)

companySchema.index({ tier: 1, name: 1 })

const Company = mongoose.model('Company', companySchema)
export default Company

const companyProblemSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },

    frequency: { type: Number, min: 1, max: 5, default: 3 },

    acceptanceRate: { type: Number, min: 0, max: 100, default: null },

    note: { type: String, default: '' },

    round: {
      type: String,
      enum: ['phone', 'online-assessment', 'onsite', 'any'],
      default: 'any',
    },

    lists: [{ type: String, enum: ['blind-75', 'neetcode-150', 'leetcode-top-100'] }],
  },
  { timestamps: true }
)

companyProblemSchema.index({ companyId: 1, frequency: -1 })
companyProblemSchema.index({ problemId: 1, companyId: 1 }, { unique: true })

const CompanyProblem = mongoose.model('CompanyProblem', companyProblemSchema)
export { CompanyProblem }
