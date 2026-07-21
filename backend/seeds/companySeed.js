/**
 * Company + frequency seed.
 *
 * Seeds the Company model with 20 well-known companies and a small
 * but meaningful set of "(company, problem, frequency)" links. The
 * dataset is meant to be extended — admin users can add more rows
 * via the API.
 *
 * Idempotent: running this twice doesn't duplicate rows. The script
 * matches by `slug`.
 *
 * Run: `node -e "import('./seeds/companySeed.js').then(m => m.run())"`
 */
import mongoose from 'mongoose'
import Company, { CompanyProblem } from '../models/Company.js'
import Problem from '../models/Problem.js'
import { logger } from '../utils/logger.js'
import connectDB from '../config/database.js'

/* ------------------------------------------------------------------ */
/* Canonical company list                                               */
/* ------------------------------------------------------------------ */

const COMPANIES = [
  { name: 'Google',     slug: 'google',     tier: 'FAANG', focusTags: ['graph', 'string', 'recursion', 'dp'] },
  { name: 'Amazon',     slug: 'amazon',     tier: 'FAANG', focusTags: ['array', 'hash table', 'tree', 'design'] },
  { name: 'Meta',       slug: 'meta',       tier: 'FAANG', focusTags: ['string', 'graph', 'tree', 'dp'] },
  { name: 'Apple',      slug: 'apple',      tier: 'FAANG', focusTags: ['array', 'string', 'tree'] },
  { name: 'Netflix',    slug: 'netflix',    tier: 'FAANG', focusTags: ['array', 'design', 'system design'] },
  { name: 'Microsoft',  slug: 'microsoft',  tier: 'FAANG', focusTags: ['linked list', 'tree', 'string', 'dp'] },
  { name: 'Uber',       slug: 'uber',       tier: 'Tier-1', focusTags: ['graph', 'heap', 'design'] },
  { name: 'Airbnb',     slug: 'airbnb',     tier: 'Tier-1', focusTags: ['string', 'array', 'graph'] },
  { name: 'LinkedIn',   slug: 'linkedin',   tier: 'Tier-1', focusTags: ['graph', 'design', 'heap'] },
  { name: 'Twitter',    slug: 'twitter',    tier: 'Tier-1', focusTags: ['design', 'graph', 'string'] },
  { name: 'Salesforce', slug: 'salesforce', tier: 'Tier-1', focusTags: ['array', 'string', 'dp'] },
  { name: 'Oracle',     slug: 'oracle',     tier: 'Tier-1', focusTags: ['array', 'string', 'sql'] },
  { name: 'Adobe',      slug: 'adobe',      tier: 'Tier-1', focusTags: ['array', 'string', 'math'] },
  { name: 'Bloomberg',  slug: 'bloomberg',  tier: 'Tier-1', focusTags: ['array', 'string', 'hash table'] },
  { name: 'Atlassian',  slug: 'atlassian',  tier: 'Tier-1', focusTags: ['string', 'design', 'graph'] },
  { name: 'Spotify',    slug: 'spotify',    tier: 'Tier-1', focusTags: ['graph', 'design', 'hash table'] },
  { name: 'Stripe',     slug: 'stripe',     tier: 'Tier-1', focusTags: ['math', 'string', 'design'] },
  { name: 'Snap',       slug: 'snap',       tier: 'Tier-2', focusTags: ['array', 'string'] },
  { name: 'Dropbox',    slug: 'dropbox',    tier: 'Tier-2', focusTags: ['design', 'hash table', 'string'] },
  { name: 'Pinterest',  slug: 'pinterest',  tier: 'Tier-2', focusTags: ['graph', 'array'] },
]

/* ------------------------------------------------------------------ */
/* Per-company problem frequency map                                    */
/*                                                                     */
/* Each row: { slug: 'problem-slug', freq: 1-5, round, lists, note }    */
/* Slugs match the curated Problem.slug in the DB.                     */
/* ------------------------------------------------------------------ */

