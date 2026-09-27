# Architecture

Status: **APPROVED** (Session 2). Foundation + resource discovery implemented. **Scope refined in Session 3, nav + types applied in Session 4: see §12.** Versions: Next.js 16.3, React 19.2, Tailwind 4, TypeScript 5.

> Next.js 16 differs from older versions. Before writing Next-specific code read `AGENTS.md` and `node_modules/next/dist/docs/`.

## 1. Starting point

The project folder was empty at Session 1. No framework, no git repo, no code. This is a greenfield build.

## 2. Proposed stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Matches the `NEXT_PUBLIC_*` env convention in the brief. File-based routes. Deploys free on Vercel. |
| Styling | **Tailwind CSS** with tokens in `app/globals.css` (CSS variables) | Fast for a hackathon, tokens stay centralized. |
| Package manager | **npm** | Already on the dev machine. No extra install. |
| State | React state + one `CampusContext` | Enough for the demo. No Redux/Zustand. |
| Data fetching | Plain `async` service functions, called from client components with `hooks/useAsync.ts` | Keeps UI independent of mock vs API. Handles loading / error / retry. |
| Icons | `lucide-react` | Small, accessible SVG icons. |
| Backend | **None coupled.** Firebase or anything else sits behind `services/`. | Brief requirement. |

## 3. Layering (the most important rule)

```
UI component (app/, components/)
      ↓  calls
Service (services/*.ts)          ← the ONLY integration boundary
      ↓  picks data source from config.dataMode
 ┌───────────────┬──────────────────┐
 mock source      api source
 (data/mock/*)    (services/api/client.ts → fetch NEXT_PUBLIC_API_URL)
                        ↓
                  normalizers (services/api/normalize.ts)
                        ↓
                  frontend model (types/models.ts)
```

Rules:
- Components **never** import from `data/mock/` or call `fetch`/Firebase directly.
- Components import types from `types/` and functions from `services/`.
- Every service function returns frontend models from `types/models.ts`, whatever the source.
- If backend field names differ, fix it in `normalize.ts`, never in components.

Example:

```ts
// services/foodDeals.ts
export async function getFoodDeals(query: FoodDealQuery): Promise<Paged<FoodDeal>> {
  if (config.dataMode === "mock") return mockFoodDeals(query);   // local filter
  const raw = await apiGet("/food-deals", query);                 // query → URL params
  return { ...raw, items: raw.items.map(normalizeFoodDeal) };
}
```

## 4. Directory structure

```
East bay LINK/                ← repo root (OneDrive: see DECISIONS Q4)
├── CLAUDE.md                 ← session start/end procedure for Claude
├── .env.example              ← NEXT_PUBLIC_DATA_MODE, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_DEFAULT_CAMPUS
├── app/                      ← routes (Session 2+)
│   ├── layout.tsx            ← CampusProvider, BottomNavigation, DemoBanner
│   ├── page.tsx              ← Home: "What do you need today?"
│   ├── resources/page.tsx
│   ├── food/page.tsx, food/[id]/page.tsx
│   ├── marketplace/page.tsx, marketplace/[id]/page.tsx, marketplace/new/page.tsx
│   ├── housing/page.tsx, housing/[id]/page.tsx
│   ├── community/page.tsx
│   ├── safety/page.tsx
│   └── profile/page.tsx
├── components/
│   ├── layout/               ← BottomNavigation, TopBar, CampusSelector, DemoBanner
│   ├── ui/                   ← Card, Badge (Verified, Demo), Button, SearchBar, FilterBar, EmptyState
│   └── cards/                ← ResourceCard, FoodDealCard, MarketplaceCard, HousingCard, PostCard, EventCard, GroupCard
├── config/
│   ├── app.ts                ← dataMode, apiUrl, campuses, needs, feature flags, APP_NAME   ✅
│   └── labels.ts             ← student-facing labels for enum values   ✅
├── context/
│   └── CampusContext.tsx     ← currentCampus + setter, localStorage via useSyncExternalStore (hydration-safe)   ✅
├── hooks/
│   └── useAsync.ts           ← { data, loading, error, reload } for any service call   ✅
├── lib/
│   └── format.ts             ← money, distance, time formatting   ✅
├── data/
│   └── mock/                 ← resources.ts, foodDeals.ts, listings.ts, housing.ts, community.ts
├── services/
│   ├── resources.ts ✅, user.ts ✅   (foodDeals, marketplace, housing, community: later)
│   ├── mock.ts               ← mockDelay(), NotFoundError   ✅
│   ├── query.ts              ← applyPaging(), matchesText(), toSearchParams()   ✅
│   └── api/client.ts ✅, api/normalize.ts ✅
├── types/
│   └── models.ts             ← every model from DATA_CONTRACT.md   ✅ created
├── docs/                     ← this documentation system   ✅ created
└── public/                   ← static images (placeholder item photos only)
```

