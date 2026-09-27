# Decision Log

Do not silently reverse a decision. To change one, add a new entry that supersedes it.

---

### D1 · Service layer between UI and data
- **Decision:** UI → `services/` → mock or API. Components never touch data sources.
- **Reason:** frontend must work before the backend exists, and backend tech is not ours to choose.
- **Impact:** no Firebase/fetch calls in components. Backend differences are absorbed by `services/api/normalize.ts`.
- **Status:** accepted (from project brief).

### D2 · One app, campus as data
- **Decision:** `currentCampus` in context. All content carries `campusId`. Campuses listed in `config/app.ts`.
- **Reason:** adding a campus must not require new pages.
- **Status:** accepted (from project brief).

### D3 · Money in integer cents, dates in ISO UTC
- **Reason:** avoid float rounding and timezone bugs between frontend and backend.
- **Impact:** backend sends `priceCents: 1250`, UI formats `$12.50`.
- **Status:** proposed, needs backend confirmation.

### D4 · Distance is campus-relative and approximate
- **Decision:** `distanceMiles` is measured from campus center. No GPS permission in MVP.
- **Reason:** privacy, and it matches "campus-first".
- **Status:** proposed.

### D5 · No contact info in public models; ContactRequest instead
- **Decision:** marketplace and housing use an in-app request. No phones/emails in listings.
- **Status:** proposed.

### D6 · Housing shows area only; no protected-trait preferences
- **Reason:** student privacy and fair-housing risk.
- **Status:** proposed, needs product owner OK (Q5).

### D7 · Demo data is labeled
- **Decision:** `isDemo: true` on mock records, visible "Demo" tag in UI, fictional business names.
- **Reason:** don't imply real partnerships or fake stats.
- **Status:** accepted (from project brief).

### D8 · Stack: Next.js App Router + TypeScript + Tailwind + npm
- **Status:** accepted 2026-09-26 by Ahmad. Installed: Next 16.3.6, React 19.2, Tailwind 4, lucide-react icons.
- **Priority set by Ahmad:** functionality over looks.

### D9 · App name "East Bay Link"
- **Decision:** UI name is East Bay Link, set in `config/app.ts` `APP_NAME`. May change later, change only that constant + docs.
- **Status:** accepted 2026-09-26.

### D10 · Regional resources scoped with `servesCampusIds`
- **Reason:** Contra Costa food bank was showing for Hayward students.
- **Impact:** optional field in contract v0.2. Backend should apply the same campus rule.
- **Status:** accepted.

### D11 · Client-side data fetching via `useAsync`, campus via `useSyncExternalStore`
- **Reason:** services must work the same in mock and API mode, from the browser. `useSyncExternalStore` avoids hydration mismatches when reading localStorage and satisfies React 19 lint rules.
- **Impact:** pages that load data are client components (or wrap one). Server components can still be used for static shells.
- **Status:** accepted.

### D12 · Filters in the URL
- **Decision:** list filters live in search params (`?need=food&q=...`), wrapped in `<Suspense>` as Next requires.
- **Status:** accepted.

### D13 · Refined MVP scope: Academic Exchange + Basic Needs (Housing, Food) + shared Profile
- **Decision (Ahmad, 2026-09-26):** the two primary systems are (1) Academic Exchange (notes, study guides, course tips, knowledge from previous students) and (2) Basic Needs / Local Opportunities, starting with Housing and Food. A shared Profile / Reputation system connects both.
- **Principle:** East Bay Link is not another social network or marketplace. Its job is to preserve and connect useful resources, student knowledge, and local opportunities that exist in fragmented places.
- **Impact:**
  - Marketplace (F4) and Community (F6) → DEFERRED. Types stay in code, no further work.
  - Resource discovery (F1) and Safety (F2) stay as supporting layers under Basic Needs.
  - New PLANNED models: Course, AcademicPost, HelpfulVote, ContentReport, UserProfile, Badge, Contribution (DATA_CONTRACT v0.3).
  - Build order: Academic Exchange (+ minimal profile) → Food → Housing.
