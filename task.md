# GreenCoin — build tracker

## Design
- Deep forest green + cream/off-white, editorial typography, big nature imagery, airy whitespace (from solar inspiration img).
- Font: Fraunces (display) + Inter-ish... use Poppins? -> Display: "Fraunces", Body: "DM Sans". Coin accent: gold (#C9A24B).
- Mobile-first, visible balance everywhere, celebratory redeem/return moments.

## Stack: managed (React+Hono+Drizzle). Auth: Better Auth email/pw + roles.

## DONE
- [x] app_init
- [x] env: GROQ_API_KEY added
- [x] installs: better-auth, groq-sdk
- [x] auth.ts (+roles, additional fields)
- [x] auth-schema generated, app schema (returns, ledger, rewards, redemptions, flags)
- [x] db:push
- [x] middleware/auth.ts (authMiddleware, requireAuth, requireAdmin)
- [x] lib/coins.ts (rules, balance, appendLedger, getLedger)
- [x] lib/groq.ts (chatHelper, categorize, anomalyCheck)
- [x] routes/returns.ts

## TODO backend
- [ ] routes/rewards.ts (list, redeem -> ledger redeem + redemption + code)
- [ ] routes/leaderboard.ts (week/month/all, my rank)
- [ ] routes/admin.ts (review queue, approve/reject/adjust -> ledger earn, rewards CRUD, flags, reports)
- [ ] routes/ai.ts (chat, categorize)
- [ ] wire all into api/index.ts (auth mount + basePath + routes), add ctx types Variables
- [ ] seed script: ~10 families, returns(approved) ledger, rewards (electronics+clothing w/ images), admin user

## Rewards images
- [ ] generate/source electronics + clothing product images -> upload to R2 or public/

## TODO frontend
- [ ] provider.tsx: react-query
- [ ] lib/auth.ts, lib/api.ts
- [ ] design.md
- [ ] styles.css fonts/vars
- [ ] pages: sign-in/up, home dashboard, log-return, wallet, leaderboard, redeem, history, helper(AI), admin (review/rewards/users/reports)
- [ ] layout + bottom nav (mobile-first) + protected routes
- [ ] landing/welcome page at /

## Demo creds: admin@greencoin.app / ... ; resident demo
## FINAL: bun run build, start on 4200, deliver

## DONE (final)
- app.tsx wired all routes (/, /sign-in, /sign-up, /app/* via /app/:rest* + AppShell + ProtectedRoute).
- Fixed FE type errors: narrowed all queryFn/mutationFn with res.ok guard; api.ts headers typed Record<string,string>.
- Added @hono/zod-validator; zValidator on admin review + rewards patch routes (fixes RPC json typing).
- Fixed SQLite "no such column: score" in leaderboard + admin reports (order by full SUM expr, not alias).
- Moved Google Fonts @import above tailwind import (CSS warning gone).
- bun run build PASSES. Backend+frontend tsc clean.
- Re-seeded clean demo data. Smoke-tested ALL flows via API + Playwright: login, summary, leaderboard, returns, ledger, rewards, AI categorize+chat (Groq live), admin approve (+coins→ledger), reports, redeem (code+balance). Zero console errors on all public + protected + admin pages.
- Dev server running tmux session 'dev' on :4200.
