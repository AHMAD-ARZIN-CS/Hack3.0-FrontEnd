# Features

Status values: PLANNED · IN PROGRESS · WORKING · BLOCKED · DEFERRED
Scope refined 2026-09-26 (D13). Navigation and content rules set in Session 4 (D18–D22).

| # | Feature | Pillar | Status | Build order |
|---|---|---|---|---|
| F0 | Foundation: layout, nav, campus selector, home, mock infra, service layer | Core | WORKING (new 5-tab nav) | done |
| F18 | Discover hub | Discover | WORKING v1 (static cards, Marketplace now live). v2 DESIGNED (Session 13): live counts + federated search | v2 next |
| F1 | Resource discovery | Basic needs (support) | WORKING (mock, unverified details) | done |
| F2 | Safety hub | Basic needs (support) | WORKING | done |
| F12 | Academic Exchange: courses, offerings, resources (files), tips, review workflow | **Academic** | **WORKING** read path + Helpful + Report (mock). Submit/review flow next | Session 10 |
| F20 | Paid academic resources | Academic | DEFERRED (D27: legal + payments) | – |
| F13 | Profile foundation + reputation (stats, levels, badges, tag categories, contribution graph, offerings visibility) | **Profile** | **WORKING** (mock). Session 15: driven by ContributionEvents | done |
| F21 | Contribution system: event ledger from approvals + helpful votes (academic + community), central weights, live metrics only, Student Hub badges | Profile | **WORKING** (mock, Session 15, D32) | done |
| F3 | Food (inside Discover): free food help + surplus-food deals + hold | **Basic needs** | **WORKING** (mock, Session 12) | done |
| F5 | Housing discovery: start choice, browse + filters, detail, connect, post, profile visibility | **Basic needs** | **WORKING** (mock, Session 11) | done |
| F14 | Contribute flows (post a note/guide/tip, post a housing listing) | Academic + Basic needs | PLANNED | with F12 / F5 |
| F15 | Content reporting (flag a post) | Trust | PLANNED | with F12 |
| F4 | Marketplace (Discover subsection): browse, search, filters, detail, request to connect, create with photos, own listings, status, profile opt-in, report listing/user, block | Discover | **WORKING** (mock, Session 14, D31) | done |
| F6 | Community foundation: campus feed, 7 post types, linked entities, faculty/org roles, comments, helpful, save, report, block, create post | Home | **WORKING** (mock) | done (Session 6) |
| F19 | Local opportunities (Discover category) | Discover | DESIGNED (reuse Opportunity type) | after Discover v2 |
| F7 | Student Voice | – | DEFERRED | – |
| F8 | School dashboard / CSV import | – | DEFERRED | – |
| F9 | Business dashboard (create food offer) | – | DEFERRED | – |
| F10 | Real auth + student verification | – | Frontend flow WORKING on mock (F22). Provider + enrollment check DEFERRED (Q6) | – |
| F22 | Landing page, sign up, sign in, forgot password, email verification, onboarding, personalized first screen, route gate, sign out | Core | **WORKING** (mock, Session 16, D33) | done |
| F11 | Payments | – | DEFERRED, not approved | – |
| F16 | Person-to-person reviews | Profile | DEFERRED (Ahmad: skip for MVP, D21) | – |
| F17 | Real file upload/storage | Academic | DEFERRED to backend. Frontend uses attachment metadata now (D19) | – |

---

## F0 Foundation · WORKING
- Top bar (name, campus selector, Safety), 5-tab bottom nav from `NAV_ITEMS` config, demo banner, Home with need tiles (Study help featured) + Community card, mock infra, service layer, `useAsync`, campus context.

## F18 Discover · v1 WORKING, v2 DESIGNED (Session 13, D30)
- **Purpose:** the structured place to find useful things near campus. Not a shopping marketplace.
- **v1 (built):** `/discover` lists 4 categories from `DISCOVER_SECTIONS`. Food, Resources, and Marketplace link. Opportunities shows "Later". Discover tab is active on `/food`, `/resources`, `/marketplace`, `/opportunities`, `/safety`.
- **v2 (designed):** search box (`?q=`) with grouped federated results (Resources → Food deals → Opportunities → Marketplace), live counts on category cards, optional "Open now" row (max 2). Built from `services/discover.ts` + one adapter per category. No Discover database.
- **Rules:** campus-aware everywhere; no prices on Discover home; no carousels, trending, or promoted items; links go to the owning page; one failing source never blanks the page.
- **Out of scope for MVP:** universal search across Academic/Housing/Community, typo tolerance, personalization, search index.