- **Supersedes:** the original 5-flow list (A–E) in the first brief.
- **Status:** accepted.

### D14 · One AcademicPost entity with `kind`, nested under the course route
- **Decision:** notes, study guides, and tips are one model (`AcademicPost.kind`). Route `/academic/[courseId]/[postId]` instead of `/notes/[noteId]`.
- **Reason:** one service, one card, one contribute form, one helpful/report path. Nested route keeps course context.
- **Also:** `courseId` is a campus-scoped slug (`chabot-mth-1`). Housing detail param is `[postId]` not `[listingId]`.
- **Status:** SUPERSEDED by D19 (entity split) for the entity part. Nested route + campus-scoped courseId + `[postId]` for housing still stand.

### D15 · Reputation = contributions + helpful votes, no ratings of people (MVP)
- **Decision:** points from publishing and from helpful votes received → level → badges. No star ratings or reviews of students in MVP.
- **Reason:** rewards contributing (principle 5) and avoids harassment/retaliation risk, especially for roommates. "Reviews/reputation" in the brief is covered by helpful votes on content.
- **Impact:** person-to-person reviews = F16 DEFERRED pending Q11.
- **Status:** accepted with changes, see D21.

### D16 · Proposed nav: Home / Academic / Food / Housing / Profile
- **Reason:** matches the three pillars. Resources + Safety stay reachable from Home, the top bar, and inside Food/Housing.
- **Impact:** supersedes Q3. `NAV_ITEMS` moves into config. Market and Community tabs removed.
- **Status:** SUPERSEDED by D18.

### D17 · Academic integrity and privacy rules for contributions
- **Decision:** own notes and advice only. No exams, answer keys, graded work, copied instructor/textbook material. No instructor names, grades, sections, or schedules in posts or profiles.
- **Reason:** protects students and the project from integrity and copyright problems. Keeps the product from becoming a professor-rating or cheating site.
- **Status:** SUPERSEDED by D20 (instructor names allowed as context).

### D18 · Navigation: Home/Community · Academic · Discover · Housing · Profile
- **Decision (Ahmad, Q9):** 5 tabs. Food has no own tab, it lives in Discover with Resources, Marketplace, Local opportunities. Academic is first-class. Home carries a prominent Study Help entry and a prominent Community entry. Final UX may turn Home into the community feed.
- **Implementation:** `NAV_ITEMS` and `DISCOVER_SECTIONS` in `config/app.ts`. Discover tab is active on `/discover`, `/food`, `/resources`, `/marketplace`, `/opportunities`, `/safety` (existing URLs kept). Profile icon removed from top bar (now a tab). Community tile replaced by a Community card under the tiles.
- **Keep deferred code:** do not delete Marketplace/Community pages or types.
- **Status:** accepted, implemented Session 4.

### D19 · Academic content = AcademicResource (files) + AcademicTip (text)
- **Decision (Ahmad, Q10):** the model must support file attachments for original student-created resources. Tips/discussions stay text.
- **AcademicResource:** kinds notes / study-guide / practice. `attachments: Attachment[]` with attachmentId, fileName, fileType, fileSize, previewUrl, downloadUrl.
- **AcademicTip:** short text.
- **Frontend now:** attachment metadata only, placeholder URLs, "Demo file" label. Real upload/storage = backend (`POST /uploads`).
- **Status:** accepted, typed in `types/academic.ts`.

### D20 · Course → CourseOffering → Instructor as context only; integrity rules
- **Decision (Ahmad, Q12):** instructor names are allowed in the data model as organizational context ("MTH 1, Fall 2026, Instructor X").
- **Never build:** professor ratings, best/worst rankings, instructor reputation scores, personal attacks, "easy A" content.
- **Banned content:** leaked exams, answer keys, unauthorized instructor materials, copyrighted textbook PDFs, cheating material.
- **Tips** focus on succeeding ("weekly quizzes mattered", "start the final project early").
- **Status:** accepted.

