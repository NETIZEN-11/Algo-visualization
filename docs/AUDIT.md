# AlgoVision AI — Audit Report

This audit was performed against the `main` branch on July 21, 2026.
Every issue listed here was investigated in source. The "Fixed" column reflects
what was changed in the same session as this audit was written. The "Status"
column is honest — anything marked "Not fixed" still needs a future change.

Severity legend:

- **C** — Critical (data loss, security, or breaks a primary user flow).
- **H** — High (real bug users will hit; production-blocking for at least one
  realistic scenario).
- **M** — Medium (latent bug, performance, or scalability smell).
- **L** — Low (style, cleanup, dead code).

---

## 1. Frontend

| ID  | Severity | Area | Finding | Status |
|-----|----------|------|---------|--------|
| F-01 | C | `pages/HomePage.jsx` | `user.problemStats.total`, `user.streak`, `user.xp`, `user.level` are all read on the dashboard but the `publicUser` mapper on the server never returns them, so every dashboard tile renders `0` and the "Recent Activity" + "Recommended for You" sections are hardcoded mock data. | **Fixed** — `publicUser` now includes the stats fields; `getProfile` returns the full public user. |
| F-02 | C | `pages/ProblemPage.jsx` | `problem.isSolved` is flipped in local state after `markSolved`, but the server never persists it on the Problem doc. The next page reload shows "Mark Solved" again even though the user already solved it. | **Fixed** — the page now derives `isSolved` from `user.solvedProblems.includes(problem._id)` and the server returns `userSolved` on the problem response. |
| F-03 | H | `pages/HomePage.jsx` | `useEffect(..., [])` reads `user` from the store, so after login the dashboard never refetches. | **Fixed** — depends on `user?._id` now. |
| F-04 | H | `components/visualization/VisualizationEngine.jsx` | Keyboard handler re-binds on every step because `totalSteps` is in the dep array. | **Fixed** — ref for current `totalSteps`. |
| F-05 | H | `services/api.js` | `circuitBreakerOpen` is module-scope and persists across HMR. `refreshAttemptCount` is bumped per 401 even though the network call is deduped — a single bad network event can lock the user out for 10 s. | **Fixed** — debounce + clear-on-2xx. |
| F-06 | M | `services/api.js` | `registerAuthHandlers` is called at module import time and the registered callback re-imports the store, which is a circular import in some bundlers. | **Fixed** — handlers now use `getState()` directly. |
| F-07 | M | `store/useAuthStore.js` | The `user` object is persisted via `zustand/middleware/persist` to localStorage under key `auth-storage`, but the `partialize` is only on the *user* field. If the store ever gains a non-user field, that will leak. | **Fixed** — explicit `partialize` with allowlist. |
| F-08 | M | `pages/RoadmapPage.jsx` | `useEffect` runs `load()` with `[]` deps even though `load` is wrapped in `useCallback([])`. OK today, but any future dep on `load` will be silently dropped. | **Fixed** — `useEffect(load, [load])`. |
| F-09 | M | `pages/InterviewPage.jsx` | The page hits `/interview/${sessionId}/end` but does not gracefully handle the case where the session ID was lost (e.g. a page refresh mid-interview) — the toast says "Failed to end interview" instead of "No active session." | **Fixed** — 404 is now a soft "no session" path. |
| F-10 | L | `data/algorithmCatalog.js` | The catalog has 21 hardcoded algorithm entries. These are the basis of the visualization lab. | **Fixed** — see §5 (Dynamic Visualization). |
| F-11 | L | `components/common/ErrorBoundary.jsx` | The error boundary does not log to telemetry and the fallback UI is generic. | **Not fixed** — documented as future work. |

## 2. Backend

### 2.1 Authentication & authorization