## F1 Resource discovery · WORKING
- Supporting layer inside Discover. Feeds the "help" sections of Food and Housing.
- Need chips now: Study, Food, Housing, Money, Safety.
- Limitations: campus entries are Demo placeholders (Q7).

## F2 Safety hub · WORKING
- Link-out only. Reachable from top bar and Discover.

## F12 Academic Exchange · WORKING (read path, mock) · Session 10
- **Flow:** Home "I need study help" / Academic tab → `/academic` (search, campus courses, recently shared) → `/academic/[courseId]` (Course Hub) → `/academic/[courseId]/[resourceId]` (detail) → author profile → back via profile history.
- **Academic home:** campus name, search across course code/title and resource title/description/tags (`?q=`), course cards with approved counts (active courses first), 3 newest resources, integrity note. States: loading, error, no matches (clear search), no courses on campus (switch to Chabot).
- **Course Hub:** code, title, catalog-check note + link, counts, integrity note, filters `?show=` All / Notes / Study guides / Practice / Strategies / Tips / Free (Paid only when `FEATURES.paidAcademic`), sort Most helpful / Newest, resources then tips, per-filter empty state, other-campus notice. "Share a resource" shown as coming next.
- **Resource detail:** type, Free/price badge, course chip, "Reviewed & approved", term, opened count, author block, description, body, file list (name, type, size), Open (records access, "Demo file"), Helpful (content, not person; disabled on own work), Report (6 academic reasons), expanded integrity rules, more from this course. Not found for unknown, wrong-course, or non-approved (unless author).
- **Tips:** category, term, author, Helpful (own disabled). Pending tips hidden.
- **Demo data (`data/mock/academic.ts`):** MTH 1 (study guide, notes, original practice, 2 tips), CSCI 14 (programming notes, loops study guide, 2 tips), ENGL 1 (essay planning strategy, MLA citation guide, 2 tips). Plus hidden: paid price preview (flag off), in-review draft, submitted tip. Course code + title verified; all content `isDemo`. No instructor names.
- **Cross-links now live:** Community "View study guide" → resource page. Profile course tags → Course Hub. Profile history → resource / course tips.
- **Tested:** 50 checks, all pass (see SESSION_LOG Session 10). Community, Profile, nav suites still pass.
- **Not built yet:** create draft / submit with declaration / mock review / My submissions (`/academic/new`, `/academic/mine`), term filter, real files, paid access.
- **Prohibited content handling:** declaration (next), review, report reasons (integrity, copyright, personal-attack). No professor ratings, instructor pages, or instructor filters exist.

## F13 Profile foundation · WORKING (mock)
- **Purpose:** shared identity that connects Academic, Housing, Discover, Community, and contributions.
- **Routes:** `/profile` (own: all offerings with Public/Hidden switches, browsing campus, "see how others see you", demo profile links) and `/profile/[userId]` (public: only public offerings, no switches, not-found state).
- **Shows:** display name, home campus, major (optional), verification status, level + level name, points and points to next level, joined month, bio (optional), live stats (resources shared, tips shared, helpful votes, students helped, community posts found helpful), contribution graph (26 weeks), badges, courses (taking now / previously taken), interests, exchanges (marketplace categories), needs & offerings, contribution history.
- **Tag categories (D24):** ACADEMIC = courses, INTERESTS, MARKETPLACE, NEEDS/OFFERINGS. Separate fields, separate config lists, separate visual styles.
- **Reputation:** computed in `services/reputation.ts` from ContributionEvents (`services/contributions.ts`) with weights in `config/reputation.ts` only. See F21. No ratings of people.
- **Contribution graph:** `components/profile/ContributionGraph.tsx`. SVG, scales to phone width, teal scale (own look), per-day tooltip with breakdown, caption + legend + "what counts" note. Daily cap 8.
- **Privacy:** no email/phone/student ID/grades/address fields exist in the model. Offerings default hidden. Hidden offerings filtered out in the service for public view. Housing shows only a general label + link to Housing.
- **Data:** `data/mock/users.ts` (4 demo users: full, public-housing, tips-only, minimal), `data/mock/courses.ts` (5 Chabot courses, code+title verified), `services/profiles.ts`, `services/courses.ts`, `services/user.ts` (now reads the same mock users).
- **Tested (Playwright, 390×844):** rendering, mobile layout, missing optional fields, course/interest/marketplace tags, badges, graph, offerings visibility toggle → public view, hidden need not leaked, unknown user, privacy text scan, no console errors. 46/46 checks pass.
- **Not built yet:** editing major/bio/courses/interests (types + `PATCH /me/profile` ready), adding/removing offerings, author chips linking content → profiles (comes with Academic pages), course tags linking to course pages (Academic pages not built), avatar images.