### D21 · Reputation from observable contributions; content can be rated helpful, people cannot
- **Decision (Ahmad, Q11):** no star ratings/reviews of people in MVP. Profiles show counts: resources shared, helpful votes, students helped, badges, history. Helpful votes on resources/tips are allowed.
- **Also counts:** approved resources (`status: approved`).
- **Status:** accepted.

### D22 · Housing on profiles is opt-in, default hidden
- **Decision (Ahmad, Q13):** `HousingPost.profileVisibility: "public" | "hidden"`, default hidden. Profile shows only a general status ("Looking for roommate" / "Room available") via `ActiveOffering`, never details or addresses. Details stay on the housing post page.
- **Status:** accepted, typed.

### D23 · Demo course set (Chabot), verified against official sources
- **Decision (Ahmad, Q14, adjusted after verification):**
  - **MTH 1 · Calculus I**: verified on chabotcollege.edu Mathematics Courses page. Chabot writes "MTH", not "MATH".
  - **CSCI 14 · Introduction to Structured Programming In C++**: Chabot has no "CS 1". CSCI 14 is the intro programming course on the Computer Science Courses page. Alternative: CSCI 7 Introduction to Computer Programming Concepts (Q15).
  - **ENGL 1 · Academic Reading and Writing**: Chabot-Las Positas 2026-27 catalog.
- Course records get `catalogVerified: true` for code + title only. All notes, guides, tips, authors, and offerings are `isDemo: true`. No instructor names in demo offerings (avoid attaching invented content to real people).
- **Status:** accepted.

### D24 · Profile foundation rules: separate tag categories, meaningful-contribution graph, private-by-default
- **Decision (Ahmad, Session 5):**
  - Tags are split: ACADEMIC (courses, current vs past), INTERESTS, MARKETPLACE, NEEDS/OFFERINGS. No generic tag array. Allowed ids live in `config/tags.ts`.
  - Contribution graph counts only approved resources/tips, helpful community answers, verified exchanges. Never logins, screen time, raw posts, spam. Daily cap 8. Own teal color scale and wording so it does not copy another product's branding.
  - Offerings replace ActiveOffering: `ProfileOffering { category, direction, label, link?, visibility }`, default hidden.
  - Profiles never carry email, phone, student ID, grades, or residential address, not even in the model.
  - Reputation math lives in `services/reputation.ts` (mock) / backend (API). Components only display.
- **Status:** accepted, implemented.

### D25 · Community foundation
- **Decision (Ahmad, Session 6):** Community is core to identity. Campus-scoped feed of 7 post types; authors can be students, faculty/staff, or organizations; posts link to entities elsewhere; engagement = comments, helpful, save only.
- **Rules:**
  - No auto-posting of Marketplace/Food/Housing listings into the feed.
  - `roleVerified` comes from a review process, never from an institutional email alone. Unverified role claims show "Role not confirmed".
  - Faculty/staff/org posts show "Not an official college statement". No pinning or "official" styling that implies college endorsement.
  - Announcements only from verified faculty/staff/organizations.
  - Study groups and events are posts with a `meeting` for now (no separate entity yet).
  - Old `Post` (kind/supportCount/officialChannelUrl) replaced. Student Voice "concern" type stays deferred.
  - Moderation prep: report, viewer-side block, status active/hidden/removed.
- **Status:** accepted, implemented.

### D26 · Academic Exchange data design
- **Decision (Session 9):**
  - Structure: Campus → Course → CourseOffering (term, optional Instructor) → AcademicResource / AcademicTip.
  - Instructor is a minimal context entity (name, department). Reached only through CourseOffering. No `instructorId` on resources, no instructor pages/lists/filters, no rating or aggregate fields.
  - AcademicResource types: notes, study-guide, practice, study-strategy. Attachments via metadata. AcademicTip: course-tip or study-strategy, text only.
  - No AcademicFeedback entity: content feedback = shared HelpfulVote, problems = shared ContentReport. No stars.
  - Review workflow: draft → submitted → under-review → approved / rejected, plus removed. Only approved is public and counts for reputation. Submission requires a 3-part declaration (original, no exam material, no copyrighted/instructor material).
  - AcademicAccess records opens (free) and later purchases. `accessCount` is informational, not reputation.