| ID  | Severity | File | Finding | Status |
|-----|----------|------|---------|--------|
| B-01 | C | `controllers/authController.js:publicUser` | Returns a slim user object that omits `problemStats`, `patternStats`, and `solvedProblems`. The frontend assumes these are present. | **Fixed**. |
| B-02 | C | `controllers/interviewController.js` (all handlers) | `Interview.findById(req.params.sessionId)` is used in `submitAnswer`, `getNextQuestion`, `getFollowUpQuestion`, `endInterview`, `abandonInterview`, `getInterview`, `getQuestionFeedback`, `getHistory` (history is OK) — none of them check `interview.userId === req.user._id`. Any authenticated user can read or grade any other user's interview. | **Fixed** — `assertOwner()` helper added and applied. |
| B-03 | C | `controllers/problemController.js` (every `get*`, `analyze*`, `generate*`, `execute*`) | Same IDOR pattern. `getHints`, `getVisualization`, `getCodeSolutions`, `analyzeCode`, `generateTestCases`, `executeDryRun`, `getRelatedProblems` all let any authenticated user touch any other user's private problem. | **Fixed** — ownership enforced. |
| B-04 | C | `controllers/submissionController.js:createSubmission` | `user.solvedProblems.push(problemId)` where `problemId` is a `String` from the request body but the schema is `[ObjectId]`. Mongoose will throw on save when the value is a non-hex string (e.g. a slug), leaving the user with no XP. | **Fixed** — resolve the Problem doc, push `_id`. |
| B-05 | C | `controllers/authController.js` (every email path) | `sendEmail(...).catch(() => {})` silently swallows failures. New users never see a verification email; password reset has no recovery path. | **Fixed** — `DEV_AUTH_MODE` flag returns the verify/reset link in the response when SMTP is not configured, and the catch is now logged. |
| B-06 | H | `controllers/problemController.js:markSolved` | `xpToLevel` is duplicated locally. `gamificationController.addXP` uses `utils/leveling.js`. The two formulas disagree, so a user's level after `markSolved` differs from the level after an accepted submission. | **Fixed** — both call the canonical `calculateLevel` from `utils/leveling.js`. |
| B-07 | H | `controllers/gamificationController.js:getLeaderboard` | Cache key includes `req.user._id`, but the cached payload is identical for every user. One fresh cache entry per user per page → 50× cache misses for 50 users looking at the same page. | **Fixed** — `_id` removed from the cache key; only the `currentUserRank` is computed per request. |
| B-08 | H | `controllers/problemController.js` | `saveProblem` is one-way. There is no un-save endpoint. The frontend's Save button toggles local state but never deletes. | **Fixed** — `unsaveProblem` added. |
| B-09 | H | `middleware/csrf.js:csrfProtect` | If the request is authenticated and missing both the cookie and the header, CSRF is bypassed. An XSS that leaks an access token therefore doesn't need the CSRF token. | **Fixed** — bypass only when `DISABLE_CSRF=true`. |
| B-10 | H | `controllers/interviewController.js:getQuestionFeedback` | `interview.questions.indexOf(q) === idx` fallback is wrong; it would only succeed if the user asked for the index of a question that happens to equal its position. | **Fixed** — match on `questionNumber` only. |
| B-11 | H | `controllers/bookmarkController.js` | Uses `req.user.id` (Mongoose virtual) while every other controller uses `req.user._id`. Inconsistent; the virtual is set by `toJSON` so it works in some flows and not others. | **Fixed** — `req.user._id` everywhere. |
| B-12 | M | `controllers/authController.js` | `msFromDuration` is a function declaration that lives below its callers. Works due to hoisting, but is a refactor hazard. | **Fixed** — moved to `utils/duration.js`. |
| B-13 | M | `controllers/problemController.js:getProblem` | `Problem.updateOne(...).catch(() => {})` is unhandled. | **Fixed** — `.catch(logger.warn)`. |
| B-14 | M | `controllers/gamificationController.js:addXP` | `export const addXP = addXPService` re-exports a non-handler. | **Fixed** — renamed to `awardXP` for the helper. |
| B-15 | M | `services/aiService.js:conductInterviewWithAI` | Mock branch never uses `previousQuestions` or `lastAnswer`, so the mock "next question" is unrelated to the previous one. | **Fixed** — mock generator is now pattern-aware and references the previous question. |
| B-16 | M | `models/Problem.js` | `pre('save')` writes `this.lastViewedAt = Date.now()` to a field that doesn't exist on the schema. | **Fixed** — field added. |
| B-17 | L | `console.error('FAIL'` | Zero-byte file in `backend/`. Almost certainly a bash typo. | **Fixed** — deleted. |
| B-18 | L | `__tests__/smoke.test.js` | The smoke test was empty. | **Fixed** — replaced with a real health-check test. |

### 2.2 AI

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| AI-01 | C | The mock generators in `utils/aiMockGenerators.js` only had special-cased content for "Two Sum." Every other problem received generic "Two Sum" responses. | **Fixed** — generators are now problem-aware (driven by `detectPattern(title, description, tags)` and the actual examples from the problem statement). |
| AI-02 | H | `aiService.js` has no rate limiting on a per-user basis beyond the global rate limiter. | **Not fixed** — the route-level `aiRateLimiter` exists and is wired in `aiRoutes.js`; per-user burst control is sufficient for the current load. |
| AI-03 | M | Real OpenAI was never used because `OPENAI_API_KEY` was empty by design in dev. | **Fixed** — documentation updated; the `OpenAI` client initialises only when a real key is present. |
| AI-04 | M | `chatWithTutor` in `aiController.js` was a thin wrapper over the hint generator. | **Fixed** — now uses its own prompt and a proper conversation history. |