## F21 Contribution system · WORKING (mock, Session 15, D32)
- **Principle:** reward helping, not engagement. Logins, time spent, opens/downloads, posting, commenting, saving, and reactions earn nothing.
- **Events:** resource approved, tip approved, helpful vote received (academic resources, tips, credited community posts), community post found helpful (first helpful vote). Defined with no source yet: verified resource contribution, verified exchange.
- **Where they come from:** seeded from real mock records (approved academic items, record helpful counts via a pool of anonymous demo voters, helpful community posts). Live: marking helpful in Academic or Community records or revokes an event for the author.
- **Scoring:** weights, per-voter cap (5 votes per voter per recipient), credited post types, levels, badges, and which metrics show all live in `config/reputation.ts`. Components only render.
- **Profile:** only live metrics show (5 today, verified ones hidden). Graph = own contributions only. History includes helpful community posts with links. Badges show earned date and "Student Hub recognition only. Not a college award, certification, or academic credential."
- **Badges:** Resource Contributor, Course Contributor, Community Helper, Helpful, Helped 25 students, Top Contributor (150 points, a fixed goal, not a ranking).
- **Removed:** hand-typed stats, history, and random "extra activity" in `data/mock/users.ts`. Demo numbers now match the content that exists.
- **Tested:** 34 unit checks (ledger + scoring), 16 browser checks (live academic and community credit, unmark, promotional posts earn nothing, posting earns nothing, badges, disclaimer, live metrics), Profile suite updated (48).
- **Not built:** review flow that calls `recordApproval`, verified resource contributions, verified exchanges (needs both-side confirmation in Marketplace), community answers (Q18), moderation calling `revokeEventsForSource`.

## F22 Landing + auth + onboarding · WORKING (mock, Session 16, D33)
- **Routes:** `/welcome` (landing), `/login`, `/signup`, `/forgot-password`, `/privacy` (public). `/verify-email`, `/onboarding` (signed in, not finished). Everything else is gated.
- **Landing:** nav (logo, How it works, Sign in, Join), hero "Your campus. Your people. Everything easier to find.", sample product preview built from app card styles, the four parts as one app, the fragmentation problem, how it works (4 steps), trust (plain meaning of each label, no safety guarantee), final CTA, footer "not an official college service". Responsive: phone, tablet, desktop.
- **Sign up:** name, email, password + confirm with show/hide, students-only confirmation, guidelines + privacy acknowledgement. Nothing else.
- **Sign in:** email, password with show/hide, forgot password, create account, loading state, generic error, password cleared after each attempt. Mock: "Continue as the demo student".
- **Verify email:** shows address, "I've verified, continue" (checks the session), resend, change email, sign out. Mock-only simulate button.
- **Onboarding:** campus → about you (major, standing, optional) → courses (skippable, empty state for campuses without a course list) → interests (public) + needs (private) → welcome with campus and "Student verification: pending" → Enter my community.
- **Home:** greeting + first name + campus + "What's happening at your campus?", 3 community posts, community link, private "For you" shortcuts, need tiles, campus resources.
- **New accounts:** real empty profile (public name "First L.", Not verified yet, onboarding courses/interests, 0 points). Demo account keeps its seeded data.
- **Profile:** Sign out button.
- **Tested:** 56 browser checks (landing at 3 widths, all gates, every validation, verification states, onboarding, first screen, private needs and email not on profile, returning sign-in, generic errors, no account enumeration, password never in storage or console). All other suites pass with a demo session.
- **Not built:** real provider (Q6), enrollment verification, OAuth/SSO, rate limiting (provider), account deletion, editing onboarding answers later (profile editing is still F13 "not built").