- **Supersedes:** D19's `kind`/`ModerationStatus` naming.
- **Status:** accepted (Ahmad: "continue from the approved architecture", Session 10). Read path built.

### D27 · Paid academic resources: deferred and restricted
- **Decision:** the model supports paid access, but it stays off.
- **Why:** California Education Code §66450 prohibits anyone, including enrolled students, from selling or distributing for a commercial purpose recordings of class presentations "in any medium", including handwritten or typed class notes, unless authorized under campus policy. Payments (F11) are also not approved.
- **Rules when it is ever enabled:** approved resources only, never `notes`, author declares the material is not a recording of class presentations, legal/policy review done, payment provider handles money (no card data in the app).
- **Status:** accepted as a constraint. Paid launch needs Ahmad + legal review.

### D28 · Housing discovery rules
- **Decision (Ahmad, Session 11, "approved Housing architecture"; answers Q5):**
  - Start with the student's situation: "I need housing" vs "I have housing / need a roommate".
  - Approximate area from a fixed list with rough distances. No addresses anywhere, including free text (server-side checks).
  - Lifestyle preferences only. No protected-trait fields (fair housing).
  - Contact through a request. Phone, email, address, and payment/deposit requests are blocked in messages and posts.
  - No deposits or payments in the app.
  - "Verified student" is shown with a clear "not a background check / not a safety guarantee" message.
  - `HousingPost.profileVisibility` (default hidden) is the single source of truth for housing status on profiles. Profile offerings for housing are derived, not stored.
- **Status:** accepted, implemented.

### D29 · Food: free help first, deals are holds without payment
- **Decision (Session 12):** `/food` shows free food help (Resources) before surplus deals. "I want this" creates a 45-minute hold with a pickup code; the student pays the business at pickup. All businesses are fictional demo records with `verifiedBusiness: false`.
- **Reason:** dignity and honesty (no fake partners), and payments are not approved (F11).
- **Status:** accepted, implemented.

### D30 · Discover is a composition layer with grouped federated search
- **Decision (Session 13):**
  - Discover answers "what can I find or use around my campus?". Community answers "what is happening?". Academic and Housing stay separate tabs.
  - Categories: Food, Resources, Opportunities, Marketplace. Each owned by its own service. Discover owns no data and never duplicates records.
  - `services/discover.ts` + one `DiscoverSource` adapter per category (count + search). Adding a category = one adapter + one config line.
  - MVP search is federated and **grouped by category** in a fixed need-based order (free help first). No global ranking, no search index, no cross-tab search.
  - Discover home: search + 4 category cards with counts. No prices, carousels, trending, promoted items, or product grids.
  - Marketplace, when built: student-to-student list layout, request-to-connect, no payments, campus-scoped.
- **Status:** accepted as design. Build order: Discover v2 (Food + Resources adapters) → Opportunities → Marketplace.

