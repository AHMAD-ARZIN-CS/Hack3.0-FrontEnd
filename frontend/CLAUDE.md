@AGENTS.md

# CLAUDE.md · East Bay Link

Hackathon frontend for East Bay college students (Chabot, DVC, CSUEB). Mock data first, backend later through a service layer.
Refined MVP (D13, D18–D23): Academic Exchange + Basic Needs (Housing, Food) + shared Profile/Reputation. Tabs: Home/Community · Academic · Discover · Housing · Profile.

## Session start (every time)
1. Read this file.
2. Read `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.
3. Read the **last** entry of `docs/SESSION_LOG.md`.
4. `git status`, then look at the code relevant to today's task.
5. Report: CURRENT STATE · WHAT WORKS · WHAT WE WERE DOING · NEXT RECOMMENDED STEP.

## Hard rules
- Components never import `data/mock/*` or call fetch/Firebase. Only `services/*`.
- Every service returns models from `types/models.ts`. Backend shape differences go in `services/api/normalize.ts`.
- Config (data mode, API URL, campuses, needs, flags) only in `config/app.ts`.
- Every campus-scoped record has `campusId`. No per-campus pages.
- Money = integer cents. Dates = ISO UTC strings.
- No phone/email/street address for students anywhere. Housing = area only.
- Mock records carry `isDemo: true` and show a Demo tag. No fake stats, no fake "partner" restaurants.
- Copy: "discover / connect / find". Never "guarantee / solve / eliminate / safe".
- Don't reverse a decision in `docs/DECISIONS.md` silently.
- Ask before decisions on scope, privacy, contract, navigation, housing, payments, auth, user roles.
- Don't delete teammates' work.
- Academic content: original student material only. No leaked exams, answer keys, unauthorized instructor material, textbook PDFs. Instructor names allowed only as context (CourseOffering). Never build professor ratings/rankings. Render text as plain text.
- Reputation is computed in services/backend, never in components. Content can be marked helpful. People are never rated.
- Profile visibility settings default to hidden (housing status).
- Nav + Discover sections live in `config/app.ts` (NAV_ITEMS, DISCOVER_SECTIONS). Keep deferred Marketplace code.
- Auth (D33, D39): only `services/auth/` touches auth. Real login goes in `services/auth/backendAuth.ts`, response mapping in `authAdapter.ts`. Never store, log, or mock passwords. Authenticated ≠ student verified ≠ faculty/staff verified. Sign-up is students only. Public routes in `config/app.ts`.
- Community (D25): campus feed, never auto-post listings, faculty/org posts are not official statements, roleVerified never from email alone, post types in `config/community.ts`.

## Session end
1. `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. Click through nav at phone width. Check console.
3. Update FEATURES.md, DATA_CONTRACT.md/BACKEND_HANDOFF.md if contracts changed.
4. **Append** to `docs/SESSION_LOG.md` (never overwrite).
5. State what is unfinished. Never claim untested things work.

## Commands
- `npm run dev` → http://localhost:3000
- `npm run build`, `npm run lint`, `npm run typecheck`
- First time on a new machine: `npm install`, then copy `.env.example` to `.env.local`

## Where things are
- Add a campus: `config/app.ts` SUPPORTED_CAMPUSES + mock data. No page changes.
- Change app name: `config/app.ts` APP_NAME.
- Add a feature: model in `types/<domain>.ts` (re-exported by `types/models.ts`) + contract doc → mock in `data/mock/` → service in `services/` → cards in `components/cards/` → page in `app/`.