const COMPANY_PROBLEMS = {
  google: [
    { slug: 'two-sum',                        freq: 5, round: 'phone',     lists: ['blind-75', 'neetcode-150'] },
    { slug: 'valid-parentheses',              freq: 4, round: 'phone' },
    { slug: 'merge-intervals',                freq: 5, round: 'onsite',    lists: ['blind-75'] },
    { slug: 'word-search',                    freq: 4, round: 'onsite' },
    { slug: 'trapping-rain-water',            freq: 5, round: 'onsite',    lists: ['neetcode-150'] },
    { slug: 'longest-substring-without-repeating-characters', freq: 4, round: 'onsite' },
    { slug: 'serialize-and-deserialize-binary-tree', freq: 3, round: 'onsite' },
  ],
  amazon: [
    { slug: 'two-sum', freq: 5, round: 'online-assessment', lists: ['blind-75'] },
    { slug: 'best-time-to-buy-and-sell-stock', freq: 5, round: 'online-assessment' },
    { slug: 'valid-parentheses', freq: 4, round: 'online-assessment' },
    { slug: 'merge-intervals', freq: 4, round: 'onsite' },
    { slug: 'number-of-islands', freq: 5, round: 'onsite', lists: ['blind-75'] },
    { slug: 'rotting-oranges', freq: 4, round: 'onsite' },
    { slug: 'lru-cache', freq: 5, round: 'onsite', lists: ['neetcode-150'] },
    { slug: 'word-search', freq: 4, round: 'onsite' },
  ],
  meta: [
    { slug: 'valid-parentheses', freq: 4, round: 'phone' },
    { slug: 'merge-intervals', freq: 4, round: 'phone' },
    { slug: 'trapping-rain-water', freq: 5, round: 'onsite', lists: ['neetcode-150'] },
    { slug: 'word-search', freq: 4, round: 'onsite' },
    { slug: 'lru-cache', freq: 4, round: 'onsite' },
    { slug: 'clone-graph', freq: 3, round: 'onsite' },
  ],
  apple: [
    { slug: 'two-sum', freq: 4, round: 'phone' },
    { slug: 'best-time-to-buy-and-sell-stock', freq: 4, round: 'phone' },
    { slug: 'valid-parentheses', freq: 3, round: 'phone' },
    { slug: 'maximum-depth-of-binary-tree', freq: 3, round: 'onsite' },
  ],
  netflix: [
    { slug: 'two-sum', freq: 4, round: 'phone' },
    { slug: 'merge-intervals', freq: 3, round: 'onsite' },
    { slug: 'top-k-frequent-elements', freq: 3, round: 'onsite' },
  ],
  microsoft: [
    { slug: 'two-sum', freq: 4, round: 'online-assessment' },
    { slug: 'reverse-linked-list', freq: 4, round: 'online-assessment' },
    { slug: 'valid-parentheses', freq: 4, round: 'online-assessment' },
    { slug: 'merge-two-sorted-lists', freq: 4, round: 'onsite' },
    { slug: 'trapping-rain-water', freq: 4, round: 'onsite' },
  ],
  uber: [
    { slug: 'top-k-frequent-elements', freq: 5, round: 'phone' },
    { slug: 'word-search', freq: 4, round: 'onsite' },
    { slug: 'valid-parentheses', freq: 3, round: 'phone' },
  ],
  airbnb: [
    { slug: 'word-search', freq: 4, round: 'phone' },
    { slug: 'trapping-rain-water', freq: 3, round: 'onsite' },
  ],
  linkedin: [
    { slug: 'merge-intervals', freq: 4, round: 'onsite' },
    { slug: 'valid-parentheses', freq: 3, round: 'phone' },
  ],
  twitter: [
    { slug: 'valid-parentheses', freq: 3, round: 'phone' },
    { slug: 'merge-intervals', freq: 3, round: 'onsite' },
  ],
  salesforce: [
    { slug: 'two-sum', freq: 3, round: 'phone' },
    { slug: 'merge-intervals', freq: 3, round: 'onsite' },
  ],
  oracle: [
    { slug: 'two-sum', freq: 3, round: 'phone' },
    { slug: 'merge-intervals', freq: 3, round: 'phone' },
  ],
  adobe: [
    { slug: 'two-sum', freq: 3, round: 'phone' },
    { slug: 'merge-intervals', freq: 3, round: 'onsite' },
  ],
  bloomberg: [
    { slug: 'two-sum', freq: 5, round: 'phone' },
    { slug: 'valid-parentheses', freq: 4, round: 'phone' },
    { slug: 'merge-intervals', freq: 4, round: 'onsite' },
  ],
  atlassian: [
    { slug: 'valid-parentheses', freq: 4, round: 'phone' },
    { slug: 'merge-intervals', freq: 3, round: 'onsite' },
  ],
  spotify: [
    { slug: 'top-k-frequent-elements', freq: 4, round: 'onsite' },
    { slug: 'merge-intervals', freq: 3, round: 'phone' },
  ],
  stripe: [
    { slug: 'two-sum', freq: 3, round: 'phone' },
    { slug: 'valid-parentheses', freq: 3, round: 'onsite' },
  ],
  snap: [
    { slug: 'two-sum', freq: 3, round: 'phone' },
  ],
  dropbox: [
    { slug: 'lru-cache', freq: 4, round: 'onsite' },
    { slug: 'top-k-frequent-elements', freq: 3, round: 'onsite' },
  ],
  pinterest: [
    { slug: 'word-search', freq: 3, round: 'onsite' },
    { slug: 'top-k-frequent-elements', freq: 3, round: 'onsite' },
  ],
}