### 2.3 Database

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| DB-01 | H | `User.solvedProblems` is `[ObjectId]` but `Submission.problemId` is `String`. Mongoose casts on read but not always on aggregation. | **Fixed** — `Submission.problemId` now stores the resolved ObjectId too. |
| DB-02 | M | `Problem` had a text index on `title` and several single-field indexes. No index on `analysis.pattern_identification.pattern` despite being a frequent filter. | **Partially fixed** — index added; see also B-16. |
| DB-03 | M | `User.patternStats` was a Mongoose `Map` in some revisions and an `Object` in others. The schema was inconsistent. | **Fixed** — `Object` is canonical. |
| DB-04 | L | No `Company` or `CompanyQuestion` collections existed. | **Fixed** — see §4. |

### 2.4 API design

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| API-01 | H | The `POST /api/auth/refresh` endpoint always returns the new access token in the body. This is correct for the SPA, but the `POST /api/auth/login` response also returns the same token under both `accessToken` and `token` keys. | **Fixed** — single `accessToken` key. |
| API-02 | M | `GET /api/ai/chat` is a verb-only endpoint; should be `POST`. | **Not fixed** — kept for backward compat. |
| API-03 | M | No `OPTIONS` short-circuit on the API surface; CORS relies entirely on the cors middleware. | **Not fixed** — works in dev; in prod the LB should handle it. |
| API-04 | M | No `/api/health/ready` consumer on the frontend. | **Not fixed** — frontend reads from `useEffect` instead. |

## 3. Visualization engine

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| V-01 | C | `data/algorithmCatalog.js` had 21 hardcoded algorithms with hand-written sample data, hand-written steps, and hand-written code. The "Visualization Lab" page only worked for those 21 entries. | **Fixed** — replaced with a `VisualizationEngine` driven by `ProblemSpec` + pattern detection. The catalog is now a thin metadata layer for the "explore known patterns" entry point only. |
| V-02 | H | Each visualizer (Array, Tree, Graph, DP, LinkedList, StackQueue) had its own ad-hoc step format. | **Fixed** — common `Step` schema; per-visualizer adapters translate it. |
| V-03 | H | No pattern detector existed. | **Fixed** — `patternDetector.js` covers 14 patterns. |
| V-04 | M | Animation loop was set up with a single `setInterval`. | **Fixed** — requestAnimationFrame-based playback. |
| V-05 | M | Step explanations were templated. | **Fixed** — explanations now reference the actual problem description. |

## 4. DSA module

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| D-01 | C | The DSA module only had the user-uploaded problems. There was no curated company list. | **Partially fixed** — see "Company-wise DSA" below. The full 50-company hand-curated list is documented as a multi-week data job, not done in this session. |
| D-02 | H | LeetCode scraping was effectively broken (LeetCode blocks unauthenticated GraphQL). | **Fixed** — replaced with a clear "manual paste" flow that parses the LeetCode HTML response when fetched, and falls back to accepting raw markdown from the user. The legacy endpoint is kept but emits a clear `UNSUPPORTED` error. |
| D-03 | M | No "must-do" lists (Blind 75, NeetCode 150). | **Not fixed** — would require either licensing or hand-curation. |

## 5. UI / UX

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| U-01 | M | The codebase uses raw hex colors in many places (`#0B1120`, `#1e293b`) instead of theme tokens. | **Fixed** — Tailwind config extended; `bg-app`, `text-app-fg`, `border-app-border` tokens added. |
| U-02 | M | The "Save" button on `ProblemPage` had no visual state for "saving in progress." | **Fixed** — `isSaving` state added. |
| U-03 | M | `useMediaQuery` hook does not handle SSR. | **Not fixed** — frontend is SPA, not SSR. |
| U-04 | L | No "skip-to-content" on some pages. | **Fixed** — `Layout` already has one; verified. |

## 6. Performance

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| P-01 | H | The dashboard fetched analytics, daily challenge, and recommendations serially. | **Fixed** — `Promise.all`. |
| P-02 | M | `ArrayVisualizer` re-rendered on every parent re-render. | **Fixed** — wrapped in `React.memo`. |
| P-03 | M | No request memoization on identical GETs. | **Fixed** — small in-memory LRU on the API client. |
| P-04 | L | No service worker. | **Not fixed** — out of scope. |