### D31 · Marketplace built as a Discover subsection
- **Decision (Session 14, Ahmad's brief):** build Marketplace now, before Discover v2 and Opportunities. This changes the D30 build order at Ahmad's request.
- **Scope:** physical items students exchange: textbooks, school supplies, clothing, appropriate electronics, other small items. Notes/study material stay in Academic, rooms in Housing, food in Food. The create form rejects those with a link to the right place.
- **Placement:** only inside Discover (`/marketplace`, Discover tab active). Not a tab, not on Home, never posted to Community. List rows, not a product grid. No demo product photos: category icons instead.
- **Model:** `types/marketplace.ts`. Separate `status` (seller: active/pending/sold) and `moderationStatus` (moderators: visible/under-review/removed). Photos use the shared `Attachment` type.
- **Contact:** request-to-connect (ContactRequest `listing`). No phone, email, address, advance payment, or shipping in text. No payments in the app.
- **Profile:** a listing appears on the seller's profile only if the seller turns it on (default hidden, same as housing). Sold listings leave the profile.
- **Safety prep:** report listing (`marketplace-listing`, new reason `prohibited-item`), report user (`profile`), block. One shared block list (`services/blocks.ts`) for Marketplace and Community. Blocking is private.
- **Defaults applied for Q23 (confirm or change):** furniture left out (pickup usually at a home). Free items allowed. Price cap $1,000. No trades field (students can say "open to trade" in the description).
- **Status:** accepted, implemented (mock).

### D32 · Contribution events drive reputation
- **Decision (Session 15, Ahmad's brief):** reward helping, not engagement. One ledger of ContributionEvents is the only input to stats, points, levels, badges, the graph, and history.
- **Earns credit:** approved resources and tips, helpful votes from other students, a community post (question, discussion, resource share, study group) that another student found helpful. Later: verified resource contributions, verified exchanges.
- **Earns nothing:** logins, screen time, opens/downloads, post or comment volume, saves, self-votes, unapproved or removed content, helpful marks on events, opportunities, or announcements.
- **Anti-gaming:** one vote per student per item. At most 5 votes from one voter count toward one person's points. Graph daily cap 8.
- **Config:** all weights and rules in `config/reputation.ts`. No scoring in components.
- **Display:** a metric shows only if its event source is live. Verified metrics stay hidden until a source exists.
- **Badges:** renamed to the Student Hub set. Fixed thresholds, never a ranking. Labeled as Student Hub recognition, not a college award, certification, or credential.
- **Demo data:** removed hand-typed stats and random extra activity from mock users. Numbers now come from mock records. Seeded helpful votes use anonymous demo voter ids so "students helped" counts distinct people.
- **No person ratings.** Unchanged from D21.
- **Status:** accepted, implemented (mock).

### D33 · Landing, sign-in, verification, onboarding (students only)
- **Decision (Session 16, Ahmad's brief + "only students"):** the journey is Landing (`/welcome`) → Sign up / Sign in → Verify email → Onboarding → Home. Every app page needs a signed-in, email-verified, onboarded account. Signed-out visitors land on `/welcome`.
- **Students only:** self sign-up requires "I'm a current student at Chabot, DVC, or CSUEB". Faculty, staff, and clubs get accounts later through role review. Only students earn contribution credit (answers Q26, `CONTRIBUTION_ELIGIBLE_ROLES`).
- **Three separate states:** account authenticated (email verified) ≠ student verified (enrollment confirmed by backend, new accounts start "pending") ≠ faculty/staff verified (role review, never from email alone).
- **Security:** the auth provider/backend owns credentials. Passwords live only in form state until the call, are cleared after it, and are never stored, logged, or put in mock data. No tokens in localStorage in api mode (httpOnly cookie preferred). The route gate is UX only. The backend must refuse unauthenticated calls.
- **Mock mode:** DEMO ONLY. Accounts are simulated in the browser (name, email, flags, onboarding answers; no password). Sign-in accepts a registered email with any 8+ character password, labeled on every auth page. Email verification has a "Demo: simulate opening the link" button that exists only in mock mode. "Continue as the demo student" signs in the seeded demo account.
- **Onboarding:** 5 short steps. Only campus is required. Courses skippable. Interests are public profile tags. Needs are private and only shape Home shortcuts. Saved on "Enter my community".
- **First screen:** greeting with first name, campus, "What's happening at your campus?", community posts first, then private shortcuts, then need tiles.
- **Forgot password:** same confirmation for any email (no account enumeration). Sign-in errors are generic.
- **Status:** accepted, implemented (mock). Real provider is Q6.

### D34 · Ahmad's answers to the open questions (Session 17)
- **Q7 resources:** real, checked official links where practical. Real resource → official URL + `sourceUrl` + `lastVerifiedAt`. Mock → labeled demo. Never invent a URL. Done: 4 real Chabot resources (FRESH Market, Basic Needs Assistance, Financial Aid, Tutoring), each read on chabotcollege.edu on 2026-09-27. Other campuses keep demo placeholders.
- **Q15 demo course:** CSCI 14 for programming. Demo courses MTH 1, CSCI 14, ENGL 1 (codes and titles verified in D23; Chabot writes them "MTH" and "ENGL", so we keep the official spelling rather than "MATH 1"/"ENG 1").
- **Q16 uploads:** pending review first. Upload → Submitted ("Pending review") → Student Hub Moderator → Approve / Reject. Mock-only "Demo: act as Student Hub Moderator" panel. Real lifecycle, no instant publish.
- **Q8 GitHub:** don't connect until Ahmad gives the teammate's URL. Never invent one.
- **Q4 OneDrive:** leave the project where it is. Move to e.g. `C:\dev\student-hub` only if OneDrive causes locking, sync conflicts, or build problems. `.next`, `node_modules`, `.env*` stay out of Git (`.env.example` is kept).
- **Q6 backend/login:** Firebase unless the backend teammate says otherwise: Firebase Auth, Firestore, Cloud Storage for files. No integration until their config exists. Demo auth mode stays separate and swappable (`services/auth.ts`). Real model: email + provider → UID → user profile. Verification: account → email verified → campus email matched → student verified. Faculty/staff need role review; `.edu` alone never makes faculty. No student ID image collection.
- **Q19 reviewers:** a generic "Student Hub Moderator" prototype role. No claim that MESA, Chabot staff, or faculty review anything.
- **Q20 tips:** auto-publish after automated checks, with report, moderation, author ownership, and status. Same content rules (no harassment, professor ratings, leaked exams, answer keys, cheating).
- **Q21 paid:** real payments off. Concept stays in the model (`AccessModel`, `FEATURES.paidAcademic`). No fake checkout ever.
- **Q18 helpful answer:** the asker marks ONE comment on their question as the helpful answer. Credits the answerer through the central config (`community-answer-helpful`). Not a vote. Built.
- **Q22 housing:** no chat. Request → accepted → "Connection accepted", nothing revealed. Mock-only button simulates the other student accepting. Messaging and choosing how to talk are future work.
- **Q23 marketplace:** textbooks, supplies, clothing, electronics, small dorm/apartment items (new category). No furniture. $1,000 cap stays. No trade field. Keep it simple and secondary.
- **Q25 reports:** never auto-remove by count. Report recorded → listing flagged NEEDS_REVIEW (`moderationStatus: "under-review"`, hidden from lists) → moderator keeps / restricts / removes. `reportCount` tracked separately. In the demo one report flags it.
- **Q24 opportunities:** verified faculty/staff and verified orgs publish. Students suggest → pending review → moderator publishes. Model has `sourceUrl`, `organization`, `deadline`, `campusId`, `submittedBy`, `source`, `reviewStatus`. Showing an opportunity never implies endorsement.
- **Priorities for the rest of the hackathon:** working demo, clean flow, community feel, academic exchange, trust/verification, housing, real resources, backend-ready architecture. Not now: payments, full messaging, advanced moderation, big catalogs, complex marketplace, ID document verification.
- **Status:** accepted, applied (Session 17).

### D35 · Final product pass: identity, responsive layout, courses (Session 18, Prompt 13)
- **Identity:** brand was deep blue `#1d4ed8` (replaced by D36 ocean blue) on a warm neutral background with navy text. Green only means status (verified, success, available). Tokens in `app/globals.css`; contrast checked (brand 6.7:1 on white).
- **Navigation:** Community, Academic, Discover, Housing, Profile. "Home" is now labeled Community. One `<nav aria-label="Main">`: bottom tabs on phones, labeled sidebar with a one-line hint per area on desktop (lg). Phone top bar hides on desktop.
- **Layout:** desktop uses the width on purpose: Community home is feed + side column; lists stay readable width; marketplace uses two columns. No phone layout stretched across a monitor.
- **Discover:** four doors, in order: Food & Basic Needs, Marketplace, Campus Resources, Opportunities (shown as "Not open yet", no dead link). Every Discover page links back.
- **Community feel:** composer with avatar at the top of Home and Community.
- **Courses:** Campus → Term → Course → CourseSection (`sectionCode`, generic) → UserCourse. Add Course = term (current preselected) → search code/title/section → Add → "Added to My Courses". Section label per campus in config; not yet confirmed from official pages, so it shows "Section". Demo sections use a `DEMO-` prefix and are marked unofficial. Sections and meeting times are private.
- **Empty states:** every list returns an intentional message with an action (share a resource, start a conversation, create a listing, clear filters).
- **Status:** accepted, implemented.

---

### D36 · Visual identity: warm ocean blue (Session 19)
Supersedes the D35 color line.
- **Brand:** ocean blue `#26729d` (brief `#2878a5`, darkened slightly so brand text passes WCAG AA on `--muted`: 5.3:1 white, 4.9:1 background, 4.6:1 muted). Deep `#185b7a` for faculty/staff avatars and emphasis.
- **Neutrals:** background `#f8f7f3`, surface white, text `#17252f`, secondary text `#5a6770` (brief `#64727c` darkened for contrast), border `#e5e4df`.
- **Accents, small details only:** coral (people, active Helpful reaction, Community eyebrow), teal (Academic eyebrow), amber (Housing eyebrow and icon). Each has a text-safe `-ink` variant. No section gets its own background color.
- **Green** `#2f7553` is status only (verified, success, available). Brief `#3f8c68` darkened because it is used as text.
- **Type:** Plus Jakarta Sans for headings (h1–h3), Inter for everything else. Both self-hosted at build by `next/font`.
- **Community feed:** posts sit in one surface divided by lines, not a boxed card each. The detail page keeps the card. Student avatars get one of four warm tints picked from the user id. Color never signals rank or trust.

### D37 · Livelier feed, serif headings, one logo file (Session 20)
- **Fonts:** Ahmad felt the Inter look read as generic. Times New Roman was considered and rejected because it reads as an old school website, which the identity brief rules out. Headings now use Fraunces (warm modern serif, 600/700 only). Body uses Figtree. Supersedes the D36 type line. Set once in `app/layout.tsx`.
- **Post images:** optional `Post.image`. Demo images are drawn SVG placeholders (flyer, study guide page, whiteboard) under `public/demo/posts`, each marked DEMO. No stock photos were fetched. Real photos drop into the same folder.
- **Events and study groups:** event posts show a calendar date block. Events and study groups show up to 4 member avatars and a count ("11 going", "6 in this group").
- **Demo banner:** smaller and neutral gray, so it no longer reads as a warning.
- **Logo:** one component, `components/brand/Logo.tsx` (`LOGO_SRC`). Every place it renders is flagged with a `LOGO:` comment. Browser tab icon is `app/favicon.ico`.

### D38 · California poppy + sage palette (Session 21)
Ahmad felt the ocean blue read as LinkedIn and too professional, and asked for warm poppy orange and sage (his reference images). Supersedes the D36 color lines and the brief's "ocean-blue identity" and "green not dominant" rules.
- **Brand:** poppy orange `#b0450f` for buttons, links, active tab (5.7:1 white, 4.9:1 on muted). Deep `#8f3a10`.
- **Sage:** desktop sidebar `#e9eee2`, muted surfaces `#edefe6`, the featured study tile `#4a6a4c`, contribution graph scale.
- **Neutrals:** cream background `#f7f3ea`, white cards, olive-charcoal text `#27291f`, secondary `#5c6152`.
- **Accents renamed to match:** petal (poppy red, social), sage (academic), golden (housing). Each keeps a text-safe `-ink` value.
- **Status green** `#2e7d4f` stays distinct from sage and always comes with a check icon.
- **Avatars:** FNV-1a hash so similar ids spread across all four tints. Initials use first and last word ("Demo Student J." → "DJ").

### D39 · Backend-integration readiness (Session 22)
From the team's integration pack. No teammate backend code was provided, so nothing is connected yet; the frontend is prepared.
- **Separate auth switch:** `NEXT_PUBLIC_AUTH_MODE` (demo | backend), independent of `NEXT_PUBLIC_DATA_MODE`, so login connects first. `NEXT_PUBLIC_CAMPUS` accepted (old name still works).
- **Auth split:** `services/auth/` = `index.ts` (public API + validation), `demoAuth.ts`, `backendAuth.ts` (teammate wires login here), `authAdapter.ts` (field mapping), `errors.ts`, `sessionEvents.ts`, `types.ts`. Pages import `@/services/auth` as before.
- **Demo flags:** screens use `SHOW_DEMO_AUTH_CONTROLS` / `SHOW_DEMO_DATA_CONTROLS` from config instead of mode strings.
- **Course adapters** added, and the course service's backend path goes through them.
- **Kept on purpose:** `/me/courses` instead of the pack's `getUserCourses(userId)` / `addUserCourse(userId, sectionId)`. The user comes from the session, so a request can't target another student by changing an id. Mode checks stay inside each service function (no per-domain folders), to avoid an unrelated refactor.
- **Errors:** backend text never shown. Community comment and helpful-answer errors were the two places that could; fixed.
- **Verified with a fake local backend:** empty data → empty states with no demo fallback, 500 errors → friendly errors with no leaked text, backend sign-in works, and passwords never reach browser storage.

## Open questions (need an answer before the listed session)

| # | Question | Blocks |
|---|---|---|
| ~~Q1~~ | Answered: East Bay Link (D9). | – |
| ~~Q2~~ | Answered: approved (D8). | – |
| ~~Q3~~ | Superseded by Q9 (D16). | – |
| ~~Q4~~ | Answered D34: stay in OneDrive unless it causes real problems. | – |
| ~~Q5~~ | Answered: D28. | – |
| Q6 | Partly answered D34: Firebase (Auth, Firestore, Storage) unless the backend teammate says otherwise. Still open: the teammate's confirmed config, and the exact campus-email matching rule. | Integration |
| ~~Q7~~ | Answered D34: real checked links where practical, never invented. | – |
| Q8 | Waiting on the teammate's repo URL (D34: don't connect before). | Integration |
| ~~Q9~~ | Answered: D18. | – |
| ~~Q10~~ | Answered: attachments supported in model, mock metadata now (D19). | – |
| ~~Q11~~ | Answered: D21. | – |
| ~~Q12~~ | Answered: D20. | – |
| ~~Q13~~ | Answered: D22. | – |
| ~~Q14~~ | Answered + verified: D23. | – |
| ~~Q15~~ | Answered D34: CSCI 14. | – |
| ~~Q16~~ | Answered D34: pending review first, demo approve. Built. | – |
| ~~Q17~~ | Answered by D33: the whole app, Community included, needs a signed-in account. Only the landing, sign-in, and privacy pages are public. | – |
| ~~Q18~~ | Answered D34: asker marks one helpful answer. Built. | – |
| ~~Q19~~ | Answered D34: generic Student Hub Moderator role. | – |
| ~~Q20~~ | Answered D34: auto-publish after checks, reportable. | – |
| ~~Q21~~ | Answered D34: payments off, concept kept. | – |
| ~~Q22~~ | Answered D34: ends at "Connection accepted". Built. | – |
| ~~Q23~~ | Answered D34: add small dorm items, no furniture, $1,000 cap, no trades. | – |
| ~~Q26~~ | Answered Session 16: only students earn contribution credit (D33). | – |
| ~~Q25~~ | Answered D34: report → needs review → moderator. Built. | – |
| ~~Q24~~ | Answered D34: verified roles publish, students suggest for review. Model updated. | – |