## Session 17 updates (D34)
- **F1 Resources:** 4 real Chabot resources with official links, `sourceUrl`, and a visible "Checked on the official page" date. Other campuses keep labeled demo placeholders.
- **F12 Academic submit flow · WORKING (mock):** `/academic/new` (course, type, title, description, text or files, topics, three integrity statements, blocked answer keys/exams/textbook PDFs/instructor slides) → `/academic/mine` ("Pending review", only the author sees it, review history) → mock-only "Demo: act as Student Hub Moderator" approve or reject with a reason → published resource + contribution credit. Entry points: course page "Share a resource", Academic "My submissions".
- **F6 Helpful answer · WORKING (mock):** on their own question, the asker marks one comment as the helpful answer. Badge on the comment, switch or unmark, credit to the answerer (5 pts, "helpful answers" metric, history links back to the question). Demo question "Where can I get tutoring for Calculus?" added.
- **F5 Housing:** after a request, mock-only "Demo: simulate … accepting" → "Connection accepted". Nothing revealed. Messaging later.
- **F4 Marketplace:** new "Dorm & apartment" category. Reporting a listing flags it for review and hides it from lists (no deletion).
- **F19 Opportunities (model only):** review status, source, submitter, sourceUrl. Community previews show published only.
- **Tested:** 30 new browser checks (test-decisions), 5 new unit checks. Existing suites updated where behavior changed on purpose (6 profile metrics, real pantry name, 8 Chabot posts, listing report now hides the listing).

## Session 18 final pass (D35)
- **Identity + layout:** blue brand, warm neutrals. Desktop sidebar with labeled areas and hints; two-column Community home; tablet and phone checked. No horizontal overflow on 12 primary screens at 1280, 820, and 390 px.
- **Navigation:** Community / Academic / Discover / Housing / Profile, active state everywhere, back links on nested Discover pages.
- **Discover:** four clear doors. Opportunities visible, not a dead end.
- **Community:** composer with avatar on Home and Community.
- **F23 My Courses + Add Course · WORKING (mock):** `/academic/courses` (current with section, past, remove), `/academic/courses/add` (term, search by code/title/section, Add, "Added to My Courses"). Entry points: Academic "My courses" strip, Profile "Manage my courses". Demo sections clearly labeled.
- **Empty states:** audited and given actions (Academic course, Community, Housing, Resources, Marketplace, Home).
- **README:** rewritten for reviewers (modes, architecture, real vs mock, security, backend plan).
- **Tested:** test-final 32/32 plus all existing suites.

## F3 Food · WORKING (mock) · Session 12
- **Where:** Discover › Food (`/food`), Home "I need food" tile, Discover hub card (now live).
- **Order on the page:** free food help first (pantry, CalFresh, county food bank from Resources), then surplus-food deals. Dignity first, deals second.
- **Deals list:** restaurant, title, student price vs usual price + % saved, pickup window ("Today 2:00 – 5:00 PM"), area + distance, quantity left, "Pickup open now", dietary tags, sold out greyed. Ended deals hidden. Available first, then soonest.
- **Filters (URL):** distance, max price, pickup open now, dietary (vegetarian, vegan, halal, gluten-free). Empty + no-match states.
- **Deal detail (`/food/[dealId]`):** price comparison, pickup window, area, description, allergen note, quantity stepper (max 2), "I want this · $X at pickup" → 45-minute hold with pickup code, cancel hold (restores quantity). Sold out / ended states. Report (wrong info, asked to pay in advance).
- **Honesty:** every business is fictional ("Demo …"), `verifiedBusiness: false`, page says "Sample restaurants. No real businesses participate yet." No payments: "Pay the restaurant directly at pickup."
- **Tested:** 33 checks, all pass.
- **Not built:** business dashboard to post deals (F9), real pickup confirmation, notifications, holds persisting after reload.

## F5 Housing discovery · WORKING (mock) · Session 11
- **Start (`/housing`):** "I need housing" → rooms available. "I have housing / need a roommate" → students looking. "Post" link. Short safety note. Housing help resources (campus + county).
- **Browse (`/housing/browse`):** tabs Rooms available / People looking. Filters in URL: budget, distance, availability (now / 1 month / 3 months), room type, verified students only. Count, empty state, no-match state with Clear filters. Campus from the header selector.
- **Cards:** type, room type, price (rent or "≤ budget"), approximate area + "~N mi from campus", availability + lease, up to 3 amenities, author preview with verification. No address.
- **Detail (`/housing/[postId]`):** price, approximate area, availability, lease, description, amenities, lifestyle preferences, owner preview (name, role, verification, major, level, helpful votes, View profile), full safety box ("verified is not a background check", no deposits before seeing + signing, fair housing), Report (scam, fake, discrimination, personal info, harassment, other), Request to connect (blocks phone/email/address/payment text, one per post). Own post: visibility switch + Mark as filled, no connect.
- **Post (`/housing/new`):** type, title, description, approximate area (list with distances), price, date, lease, room type, amenities (rooms), lifestyle preferences (fair-housing note), profile visibility checkbox (off). No address, deposit, or payment fields. Validation blocks phone, email, street address, deposit/payment requests. Redirects to the post with a "Posted" banner.
- **Profile:** housing status never shows automatically. Derived from `profileVisibility` on the post (default hidden). Public profile shows only the general label + link.
- **Tested:** 56 checks, all pass. Profile, Community, Academic, nav suites still pass.
- **Not built:** accept/decline requests, messaging, editing a post, photos, real verification, map.