Items marked ✅ exist. Food, marketplace, community, housing routes currently render a `ComingSoon` placeholder so navigation never 404s.

## 5. Mock/API switching

Centralized in `config/app.ts`:

```
NEXT_PUBLIC_DATA_MODE=mock | api     (default mock)
NEXT_PUBLIC_API_URL=                 (empty in mock mode)
NEXT_PUBLIC_DEFAULT_CAMPUS=chabot
```

Switching to the backend = set two env vars + implement the `api` branch in each service. No component changes.

Mock services simulate latency (~250 ms) so loading states get built and tested now.

## 6. Campus architecture

- `config/app.ts` holds `SUPPORTED_CAMPUSES` (id, name, shortName, city, approximate center coordinates).
- `CampusContext` exposes `currentCampus`. Every list query includes `campusId`.
- Adding a 4th campus: add one entry to `SUPPORTED_CAMPUSES` + its mock data. No page changes.
- Later, campuses can come from `GET /campuses` instead of config.

## 7. Filtering

One shape for every list, defined in `types/models.ts` as `ListQuery` and feature-specific extensions (`ResourceQuery`, `FoodDealQuery`, etc.).

- Mock mode: `applyQuery(items, query)` filters locally.
- API mode: `toSearchParams(query)` turns the same object into `?campusId=chabot&category=food&q=...`.
- Filter state lives in the URL search params where practical, so filtered views are shareable and back-button safe.

## 8. Needs vs. categories

Home shows **needs** (student language). Each need maps to one or more **resource categories** plus a feature route. The map lives in `config/app.ts` (`NEEDS`). Example: need `food` → resource categories `food` + link to `/food` deals.

## 9. Privacy architecture

- Distance is **approximate, from campus**, computed server-side (or from mock data). The app does not request the user's GPS in the MVP.
- Housing shows **area/neighborhood only**, never a street address.
- No phone numbers or emails in any public model. Contact happens through a `ContactRequest` (mocked in MVP).
- `UserProfile` public view exposes display name, campus, verified flag. Nothing else.
- Features needing extra review are listed in FEATURES.md under "Privacy review".

## 10. Accessibility and design baseline

- Mobile-first, max content width ~640px, bottom nav on mobile.
- Semantic HTML (`nav`, `main`, `button`, `a`), labels on all inputs, visible focus rings.
- Minimum 16px body text, 44px tap targets, WCAG AA contrast.
- Light theme first. Dark mode is deferred.
- No decorative animation.

## 11. Testing and checks (per session end)

- `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Click through every route in the bottom nav on a phone-width viewport.
- Check browser console for errors.

## 12. Refined MVP: architecture impact (Session 3, D13)

The layering rules (§3) do not change. What changes:

### 12.1 Three pillars as modules

```
                         ┌──────────── PROFILE / REPUTATION ────────────┐
                         │ services/profiles.ts   services/reputation.ts │
                         └───────▲─────────────────────────────▲─────────┘
                                 │ author, contributions        │ listings
 ACADEMIC EXCHANGE               │                              │           BASIC NEEDS
 services/courses.ts ────────────┘                              └──────── services/housing.ts
 services/academic.ts                                                      services/foodDeals.ts
 services/reports.ts (shared) ◄──────── report ────────────────────────── services/resources.ts (built)