/* ------------------------------------------------------------------ */
/* Run                                                                  */
/* ------------------------------------------------------------------ */

export async function run({ silent = false } = {}) {
  const log = silent ? () => {} : (...a) => logger.info(a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : x)).join(' '))
  log('Company seed: start')
  let companyCount = 0
  for (const c of COMPANIES) {
    await Company.findOneAndUpdate(
      { slug: c.slug },
      { $set: c, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    )
    companyCount++
  }
  log(`Upserted ${companyCount} companies`)

  // Link problems — only if a problem with that slug exists
  let linkCount = 0
  let skipped = 0
  for (const [companySlug, problems] of Object.entries(COMPANY_PROBLEMS)) {
    const company = await Company.findOne({ slug: companySlug }).lean()
    if (!company) continue
    for (const p of problems) {
      const problem = await Problem.findOne({ slug: p.slug }).lean()
      if (!problem) {
        skipped++
        continue
      }
      await CompanyProblem.findOneAndUpdate(
        { companyId: company._id, problemId: problem._id },
        {
          $set: {
            frequency: p.freq,
            round: p.round || 'any',
            lists: p.lists || [],
            note: p.note || '',
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )
      linkCount++
    }
  }
  log(`Linked ${linkCount} (company, problem) pairs; ${skipped} skipped (no problem with that slug)`)

  // Recompute counts on the company docs
  for (const c of COMPANIES) {
    const company = await Company.findOne({ slug: c.slug }).lean()
    if (!company) continue
    const links = await CompanyProblem.find({ companyId: company._id }).lean()
    const avg = links.length ? links.reduce((s, l) => s + l.frequency, 0) / links.length : 0
    await Company.updateOne({ _id: company._id }, { problemCount: links.length, avgFrequency: Number(avg.toFixed(2)) })
  }
  log('Company seed: done')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  connectDB().then(() =>
    run().then(
      () => mongoose.connection.close().then(() => process.exit(0)),
      (err) => {
        console.error(err)
        process.exit(1)
      }
    )
  )
}