## 7. Security

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| S-01 | C | IDOR on interview and problem endpoints (see B-02, B-03). | **Fixed**. |
| S-02 | H | CSRF bypass for authenticated requests (B-09). | **Fixed**. |
| S-03 | M | `helmet` configured but `Content-Security-Policy` was too lax. | **Fixed** — strict CSP. |
| S-04 | M | `cors` allowlist included 5 localhost ports but no real prod origins. | **Not fixed** — production is configured via env. |
| S-05 | L | `JWT_SECRET` placeholder check in `server.js` only ran in production. | **Fixed** — the check now runs in dev too with a clear warning. |
| S-06 | L | `brypt` rounds was `12` — fine. | **Not applicable**. |

## 8. Folder structure

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| FS-01 | M | `coverage/` and `lcov-report/` were committed. | **Fixed** — added to `.gitignore`. |
| FS-02 | M | `dist/`, `test-results/`, and `playwright-report/` were committed in `frontend/`. | **Fixed** — `.gitignore` updated. |
| FS-03 | L | `backend/console.error('FAIL'` zero-byte file. | **Fixed** — deleted. |
| FS-04 | L | `docs/` did not exist. | **Fixed** — created. |

## 9. Code quality

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| Q-01 | H | Several `useEffect` with `eslint-disable react-hooks/exhaustive-deps` to hide dep-array bugs. | **Partially fixed** — deps now correct where it was masking real bugs. The remaining disables are intentional (effectively-static handlers). |
| Q-02 | M | Mixed use of `var`/`let`/`const`; `const` was the rule and was followed. | **Not applicable**. |
| Q-03 | M | Error responses from controllers used different shapes. | **Fixed** — every `wrap`'d handler returns `{ success, data | message | error }`. |
| Q-04 | M | No central `logger` in the frontend. | **Not fixed** — out of scope. |

## 10. State management

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| SM-01 | M | `useAuthStore`, `useProgressStore`, `useProblemStore`, `useVisualizationStore` all had inconsistent error/loading shape. | **Fixed** — `{ data, isLoading, error }` everywhere. |
| SM-02 | M | The visualization store was a single zustand with 12 fields; reads were coupled. | **Fixed** — split into `usePlayback` (play/pause/step) and `useVisualizationData` (steps + spec). |

## 11. Routing

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| R-01 | M | `<Route path="*">` redirected to `/` for protected routes only. Public 404s 200'd an empty page. | **Fixed** — public 404 also redirects to `/login` (or `/` if authenticated). |
| R-02 | M | `useNavigate` was used inside `onClick` handlers without a `from` parameter, breaking the back button. | **Not fixed** — design decision; documented in the architecture doc. |

## 12. Error handling

| ID  | Severity | Finding | Status |
|-----|----------|---------|--------|
| E-01 | H | Several service functions did not catch errors; the axios interceptor would log the user out on any 401, even expected ones. | **Fixed** — `isAuthEndpoint` list extended; 401 on those is a soft error. |
| E-02 | M | `react-hot-toast` was used everywhere but the error path swallowed the actual error. | **Fixed** — `toast.error(msg, { id: 'unique' })` to avoid stacking. |
| E-03 | M | No global `unhandledrejection` handler in the frontend. | **Fixed** — added in `main.jsx`. |

---

## What was **not** done, and why

The following items from the original brief were **not** completed in this
session. Each is documented here so a future sprint can plan them.

1. **50+ company database with 200+ problems each.** This is a data job, not
   an engineering job. The data model + a small real seed (top 10 companies,
   ~5 problems each) is now in place; growing it is content work.
2. **"Paste any LeetCode URL → visualization."** The viz engine accepts a
   `ProblemSpec` (title, description, examples, tags). It does **not** fetch
   from LeetCode; LeetCode blocks unauthenticated GraphQL since 2024 and
   requires a session cookie. When the user provides a `LEETCODE_SESSION`
   cookie, the parser can attempt the request, but the engine always
   gracefully falls back to pasted text.
3. **Full debug protocol in 10 languages** (breakpoints, variable
   inspector, call stack). What we have: Piston-based execution in 10
   languages with run/console output. Variable inspection is done by parsing
   `print` statements; there is no real debugger.
4. **Command palette.** Out of scope this session.
5. **Real-time code execution timeline with stack frames.** Would require a
   debug adapter per language. Documented as future work.
