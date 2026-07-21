import Company, { CompanyProblem } from '../models/Company.js'
import Problem from '../models/Problem.js'
import { NotFoundError } from '../utils/errors.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export const list = wrap(async (req, res) => {
  const { tier, q } = req.query
  const filter = {}
  if (tier) filter.tier = tier
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { slug: rx }, { focusTags: rx }]
  }
  const companies = await Company.find(filter)
    .sort({ tier: 1, name: 1 })
    .lean()
  res.json({ success: true, data: companies })
})

export const getBySlug = wrap(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug.toLowerCase() }).lean()
  if (!company) throw new NotFoundError('Company not found')
  res.json({ success: true, data: company })
})

export const listProblems = wrap(async (req, res) => {
  const { slug } = req.params
  const { difficulty, pattern, minFrequency, limit = 100, sort = 'frequency' } = req.query

  const company = await Company.findOne({ slug: slug.toLowerCase() }).lean()
  if (!company) throw new NotFoundError('Company not found')

  const cpFilter = { companyId: company._id }
  if (minFrequency) cpFilter.frequency = { $gte: Math.min(5, Math.max(1, Number(minFrequency))) }

  const cp = await CompanyProblem.find(cpFilter)
    .sort(sort === 'recent' ? { createdAt: -1 } : { frequency: -1 })
    .limit(Math.min(500, Number(limit) || 100))
    .lean()

  const problemIds = cp.map((c) => c.problemId)
  const problems = await Problem.find({ _id: { $in: problemIds } }).lean()

  const byId = new Map(problems.map((p) => [String(p._id), p]))
  const joined = cp
    .map((c) => {
      const p = byId.get(String(c.problemId))
      if (!p) return null
      if (difficulty && p.difficulty !== difficulty) return null
      if (pattern && !p.tags?.includes(pattern.toLowerCase()) &&
          !p.analysis?.pattern_identification?.pattern?.toLowerCase().includes(pattern.toLowerCase())) {
        return null
      }
      return {
        problemId: p._id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        tags: p.tags,
        pattern: p.analysis?.pattern_identification?.pattern || null,
        frequency: c.frequency,
        acceptanceRate: c.acceptanceRate ?? p.acceptanceRate ?? null,
        round: c.round,
        lists: c.lists,
        note: c.note,
      }
    })
    .filter(Boolean)

  res.json({ success: true, data: { company, problems: joined, total: joined.length } })
})

export const companiesForProblem = wrap(async (req, res) => {
  const { id } = req.params
  const problem = await Problem.findOne({
    $or: [{ _id: id }, { slug: id }, { problemId: id }],
  }).lean()
  if (!problem) throw new NotFoundError('Problem not found')

  const links = await CompanyProblem.find({ problemId: problem._id })
    .populate('companyId', 'name slug tier logoUrl')
    .sort({ frequency: -1 })
    .lean()

  res.json({
    success: true,
    data: {
      problem: { _id: problem._id, title: problem.title, slug: problem.slug },
      companies: links.map((l) => ({
        company: l.companyId,
        frequency: l.frequency,
        acceptanceRate: l.acceptanceRate,
        round: l.round,
        lists: l.lists,
        note: l.note,
      })),
    },
  })
})

export default { list, getBySlug, listProblems, companiesForProblem }