## F14 Contribute flows · PLANNED
- `/academic/new?type=resource`: course, optional term/instructor, kind, title, description, optional body, attachments (mock file picker → metadata only), integrity checkbox.
- `/academic/new?type=tip`: course, text (max ~500), integrity checkbox, reminder "about succeeding in the course, not about the instructor".
- `/housing/new`: built (F5).
- Mock submit adds to the in-memory store for the session.

## F15 Content reporting · PLANNED
- "Report" on academic posts and housing posts → reason picker → mock `ContentReport`. Needed before any real user-generated content goes live.

## F4 Marketplace · WORKING (mock, Session 14, D31)
- **Where:** Discover › Marketplace (`/marketplace`). Not a tab, not on Home, not in the Community feed.
- **What:** student-to-student exchange of textbooks, school supplies, clothing, electronics, other small items. Notes → Academic, rooms → Housing, food → Food.
- **Browse:** Browse / Your listings tabs, search (`?q=` title, description, course, ISBN, category), category chips, price (incl. Free), condition, verified-only, clear filters. List rows with category icon or photo, price, condition, course, seller, time. Available first, pending after. Campus-scoped.
- **Detail:** photos or icon, category/condition/status badges, price, course/ISBN, description, seller preview + profile link, request to connect (checked for phone, email, address, advance payment, shipping), full safety tips, report listing, report/block seller.
- **Create (`/marketplace/new`):** title, category, condition, price or Free, course + ISBN for textbooks/supplies, description, up to 4 photos (JPG/PNG/WebP ≤5 MB, local preview in mock), show-on-profile (off by default). Rejects notes, housing, food, exam material, PDFs, prohibited items, contact info, advance payment.
- **Seller controls:** Available / Pending / Sold, profile visibility switch. Under-review banner for reported listings.
- **Profile:** opted-in active listings show as "Selling: …" / "Giving away: …" with a link. Owner can toggle from the profile too.
- **Blocking:** one shared list with Community. Blocked sellers' listings and posts disappear for the viewer.
- **Not built:** real photo upload (api mode says so), messaging after a request, request inbox for sellers, moderator queue, edit/delete listing, persistence after reload.
- **Tested (Playwright, 390×844):** 63/63 checks. Profile suite updated for the new marketplace offering. All other suites pass.

## F6 Community foundation · WORKING (mock)
- **Purpose:** make opening the app feel like "my campus community is here". Human and useful, not transactional.
- **Routes:** `/community` (feed, filters `?type=`, `?saved=1`), `/community/[postId]` (post + comments), `/community/new` (create). Home tab is active on all of them. Home shows the 2 latest posts under the Community card.
- **Post types (7):** question, discussion, shared resource, study group, event, opportunity, announcement (announcement only for verified faculty/staff/organizations).
- **Authors:** student, faculty/staff, organization. Author line shows name, role, campus, verification ("Verified student", "Verified role", or "Role not confirmed"), role title. Faculty/org posts carry "Not an official college statement".
- **Linked entities:** study guide/notes/practice (preview, page coming with Academic), campus resource (links to Resources), opportunity (preview with deadline), profile, housing (links to Housing). Resolved in the service, rendered by `LinkedEntityCard`.
- **Engagement:** comments, Helpful (not on own posts), Save + Saved filter. No other reactions.
- **Moderation prep:** Report (6 reasons) → `services/reports.ts`, Block author (viewer-side, with Undo), status active/hidden/removed, removed post and removed comment placeholders.
- **Create post:** type chips by role, title, body (10–2000), course, up to 3 topic tags, meeting fields for study group/event, link picker (own resources) for shared resource, validation messages. Attachments: model only.
- **Campus-aware:** feed and create use `currentCampus`. Nothing hardcoded to Chabot.
- **Not auto-posted:** Housing, Food, Marketplace listings never flow into the feed.
- **Tested:** 46 checks (feed, roles, linked entities, feed→post→comment, post→author profile, helpful, save, filters, report, block/undo, create question/study group/shared resource with validation, removed content, campus switch, Home preview, mobile overflow, console). All pass.
- **Limitations:** mock writes reset on page reload. No comment helpful/answer marking yet (would feed `communityAnswersHelpful`). No editing/deleting own posts. No notifications. Study guide link target page not built yet.
