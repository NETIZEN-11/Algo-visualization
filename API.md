# AlgoVision AI — API Reference

The HTTP API is documented in machine-readable form at
`backend/docs/openapi.json`. This file is a human-friendly summary.

- All endpoints are JSON over HTTPS.
- Authenticated endpoints expect an access token (15m JWT). The token
  is set as a non-httpOnly cookie and can also be sent via the
  `Authorization: Bearer <token>` header for non-browser clients.
- Refresh tokens are httpOnly cookies rotated on every use; replay
  triggers family revocation.
- State-changing verbs (POST/PUT/PATCH/DELETE) require the
  `X-XSRF-TOKEN` header echoing the `XSRF-TOKEN` cookie.

## Quick start

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"Tr0ub4dor&3xK!ngZ"}'

# Login (sets refresh cookie)
curl -X POST http://localhost:5000/api/auth/login \
  -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"Tr0ub4dor&3xK!ngZ"}'

# Fetch profile (uses cookie + access token)
curl http://localhost:5000/api/auth/profile -b cookies.txt
```

## Routes

| Method | Path                                 | Auth | Description                       |
| ------ | ------------------------------------ | ---- | --------------------------------- |
| GET    | `/health/live`                       | no   | Liveness                          |
| GET    | `/health/ready`                      | no   | Readiness (checks Mongo+Redis)    |
| GET    | `/metrics`                           | no   | Prometheus metrics                |
| GET    | `/api/docs`                          | no   | OpenAPI spec                      |
| POST   | `/api/auth/register`                 | no   | Create account                    |
| POST   | `/api/auth/login`                    | no   | Issue access + refresh            |
| POST   | `/api/auth/refresh`                  | yes  | Rotate refresh token              |
| POST   | `/api/auth/logout`                   | yes  | Revoke this refresh               |
| POST   | `/api/auth/logout-all`               | yes  | Revoke every refresh              |
| POST   | `/api/auth/forgot-password`          | no   | Email reset link                  |
| POST   | `/api/auth/reset-password?token=…`   | no   | Set new password                  |
| GET    | `/api/auth/verify-email?token=…`     | no   | Verify email                      |
| POST   | `/api/auth/resend-verification`      | yes  | Re-send verification email        |
| GET    | `/api/auth/profile`                  | yes  | Get current user                  |
| PUT    | `/api/auth/profile`                  | yes  | Update profile                    |
| POST   | `/api/auth/change-password`          | yes  | Change password                   |
| DELETE | `/api/auth/account`                  | yes  | Delete account (cascades)         |
| GET    | `/api/problems`                      | yes  | List/search problems              |
| GET    | `/api/problems/:id`                  | yes  | Get a problem                     |
| POST   | `/api/problems/analyze`              | yes  | AI problem analysis               |
| POST   | `/api/problems/:id/solve`            | yes  | Mark as solved                    |
| GET    | `/api/problems/related/:id`          | yes  | Related problems                  |
| GET    | `/api/problems/test-cases/:id`       | yes  | Structured test cases             |
| GET    | `/api/companies`                     | yes  | Company-tagged problems           |
| GET    | `/api/interview`                     | yes  | List interviews                   |
| POST   | `/api/interview/start`               | yes  | Start a new interview             |
| POST   | `/api/interview/:id/answer`          | yes  | Submit an answer                  |
| POST   | `/api/interview/:id/end`             | yes  | End the interview                 |
| GET    | `/api/interview/stats`               | yes  | Aggregate stats                   |
| GET    | `/api/flashcards`                    | yes  | List flashcards                   |
| POST   | `/api/flashcards`                    | yes  | Create flashcard                  |
| POST   | `/api/flashcards/:id/review`         | yes  | SM-2 review                      |
| GET    | `/api/notes`                         | yes  | List notes                        |
| POST   | `/api/notes`                         | yes  | Create note                       |
| PUT    | `/api/notes/:id`                     | yes  | Update note                       |
| DELETE | `/api/notes/:id`                     | yes  | Delete note                       |
| POST   | `/api/notes/:id/pin`                 | yes  | Toggle pin                        |
| GET    | `/api/roadmap`                       | yes  | Get user roadmap                  |
| PUT    | `/api/roadmap/progress`              | yes  | Update progress                   |
| GET    | `/api/contest`                       | yes  | List contests                     |
| GET    | `/api/contest/:id`                   | yes  | Get a contest                     |
| POST   | `/api/contest/:id/register`          | yes  | Register for contest              |
| POST   | `/api/contest/:id/submit`            | yes  | Submit solution                   |
| POST   | `/api/playground/execute`            | yes  | Run code via Piston               |
| POST   | `/api/submissions`                   | yes  | Record a submission               |
| GET    | `/api/submissions`                   | yes  | List user's submissions           |
| GET    | `/api/progress`                      | yes  | Aggregate progress                |
| GET    | `/api/progress/recommendations`      | yes  | AI-driven recommendations        |
| GET    | `/api/progress/activity`             | yes  | Recent activity feed              |
| GET    | `/api/gamification/leaderboard`      | yes  | Top users                         |
| GET    | `/api/gamification/badges`           | yes  | Badges catalogue                  |
| GET    | `/api/gamification/daily-challenge`  | yes  | Today's challenge                 |
| POST   | `/api/gamification/daily-challenge/complete` | yes | Mark complete           |
| GET    | `/api/ai/usage`                      | yes  | User's AI token usage             |
| GET    | `/api/admin/users`                   | admin| List users                        |
| PUT    | `/api/admin/users/:id/role`          | admin| Update role                       |
| GET    | `/api/admin/stats`                   | admin| Platform stats                    |
| POST   | `/api/admin/badges/award`            | admin| Award a badge                     |

## Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [{ "field": "email" }]
  }
}
```

| Status | Code                  | When                                           |
| ------ | --------------------- | ---------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | express-validator chain failed                 |
| 401    | `UNAUTHENTICATED`     | missing / invalid token                        |
| 403    | `FORBIDDEN`           | role / ownership / CSRF                        |
| 404    | `NOT_FOUND`           | route or resource not found                    |
| 409    | `CONFLICT`            | e.g. duplicate email                           |
| 422    | `UNPROCESSABLE`       | AI provider rejected the input                 |
| 429    | `RATE_LIMITED`        | too many requests                              |
| 500    | `INTERNAL`            | unexpected — full stack only in dev            |
| 503    | `DEPENDENCY_DOWN`     | Mongo or Redis unreachable                     |
