/**
 * Company model — FAANG+ companies that publish DSA question lists.
 *
 * Two roles:
 *   1. The "company" record itself (name, slug, logo, blurb, tier).
 *   2. Frequency data: for each company, which problems appear on
 *      their interview list, how often, and the acceptance rate.
 *
 * Frequency is stored on the Company doc as an array of refs, but the
 * canonical "this problem at this company" record lives in
 * `CompanyProblem` (see below) so the join is fast and the data
 * doesn't denormalise into a single mega-doc.
 */
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
    /** List of LeetCode-like tags this company tends to ask about. */
    focusTags: [{ type: String, lowercase: true, trim: true }],
    /** Count of problems currently linked to this company. */
    problemCount: { type: Number, default: 0 },
    /** Average interview frequency (1-5) across linked problems. */
    avgFrequency: { type: Number, default: 0 },
  },
  { timestamps: true }
)

companySchema.index({ tier: 1, name: 1 })

const Company = mongoose.model('Company', companySchema)
export default Company

/* ------------------------------------------------------------------ */
/* CompanyProblem — the per-(company, problem) link record              */
/* ------------------------------------------------------------------ */

const companyProblemSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    /** 1 (rare) → 5 (asked every loop) */
    frequency: { type: Number, min: 1, max: 5, default: 3 },
    /** Optional acceptance rate observed in this company's slate. */
    acceptanceRate: { type: Number, min: 0, max: 100, default: null },
    /** Free-form note ("asked in onsite 2024", "phone screen only", …) */
    note: { type: String, default: '' },
    /** Which round this typically appears in. */
    round: {
      type: String,
      enum: ['phone', 'online-assessment', 'onsite', 'any'],
      default: 'any',
    },
    /** Whether the company is in Blind 75 / NeetCode 150 lists. */
    lists: [{ type: String, enum: ['blind-75', 'neetcode-150', 'leetcode-top-100'] }],
  },
  { timestamps: true }
)

companyProblemSchema.index({ companyId: 1, frequency: -1 })
companyProblemSchema.index({ problemId: 1, companyId: 1 }, { unique: true })

const CompanyProblem = mongoose.model('CompanyProblem', companyProblemSchema)
export { CompanyProblem }