```

Every pillar follows the same path: `types` → `data/mock` → `services` → `components/cards` → `app/` route.

Planned new files (created only when each feature is built):

| Layer | Academic | Profile | Food | Housing | Shared |
|---|---|---|---|---|---|
| types | `types/academic.ts` ✅ | `types/profile.ts` ✅ | (in models.ts) | (in models.ts) | `types/models.ts` re-exports all ✅ |
| mock | `data/mock/courses.ts` ✅, `academicResources.ts`, `academicTips.ts` | `data/mock/users.ts` ✅ | `foodDeals.ts`, `businesses.ts` | `housingPosts.ts` | – |
| service | `courses.ts` ✅, `academic.ts` | `profiles.ts` ✅, `reputation.ts` ✅ | `foodDeals.ts` | `housing.ts` | `reports.ts`, `helpful.ts` |
| config | – | `config/reputation.ts` ✅, `config/tags.ts` ✅ | – | – | `config/app.ts` NAV_ITEMS ✅, DISCOVER_SECTIONS ✅ |
| cards | `CourseCard`, `AcademicResourceCard`, `TipCard`, `AttachmentList` | `components/profile/*` ✅ (ProfileView, ProfileParts, OfferingList, ContributionGraph); `AuthorChip` next | `FoodDealCard` | `HousingCard` | `ReportButton`, `HelpfulButton` |

✅ = exists (Session 4). Import paths did not change: everything still comes from `@/types/models`.

### 12.2 First write operations (mock)

Until now every service was read-only. Academic Exchange needs create, helpful toggle, and report.

- Mock data becomes a small **in-memory store** per module (arrays in `data/mock/*`, mutated only by services).
- `mockDelay` already clones return values, so UI can't mutate the store by accident.
- New posts live until page reload. Good enough for a demo. (Optional later: persist mock writes in localStorage with try/catch.)
- Services return the updated object so the UI updates without refetching everything.

### 12.3 Identity matters now

Authorship, helpful votes, and "my contributions" need a current user.
- All services get the actor from `services/user.ts` (`getCurrentUser()`), never from components.
- Mock user stays until auth is decided (Q6). Backend must derive the actor from the auth token, never from a request body `userId`.

### 12.4 Reputation is computed, never trusted from the client

- Rules (points, level thresholds, badges) live in `config/reputation.ts` for mock mode.
- `services/reputation.ts` computes points/level/badges from contributions + helpful votes in mock mode.
- In API mode the backend computes and returns them. Components only display.

### 12.5 User-generated content safety

- `ModerationStatus` (`pending` / `approved` / `hidden` / `removed`) on AcademicResource and AcademicTip + `ContentReport`.
- Attachments: mock shows file name, type, size, "Demo file" label, no real download. Real uploads go through backend `POST /uploads` (type/size limits, scan) before `approved`.
- Post bodies render as **plain text** in MVP (whitespace preserved). If Markdown is added later, use a renderer with raw HTML disabled (XSS).
- External links open with `rel="noopener noreferrer"` and show the domain.
- Contribute form shows the integrity rules and requires a checkbox.

### 12.6 Routing

- Nested dynamic routes: `app/academic/[courseId]/page.tsx`, `app/academic/[courseId]/[postId]/page.tsx`, with `app/academic/[courseId]/layout.tsx` for the course header.
- Next 16: `params` is a Promise in server pages. Client pages use `useParams()`. Follow `node_modules/next/dist/docs/` before writing these.
- Course IDs are campus-scoped slugs (`chabot-mth-1`). When the campus changes and the open course belongs to another campus, redirect to `/academic`.

### 12.7 Navigation as config ✅

`NAV_ITEMS` (tabs + `match` prefixes) and `DISCOVER_SECTIONS` live in `config/app.ts`. `BottomNavigation` and `/discover` render from config. A tab can "own" several top-level routes, so Discover covers `/food`, `/resources`, `/marketplace`, `/safety` without moving URLs.

### 12.8 Deferred but kept

Marketplace and Community pages and types stay in code (D18). Marketplace is live inside Discover (Session 14, D31). Community is reachable from the Home card.

### 12.9 Visibility settings

User-controlled visibility (`Visibility = "public" | "hidden"`) is a shared type in `types/profile.ts`. Default hidden. Services must filter hidden items out of public profile responses in mock mode. Backend must do the same server-side.

## 13. Academic Exchange architecture (Session 9, D26, D27) · read path built Session 10

### 13.1 Structure
```
Campus → Course → CourseOffering (term, optional instructor) → AcademicResource / AcademicTip
```
Instructor is reached only through CourseOffering. There is no instructor page, instructor list endpoint, or instructor filter in the UI. This keeps instructor names as context and prevents professor-comparison features from growing by accident.

### 13.2 Frontend modules (to build)
| Layer | Files |
|---|---|
| types | `types/academic.ts` ✅ (v0.7) |
| config | `config/academic.ts` ✅ (type/tip/review labels, integrity text). `FEATURES.paidAcademic` ✅ (off) |
| mock | `data/mock/courses.ts` ✅, `data/mock/academic.ts` ✅ (offerings, resources, tips; ids match users + posts) |
| services | `services/academic.ts` ✅ (courses with counts, offerings, resources, resource, openResource, tips, helpful toggles), `services/authors.ts` ✅ (shared author lookup). Next: my submissions, create draft, submit, withdraw, mock review |
| components | `components/academic/` ✅ AcademicParts (AccessBadge, TypeBadge, ReviewBadge, CourseCard, AttachmentList, IntegrityNote), HelpfulButton, ResourceCard, TipCard. Next: SubmissionChecklist |
| routes | ✅ `/academic`, `/academic/[courseId]`, `/academic/[courseId]/[resourceId]`. Next: `/academic/new`, `/academic/mine` |

### 13.3 Review workflow in the frontend
- `ReviewStatus` drives badges on "My submissions": Draft, Submitted, In review, Approved, Needs changes (rejected, with reason), Removed.
- Public lists call services that return approved items only. The UI never filters by status for public views.
- Mock mode: submitting moves a resource to `submitted`, then a mock "system" step moves it to `under-review` → `approved` after a short delay, so the demo shows the flow. Rejection is shown with a pre-seeded rejected draft.
- Reputation (`services/reputation.ts`) counts approved resources/tips and helpful votes only. `accessCount` and sales never count.

### 13.4 Files
- Upload is backend work: `POST /uploads` returns `Attachment` after type/size checks and a scan.
- Lists never include `downloadUrl`. Opening a resource calls `POST /academic-resources/:id/access`, which records access and returns short-lived signed URLs.
- Mock: attachment metadata only, "Demo file" label, no download.

### 13.5 Paid resources (DEFERRED)
- Model supports `access: { model: "paid", priceCents }` and `AcademicAccess.grantType = "purchase"`.
- Frontend shows nothing paid until a feature flag `FEATURES.paidAcademic` is on. It stays off until payments (F11) and legal review are approved (D27).
- `notes` can never be paid (CA Education Code §66450).

### 13.6 Linking
- Community `resolveLinked()` for `academic-resource` gets an `href` of `/academic/[courseId]/[resourceId]` once the detail page exists. That's the only change needed there.
- Profile course tags link to `/academic/[courseId]`.

## 14. Housing (Session 11, D28)
- `config/housing.ts` (areas + distances, amenities, lifestyle preferences, filter options, limits, safety text) → `data/mock/housing.ts` → `services/housing.ts` → `components/housing/*` → `/housing`, `/housing/browse`, `/housing/[postId]`, `/housing/new`.
- `services/housing.ts` owns free-text safety checks (phone/email/street/payment) for posts and requests. Backend must repeat them.
- Profile ↔ Housing: `services/profiles.ts` calls `mockHousingOfferings()` to build housing offerings from posts; toggling `off_housing_<postId>` calls `setHousingProfileVisibility`. One field, two entry points.
- `services/authors.ts` provides author previews for Community, Academic, and Housing.

## 15. Discover architecture (Session 13, D30) · designed, not built

### 15.1 Role
- **Community:** "What is happening around my campus?" (people, conversation, activity)
- **Discover:** "What can I find or use around my campus?" (structured, findable things)
- **Academic** and **Housing** stay their own tabs. Discover does not absorb them.

Discover is a **read-only composition layer**. It owns no records and has no database of its own.

```
                         ┌──────────────── Discover UI ────────────────┐
                         │ /discover home · category cards · search     │
                         └──────────────────────┬───────────────────────┘
                                                │ calls
                                   services/discover.ts  (composition only)
                                                │ fans out to registered sources
        ┌──────────────────┬────────────────────┼───────────────────┬────────────────────┐
  services/food.ts   services/resources.ts  services/opportunities.ts  services/marketplace.ts
  (FoodDeal)         (Resource)             (Opportunity, planned)     (MarketplaceListing, planned)
        │                  │                    │                          │
   data/mock/food     data/mock/resources   data/mock/opportunities    data/mock/listings
   (API: /food-deals) (API: /resources)     (API: /opportunities)      (API: /listings)
```

Rule: **a record lives in exactly one service.** Discover never copies deals, resources, listings, or opportunities into its own store. Links always go to the owning page (`/food/[id]`, `/resources?q=`, `/opportunities/[id]`, `/marketplace/[id]`).

### 15.2 Source adapters
Each category registers a small adapter. Adding a category = add one adapter + one config line.

```ts
// types/discover.ts (planned)
interface DiscoverSource {
  id: "food" | "resources" | "opportunities" | "marketplace";
  label: string;
  /** Count for the home card, e.g. "5 deals near Chabot". Uses the owner service with pageSize 1. */
  count(campusId): Promise<number>;
  /** Top hits for a query, mapped to a common display shape. Uses the owner service's own q filter. */
  search(q, campusId, limit): Promise<{ total: number; hits: DiscoverHit[] }>;
}
interface DiscoverHit {
  sourceId: DiscoverSource["id"];
  id: string;
  title: string;
  subtitle?: string;      // "Demo Noodle House · Today 2–5 PM", "Chabot Basic Needs"
  badge?: string;         // "Free", "Open now", "Deadline Nov 15" (no prices on Discover home)
  href: string;           // owner page
}
interface DiscoverResultGroup { sourceId; label; total; hits: DiscoverHit[]; seeAllHref }
```

`services/discover.ts` only does: call adapters in parallel, catch per-source errors (one failing source never blanks the page), and return groups in a fixed order.

### 15.3 Search (MVP = federated, grouped)
- One search box on `/discover` (`?q=`). Query fans out to each live source's **existing** list endpoint with `q` + `campusId`.
- Results are **grouped by category**, not merged into one ranked list. Relevance scores from different sources aren't comparable, and grouping keeps "free help" visible next to deals.
- Group order is fixed by need: Resources (free help) → Food deals → Opportunities → Marketplace. Empty groups are hidden. "See all" goes to the category page with the same `q`.
- Example: "food" → Resources (pantry, CalFresh, food bank) + Food deals. "calculator" → Marketplace listing (once Marketplace exists).
- Out of scope for MVP: typo tolerance, synonyms beyond a tiny config map, cross-tab search (Academic, Housing, Community), personalization, a global search index.
- Later (backend): optional `GET /discover/search?q=&campusId=` that fans out server-side or queries a search index. The UI does not change because it already consumes `DiscoverResultGroup[]`.

**Known gap:** `FoodDealQuery` inherits `q` from `ListQuery`, but `services/food.ts` ignores it today. It must match `q` against title, restaurant, cuisine, and dietary tags before the food adapter ships.

### 15.4 Discover home (not a shop)
- Search box + 4 category cards (icon, one-line purpose, live count or "Later"). Counts come from adapters.
- Optional single "Open now near you" row: at most 2 items (e.g. a food deal open now, a resource open today). No carousels, no "trending", no promoted items.
- No prices on the home screen. No product-image grids. No ads.
- Campus-aware: every adapter call passes `currentCampus.id`. Resources include regional records via `servesCampusIds`.

### 15.5 Category plans
| Category | Owner service | Status | Notes |
|---|---|---|---|
| Food | `services/food.ts` + food resources | LIVE | needs `q` support for search |
| Resources | `services/resources.ts` | LIVE | already supports `q` |
| Opportunities | `services/opportunities.ts` (planned) | reuses `Opportunity` type + `data/mock/opportunities.ts` already used by Community links | list + detail, filters by kind/deadline. Posted by verified faculty/staff/orgs, students can suggest (reviewed) |
| Marketplace | `services/marketplace.ts` | LIVE (Session 14, §16) | student-to-student, list layout (not grid), request-to-connect (ContactRequest), no payments, campus-scoped, categories from `config/marketplace.ts` `LISTING_CATEGORIES`. Already supports `q` |

### 15.6 Not Discover
Academic resources, housing posts, community posts, and people are not Discover sources. Later we may show a single "Also in Academic: 2 study guides" hint row, still using those services, not copies.

## 16. Marketplace (Session 14, D31)

### 16.1 Layers
```
app/marketplace/page.tsx → MarketplaceBrowse.tsx ┐
app/marketplace/[listingId]/page.tsx             ├─ services/marketplace.ts ─┬─ mock: data/mock/marketplace.ts (in-memory)
app/marketplace/new/NewListingForm.tsx           ┘                           └─ api: /listings, /contact-requests
components/marketplace/ListingCard.tsx (ListingCard, ListingThumb, MarketplaceSafetyNotice)
components/safety/UserSafetyActions.tsx → services/blocks.ts + services/reports.ts
services/profiles.ts → mockMarketplaceOfferings() (profile offerings, off_listing_<id>)
```
Config: `config/marketplace.ts` (categories, conditions, price filter, limits, redirect/prohibited rules, copy). Shared text checks: `lib/textSafety.ts` (also used by Housing now).

### 16.2 Flow
Discover → Marketplace → search/filter → listing → seller profile (`/profile/[userId]`, shows opted-in listings, report/block) → request to connect. Create: Marketplace → List item → `/marketplace/[id]?posted=1`.

### 16.3 Two status fields
`status` belongs to the seller (active → pending → sold). `moderationStatus` belongs to moderators (visible → under-review → removed). Lists need both to be "open": status active/pending and moderation visible.

### 16.4 Blocks
`services/blocks.ts` is the single block list. `services/community.ts` delegates to it and filters with `isBlockedMock`. Marketplace filters sellers the same way. In api mode the backend filters.

### 16.5 Photos
The service takes `File[]`. Mock mode validates type/size/count and uses `URL.createObjectURL` for a session-only preview. Api mode needs the upload endpoint and refuses photos until it exists. Demo listings have no photos on purpose.

## 17. Contribution system (Session 15, D32)

```
Academic helpful toggle ──┐                       config/reputation.ts (weights, caps, badges, live metrics)
Community helpful toggle ─┼─► services/contributions.ts ──events──► services/reputation.ts (pure) ──► services/profiles.ts ──► Profile UI
(review flow, later) ─────┘   (ledger; seeded from mock records)                                 └──► services/authors.ts (level on PublicUser)
```
- The ledger is the single source. `data/mock/users.ts` no longer holds stats or history.
- Other services call `recordHelpfulVote`, `revokeHelpfulVote`, `recordApproval`, `revokeEventsForSource`. Components never call the ledger.
- `services/reputation.ts` is pure: `computeStats`, `computePoints`, `computeBadges` (replays events for `earnedAt`), `computeReputation`, `computeActivity`, `computeHistory`. Unit-testable without the UI.
- Profile components read `LIVE_PROFILE_STATS` and `BADGE_DISCLAIMER` from config and render numbers they are given. No math.
- API mode: the backend owns the ledger and returns computed profiles. `services/contributions.ts` is not used.

## 18. Auth, route gate, onboarding (Session 16, D33)

```
/welcome /login /signup /forgot-password /privacy   ── public, full width, no tabs
/verify-email /onboarding                            ── focused layout, needs a session
everything else                                      ── top bar + tabs, needs verified + onboarded

