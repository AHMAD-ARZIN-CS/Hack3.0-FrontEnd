# Routes

Updated Session 4 (DECISIONS D18–D22). Framework: Next.js 16 App Router. `params` / `searchParams` are Promises in server pages. Client pages use `useParams()` / `useSearchParams()`.

## 1. Information architecture (approved, D18)

```
HOME / COMMUNITY  (tab: Home, "/")
├── Need tiles ("What do you need today?", Study help featured)
├── Community entry (prominent card → /community) + 2 latest posts
│     ├── Campus feed        WORKING
│     ├── Questions          WORKING (post type)
│     ├── Opportunities      WORKING (post type + linked Opportunity)
│     ├── Events             WORKING (post type with meeting)
│     └── Study groups       WORKING (post type with meeting)
└── (final UX may turn Home itself into the community feed)

ACADEMIC  (tab: Academic, "/academic")
├── Courses
├── Notes          ┐
├── Study guides   ├─ AcademicResource (kind), may have files
├── (Practice)     ┘
└── Course tips    ── AcademicTip, text

DISCOVER  (tab: Discover, "/discover" + owns /food, /resources, /marketplace, /opportunities, /safety)
├── Search (?q=)         designed: grouped results from each category's own service
├── Food                 live
├── Resources            live
├── Opportunities        designed
└── Marketplace          live: /marketplace, /marketplace/[listingId], /marketplace/new

HOUSING  (tab: Housing, "/housing")
├── Find housing     (housing resources + room-available posts)
├── Find roommate    (looking-for-roommate posts)
└── Post opportunity (/housing/new)

PROFILE  (tab: Profile, "/profile")
├── Identity / campus
├── Courses
├── Interests
├── Contributions
├── Badges
└── User-controlled active offerings (hidden by default)
```

Top bar: app name, campus selector, Safety link (always one tap away).

## 2. Route map

| Route | Tab | Purpose | Status |
|---|---|---|---|
| `/` | Home | Need tiles + Community card + campus resources strip | WORKING |
| `/community` | Home | Campus feed, filters `?type=` `?saved=1` | WORKING |
| `/community/[postId]` | Home | Post + comments, helpful, save, report, block | WORKING |
| `/community/new` | Home | Create post | WORKING |
| `/academic` | Academic | Search, campus courses, recently shared (`?q=`) | WORKING |
| `/academic/[courseId]` | Academic | Course Hub: resources + tips, `?show=` filters, `?sort=newest` | WORKING |
| `/academic/[courseId]/[resourceId]` | Academic | Resource detail: files, open, Helpful, Report, integrity | WORKING |
| `/academic/mine` | Academic | My submissions + review status | PLANNED |
| `/academic/new` | Academic | Contribute. `?type=resource\|tip&courseId=` preselects | PLANNED |
| `/discover` | Discover | Category cards (v1). v2: `?q=` grouped search + live counts | WORKING v1, v2 DESIGNED |
| `/food` | Discover | Free food help first, then deals, filters `?dist=&max=&now=1&diet=` | WORKING |
| `/food/[dealId]` | Discover | Price comparison, pickup window, hold + pickup code, cancel, report | WORKING |
| `/resources` | Discover | All resources, filters in URL | WORKING |
| `/safety` | Discover (also top bar) | Emergency + safety resources | WORKING |
| `/marketplace` | Discover | Browse / Your listings, list rows, `?q=&cat=&cond=&max=&verified=1&mine=1` | WORKING |
| `/marketplace/[listingId]` | Discover | Detail, request to connect, seller controls, report listing, report/block seller. `?posted=1` banner | WORKING |
| `/marketplace/new` | Discover | Create listing with optional photos | WORKING |
| `/opportunities` | Discover | Opportunities list `?q=&kind=` | PLANNED (next after Discover v2) |
| `/opportunities/[opportunityId]` | Discover | Opportunity detail, deadline, official link | PLANNED |
| `/housing` | Housing | Start: I need housing / I have housing, post link, safety, housing help | WORKING |
| `/housing/browse` | Housing | Rooms or people looking, filters `?type=&max=&dist=&avail=&room=&verified=1` | WORKING |
| `/housing/[postId]` | Housing | Detail, owner preview, safety, report, request to connect, owner controls | WORKING |
| `/housing/new` | Housing | Post a room or "need a room", visibility off by default | WORKING |
| `/profile` | Profile | Own profile: campus, courses, interests, contributions, badges, offerings with visibility toggles | WORKING (basic) |
| `/profile/[userId]` | Profile | Public profile: stats, badges, contributions, public offerings only | PLANNED |

## 3. Why these URLs

- **Discover keeps top-level URLs.** `/resources` and `/safety` already work and are linked from Home. The Discover tab is marked active for them via `NAV_ITEMS[].match` in `config/app.ts`. No route moves, no broken links.
- **Resource detail is nested under the course.** `/academic/[courseId]/[resourceId]` keeps course context and a shared course layout. Tips are short and render inline on the course page, so they get no detail route.
- **`courseId` is a campus-scoped slug** (`chabot-mth-1`). `new` is a static segment, so `/academic/new` wins over `[courseId]`.
- **Housing param is `[postId]`** because a post can be "room available" or "looking for roommate".
- **`/profile` vs `/profile/[userId]`**: own view (editable, sees hidden offerings) vs public view.

## 4. Home tiles (as built)

| Tile | Goes to |
|---|---|
| I need study help (full width, featured) | `/academic` |
| I need food | `/food` |
| I need housing | `/housing` |
| I need financial help | `/resources?need=money` |
| I need safety help | `/safety` |
| Community card | `/community` |

When `/food` and `/housing` are built, their tiles point there directly.

## 5. Cross-links

```
AcademicResource / AcademicTip ──author──► /profile/[userId] ──contributions──► back to content
/profile ──courses──► /academic/[courseId]
/profile/[userId] ──public offering "Looking for roommate"──► /housing/[postId]   (only if visibility = public)
/food, /housing ──help section──► Resource cards ──► official sites
```

## Public + auth routes (Session 16, D33)
| Route | Access | Purpose | Status |
|---|---|---|---|
| `/welcome` | public | Landing page. Signed-out visitors to any app route land here | WORKING |
| `/login` | public (signed-in → next step) | Sign in, demo student button in mock | WORKING |
| `/signup` | public (signed-in → next step) | Create a student account | WORKING |
| `/forgot-password` | public | Request reset link, same confirmation for any email | WORKING |
| `/privacy` | public | Plain-language privacy notice | WORKING |
| `/verify-email` | signed in, email not verified | Verify, resend, change email | WORKING |
| `/onboarding` | signed in, verified, not onboarded | 5-step setup | WORKING |
| everything else | signed in + verified + onboarded | The app | gated by `components/layout/AppShell.tsx` |
Route lists live in `config/app.ts` (`PUBLIC_ROUTES`, `AUTH_FLOW_ROUTES`).

## Session 18 (D35)
| Route | Tab | Purpose | Status |
|---|---|---|---|
| `/academic/courses` | Academic | My courses: current (with private section), past, remove, Add course | WORKING |
| `/academic/courses/add` | Academic | Term → search (code, title, section) → Add → Added to My Courses | WORKING |
Nav label "Home" is now "Community" (route stays `/`). Desktop shows the same nav as a sidebar.