app/layout.tsx → CampusProvider → components/layout/AppShell.tsx
AppShell: route kind (config PUBLIC_ROUTES / AUTH_FLOW_ROUTES) + useSession() → chrome + redirect to nextStepFor(session)
pages → services/auth/index.ts ─┬─ demo:    demoAuth.ts (browser-simulated accounts, no passwords) + setMockCurrentUser()
                                └─ backend: backendAuth.ts → authAdapter.ts (/auth/* or provider SDK, Q6)
(implementation picked by AUTH_MODE, see §21)
```
- `useSession()` (hooks/useSession.ts) uses useSyncExternalStore. Server snapshot is "unknown", so gated pages render a loading state until the client knows the session. No hydration mismatch.
- Mock identity: `CURRENT_USER_ID` in `data/mock/users.ts` is now a live `let` binding. `services/auth/demoAuth.ts` registers the signed-in account as a mock user and sets it before any page renders, so every existing service (profile, marketplace ownership, contributions) works for new accounts without changes.
- Passwords exist only in the form's state for the duration of the call, then are cleared.
- The gate is UX. Real protection is the backend.

## 19. Review lifecycle + demo stand-ins (Session 17, D34)
- Academic uploads use the real lifecycle: `submitAcademicResource` → `submitted` (Pending review) → `moderateResourceDemo` (mock only) → `approved`/`rejected`, with `ReviewEvent` history and `recordApproval` for credit. In api mode the moderator acts from their own account.
- Every demo stand-in is mock-only, labeled "Demo" in the UI, and throws in api mode: moderator approve/reject, housing "simulate accepting", email "simulate opening the link", demo student sign-in.
- Helpful answer: `services/community.setHelpfulAnswer` → `services/contributions.recordHelpfulAnswer` (one per question, moves on change). Points from `CONTRIBUTION_RULES`.
- Marketplace reports go through `services/marketplace.reportListing` (records the report, flags NEEDS_REVIEW). Moderation decisions are separate from `reportCount`.

## 20. Responsive shell + course membership (Session 18, D35)
- `components/layout/AppShell.tsx` picks chrome per route. App routes: phone top bar (hidden ≥ lg) + one `BottomNavigation` that is bottom tabs on phones and a 16rem left sidebar on lg. Main width: `max-w-3xl` for most pages, `max-w-6xl` for feed-style routes (`/`, `/discover`).
- Home composes feed (main column) + shortcuts/needs/resources (`aside`, sticky on desktop). Same data, different arrangement per breakpoint.
- Courses: `services/courses.ts` owns terms, section search, and membership (`getMyCourses`, `addUserCourse`, `removeUserCourse`). Mock keeps the profile's `academic` lists as the source and stores the chosen section beside it, so Profile, Academic, and Add Course always agree.

## 21. Backend integration readiness (Session 22, D39)

```
UI (app/, components/)
  ↓  only calls services, reads config flags
services/<domain>.ts ──┬── mock path: data/mock/*            (DATA_MODE=mock)
                       └── backend path: services/api/client.ts → backend
                                         ↓
                                   services/api/normalize.ts (backend shape → frontend model)
services/auth/index.ts ─┬── demoAuth.ts                        (AUTH_MODE=demo)
                        └── backendAuth.ts → authAdapter.ts     (AUTH_MODE=backend)
```
- Two switches in `config/app.ts`: `DATA_MODE` (mock | api) and `AUTH_MODE` (demo | backend). They are separate so auth can be connected first while data stays on mock.
- Screens never compare mode strings. They read `SHOW_DEMO_AUTH_CONTROLS` and `SHOW_DEMO_DATA_CONTROLS`, so every demo-only button disappears together when the real backend is on.
- The mode check lives inside each service function (`if (DATA_MODE === "api")`) rather than in separate mock/backend files per domain. It keeps both paths side by side in one small file, which the team preferred during the hackathon. Auth is split into files because it is the first thing the teammate replaces.
- Adapters: `normalizeResource`, `normalizeProfile`, `normalizeActivity`, and the course set (`normalizeCourse`, `normalizeTerm`, `normalizeSection`, `normalizeSectionSearch`, `normalizeUserCourse`). Other domains still cast the backend JSON directly; add an adapter when the real shape is known. Adapters default to the least-trusted value (unverified, not official, not demo in backend auth).
- Errors: services throw typed validation errors (shown as written) or `ApiError` (never shown). Screens show a generic message for anything that is not a validation error, so backend error text never reaches users.
- Empty data: a backend that returns zero records shows the page's empty state. No service falls back to mock data in api mode.
- Tested with a local fake backend (scratch test, not shipped): signed-in session, zero records, 500 errors with internal text in the body, and the sign-in flow.
