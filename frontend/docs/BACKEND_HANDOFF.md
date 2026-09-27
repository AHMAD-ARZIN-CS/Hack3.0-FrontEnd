# Backend Handoff

For the backend developer. Full field definitions live in **DATA_CONTRACT.md**. TypeScript mirror: `types/models.ts`.

## Connecting the backend (updated Session 22)

Nothing is connected to a real backend yet. The frontend is ready for it: every screen reads through `services/`, and each service has a mock path and a backend path.

**Status words used below**
- **Stub-tested:** the backend path was run against a local fake server (Session 22): real data, zero records, and server errors all behave correctly. Still needs the real backend.
- **Written, untested:** the backend path exists but has not been run.
- **Mock only:** works in the demo, no backend path yet.

Endpoints are the PROPOSED contract in DATA_CONTRACT.md. If the teammate's API differs, change the path in the service and the field mapping in the adapter. Pages do not change.

| Feature | Frontend service | Required backend operation | Status | Notes |
|---|---|---|---|---|
| Auth: session | `services/auth` → `refreshSession` | read current session (`GET /auth/session`) | Stub-tested | Wire teammate login in `services/auth/backendAuth.ts`, map fields in `authAdapter.ts` |
| Auth: sign in | `signIn` | verify email + password (`POST /auth/sign-in`) | Stub-tested | Wrong password and unknown email show the same message. Password never stored |
| Auth: sign up, sign out, reset, verify email, change email | `signUp`, `signOut`, `requestPasswordReset`, `resendVerification`, `changeEmail` | provider equivalents | Written, untested (sign out stub-tested) | Sign-up is students only (D33) |
| Onboarding | `completeOnboarding` | save campus, major, courses, interests, needs (`POST /me/onboarding`) | Written, untested | `needs` are private |
| Profile | `services/profiles` → `getMyProfile`, `getUserProfile` | read own + public profile (`GET /me/profile`, `/users/:id/profile`) | Stub-tested (own) | `normalizeProfile` drops any field not in the contract |
| Current user | `services/user` → `getCurrentUser` | `GET /me` | Stub-tested | |
| Terms | `services/courses` → `getTerms` | list terms for a campus | Stub-tested | Current term first. `normalizeTerm` |
| Section search | `searchSections` | search by course code, title, or section code (CRN/Class Number) | Stub-tested (zero results) | Grouped by course. `normalizeSectionSearch` |
| My Courses | `getMyCourses`, `addUserCourse`, `removeUserCourse` | list/create/delete memberships for the signed-in user | List stub-tested. Add/remove written, untested | Uses `/me/courses` so the user comes from the session, never from an id in the request. 409 = already added |
| Community feed | `services/community` → `getFeed`, `getPost`, `getComments` | list campus posts, one post, comments | Stub-tested (empty + error) | |
| Community actions | `createPost`, `addComment`, `toggleHelpful`, `toggleSave`, `setHelpfulAnswer` | create/mark | Written, untested | Backend enforces one helpful per user, no self-votes |
| Academic resources | `services/academic` → `getAcademicResources`, `getAcademicResource`, `submitAcademicResource` | list approved resources per course, submit for review | Written, untested | Only `approved` items are public. Files go to storage, records keep metadata |
| Housing | `services/housing` → `getHousingPosts`, `getHousingPost`, `createHousingPost` | list/filter, read, create, close own post | List stub-tested (empty + error) | Owner-only edits enforced server-side. Area only, never an address |
| Food + basic needs | `services/food` → `getFoodDeals`, `claimFoodDeal` | list campus food deals, place a hold | List stub-tested | |
| Campus resources | `services/resources` → `getResources` | list campus resources | Stub-tested | `normalizeResource` |
| Marketplace | `services/marketplace` → `getListings`, `createListing` | list, create, update own listing | List stub-tested | No payments |
| Opportunities | none yet | none yet | Mock only (Discover card says "Not open yet") | Community opportunity posts cover it for now |
| Contributions | `services/contributions`, `services/reputation` | server-computed points, badges, activity | Mock only | Must be computed server-side (anti-gaming rules below) |
| Reports + blocks | `services/reports` → `reportContent`, `services/blocks` → `getBlockedUserIds`, `blockUser`, `unblockUser` | create report, list/add/remove blocks | Written, untested | Reporter identity never returned |

## Configuration

| Variable | Values | Meaning |
|---|---|---|
| `NEXT_PUBLIC_DATA_MODE` | `mock` (default) \| `api` | Where app data comes from |
| `NEXT_PUBLIC_AUTH_MODE` | `demo` \| `backend` | Where sign-in comes from. Unset = follows DATA_MODE |
| `NEXT_PUBLIC_API_URL` | URL | Backend base URL |
| `NEXT_PUBLIC_CAMPUS` | `chabot` \| `dvc` \| `csueb` | Default campus (old name `NEXT_PUBLIC_DEFAULT_CAMPUS` still works) |

Recommended order (from the team's integration pack): auth first with `AUTH_MODE=backend` and `DATA_MODE=mock`, then profile and courses with `DATA_MODE=api`, then the rest one area at a time. In that mixed mode the demo data still belongs to the demo student; that is expected until profile is connected.

## Where backend code goes
- Keep the backend in its own repository or folder. Do not paste backend code into pages or components.
- REST backend: set `NEXT_PUBLIC_API_URL`. Requests go through `services/api/client.ts`.
- Firebase from the browser: create one module (for example `services/firebase/client.ts`) that initializes Firebase from the `NEXT_PUBLIC_FIREBASE_*` variables in `.env.example`, and call it only from service files. Security Rules stay in the backend repo.
- Backend field names that differ: map them in `services/api/normalize.ts` (data) or `services/auth/authAdapter.ts` (auth). Do not rename backend fields to match the frontend.
- Records are created through the backend or approved import scripts, never hardcoded into components. An empty backend shows empty states; it never falls back to demo data (tested).

## Security the backend must enforce
The UI hides things for usability. None of that is security.
- Every request: identify the user from the verified session or token, never from a user id in the body or URL.
- Ownership: only the owner edits or closes their housing post, listing, or academic draft. Only the asker picks a helpful answer.
- Roles: only moderators change review status. Faculty/staff roles come from review, never from a `.edu` email alone.
- Private fields never leave the server in public responses: email, phone, student ID, exact address, verification documents, class sections and meeting times, onboarding needs.
- Storage: uploaded files validated and scanned before they are shown. Access rules on the bucket, not in the UI.
- Transport over HTTPS. Encryption at rest from the platform. No custom cryptography.
- Error bodies may be generic. The frontend never shows backend error text to users (tested), but the backend should not put secrets in errors either.

## Scope refined (Session 3)
Priority order for the backend: **academic (courses, resources with file uploads, tips, helpful votes) + profiles/reputation → food deals → housing**. (Updated Session 4: DATA_CONTRACT v0.4.) Marketplace and Community are deferred. Full list in DATA_CONTRACT v0.3 §7a, §7b, §8.
Server-side rules the backend owns: actor from auth token (never request body), one helpful vote per user per target, no self-votes, reputation computed server-side, reporter identity never returned, only `approved` academic content listed publicly, hidden profile offerings never returned in public profile responses, file uploads validated (type, size, scan) before approval.

## Profile: what the backend will need (Session 5)
Frontend is done against mock. To switch to API, the backend must provide:

1. **Endpoints:** `GET /me/profile`, `GET /users/:id/profile`, `GET /users/:id/activity?weeks=26`, `PATCH /me/offerings/:id {visibility}`, `GET /courses?ids=`, later `PATCH /me/profile`, `POST/DELETE /me/offerings`, `GET /users/:id/contributions`. Shapes in DATA_CONTRACT §7b.
2. **Storage (suggested):** `users` (id, displayName, homeCampusId, major?, bio?, verifiedStudent, joinedAt), `user_courses` (userId, courseId, status current|past), `user_interests`, `user_marketplace_categories`, `user_offerings` (id, userId, category, direction, label, linkType?, linkId?, visibility default hidden). Store tags as ids from the shared lists.
3. **Computed server-side:** stats, points, level, levelName, nextLevelAt, badges, activity days. Source = approved academic content, helpful votes (excluding self-votes), later community answers + verified exchanges. Suggest a nightly or on-write aggregate table `user_daily_contributions (userId, date, type, count)`.
4. **Privacy enforcement server-side:** public profile response filters `visibility != "public"` offerings, caps history at 10, and never includes email, phone, student ID, grades, address, or auth provider data. Do not rely on the frontend to hide fields.
5. **Anti-gaming:** count only approved/verified items, dedupe helpful votes per voter, ignore self-votes, daily cap 8 on the graph, remove points when content is removed.
6. **Auth:** `/me/*` from the token. Owner check on `PATCH /me/offerings/:id`.
7. **Time zone:** activity dates in America/Los_Angeles.

## Community: what the backend will need (Session 6)
1. **Endpoints:** see DATA_CONTRACT §8 "COMMUNITY (v0.6)": list/get/create posts, list/create comments, toggle helpful, toggle save, block/unblock, linkable resources, get opportunity.
2. **Storage (suggested):** `posts`, `post_comments`, `post_helpful (postId, userId)`, `post_saves (postId, userId)`, `user_blocks (blockerId, blockedId)`, `reports`, `opportunities`. Posts store `linked_type` + `linked_id`.
3. **Linked previews:** return `linkedPreview` with each post (join to the linked table). If the target is deleted/hidden, return `available: false` instead of failing.
4. **Roles:** `role`, `roleVerified`, `roleTitle` on users. `roleVerified` only via an admin/moderator action (optionally backed by a directory check), **never** from email domain alone. Reject `announcement` from anyone not verified faculty-staff/organization.
5. **Feed rules:** campus-scoped, `status = active`, exclude authors the viewer blocked, newest first, cursor or page pagination. Do not inject Marketplace/Food/Housing listings.
6. **Moderation:** reports stored with reporter id (never returned). Suggested: N reports → `hidden` until reviewed. Removed posts return status + empty body. Removed comments return placeholders.
7. **Validation server-side:** body 10–2000, title ≤120, ≤3 tags, comment ≤1000, meeting required for study-group/event, link required for resource-share and must be the author's own approved resource.
8. **Rate limits / anti-spam:** per-user post and comment limits; helpful votes dedupe per user, no self-votes. Helpful on posts may later feed reputation (Q18).
9. **Open:** Q17 visibility of Community to signed-out visitors.

## Academic Exchange: what the backend will need (Session 9, design v0.7)
1. **Operations** (DATA_CONTRACT §8 "ACADEMIC (v0.7)"):
   - courses: list by campus/search, get by id, get by ids, offerings per course
   - resources: list approved (filters course, offering, type, author, free, sort helpful/newest), get detail, open/access (signed URLs), my submissions by status
   - submission: upload file, create draft, edit draft/rejected, submit with declaration, withdraw
   - helpful: put/delete per user per target
   - review: queue, start/approve/reject/remove with reason code, review history
   - tips: list approved per course, create (submitted or auto-approved), review
2. **Storage (suggested):** `courses`, `instructors` (id, campusId, displayName, department), `course_offerings` (courseId, term, instructorId), `academic_resources`, `attachments` (resourceId, storage key, mime, size, scan status), `academic_tips`, `academic_access` (resourceId, userId, grantType), `review_events`, `helpful_votes` (shared), `reports` (shared).
3. **Enforcement server-side:**
   - public queries return `approved` only. Authors see their own drafts. Reviewers see the queue.
   - submit requires all 3 declaration flags + title/description + body or ≥1 scanned attachment.
   - reject/remove require a reason code. Removal reverses reputation points.
   - no instructor ratings/aggregates anywhere. Do not add instructor list/search endpoints.
   - no `downloadUrl` in lists. Signed short-lived URLs only via the access endpoint.
   - reject `access.model = "paid"` until D27 is lifted. Never allow paid `notes`.
   - helpful: one per user per target, no self-votes.
4. **Files:** type allow-list (pdf, png, jpg, docx, txt, md), size limit (~10 MB, ≤5 per resource), malware scan before approval, strip metadata from images.
5. **Reputation inputs:** approved resources/tips + helpful votes received. Not access counts, not uploads, not drafts.
6. **Open:** Q19 who reviews. Defaults applied: tips auto-approve (Q20), paid off (Q21).
7. **Needed first for the working read path (Session 10):** `GET /courses?campusId=` with approved `resourceCount`/`tipCount`, `GET /courses/:id`, `GET /academic-resources` (filters: courseId, resourceType, freeOnly, paidOnly, q, sort), `GET /academic-resources/:id`, `POST /academic-resources/:id/access`, `GET /courses/:id/tips`, `PUT/DELETE /helpful/...`, `POST /reports`. Frontend switch point: `services/academic.ts` api branches already call these paths.

## Housing: what the backend will need (Session 11)
1. **Endpoints:** `GET /housing` (filters: campusId, type, maxPriceCents, maxDistanceMiles, roomType, availableBy, verifiedOnly), `GET /housing/:id`, `POST /housing`, `PATCH /housing/:id/visibility`, `POST /housing/:id/close`, `POST /contact-requests`. All require a signed-in student.
2. **Storage:** `housing_posts` (area_id, not address), `contact_requests` (postId, fromUserId, message, status). Area list + distances served from config or a `housing_areas` table.
3. **Server-side checks:** reject phone numbers, emails, street addresses, and deposit/payment language in title, description, and messages. Reject protected-trait preference ids. Price $100–$5,000. One request per post per user. Owner-only visibility/close.
4. **Profile:** public profile housing status comes from active posts with `profileVisibility = public`. Never return price, area, or description on the profile endpoint.
5. **Verification:** `verifiedStudent` from the student-status check only. Never label it as safety or background screening.
6. **Later (Q22):** accept/decline requests, messaging or controlled contact reveal, edit posts, photo upload with face/address stripping.

## Food: what the backend will need (Session 12)
1. **Endpoints:** `GET /food-deals` (campusId, maxDistanceMiles, maxPriceCents, availableNow, dietaryTag), `GET /food-deals/:id`, `POST /food-deals/:id/claims`, `POST /claims/:id/cancel`.
2. **Storage:** `businesses` (verified flag set by admin only), `food_deals`, `food_claims` (quantity, status, holdExpiresAt, pickupCode).
3. **Rules server-side:** status computed from quantity + pickupEnd, atomic quantity decrement on claim (no overselling), one active hold per deal per student, max 2, holds expire and restore quantity, no payment processing.
4. **Later:** business dashboard to create deals (F9), mark picked-up, notifications, no-show limits.

## Discover: what the backend will need (Session 13, design only)
1. **No Discover tables.** Discover composes existing endpoints. Please do not create copies of deals/resources/listings/opportunities for it.
2. **Every list endpoint must support `q` + `campusId`:** `/resources` (already in contract), `/food-deals` (match title, restaurant, cuisine, dietary tags), `/opportunities`, `/listings`. Same `Paged<T>` shape so `total` works for counts.
3. **Cheap counts:** `pageSize=1` must be fast (count query), since the Discover home shows one count per category.
4. **New planned endpoints:** `GET /opportunities?campusId=&q=&kind=`, `GET /opportunities/:id`, `POST /opportunities` (verified faculty/staff/org). Marketplace endpoints now defined in DATA_CONTRACT §4 / §8.
5. **Optional later:** `GET /discover/summary?campusId=` (all counts in one call) and `GET /discover/search?q=&campusId=` returning `DiscoverResultGroup[]`. Frontend can switch to them inside `services/discover.ts` without UI changes.

## Marketplace: what the backend needs (Session 14, D31)
1. **Storage:** `listings` (fields in DATA_CONTRACT §4), `listing_images` (attachment metadata), `contact_requests` (shared with housing), `user_blocks` (userId, blockedUserId, createdAt), `reports` (shared).
2. **Server rules:** sellerId from the token. Campus-scoped lists. Hide `under-review`/`removed` from everyone but the seller (removed: seller too). Exclude sellers the viewer blocked. One request per listing per viewer, only for `active` listings. Re-run the text checks in `config/marketplace.ts` and `lib/textSafety.ts` (contact info, addresses, advance payment/shipping, exam material, prohibited items). Price integer 0–100000 cents.
3. **Photos:** `POST /listings/:id/images` multipart, JPG/PNG/WebP, ≤5 MB, ≤4. Strip EXIF location data. Scan before showing. Frontend api mode currently refuses photos with a message until this exists.
4. **Moderation:** reports with `targetType = marketplace-listing` move a listing to `under-review` at a threshold you choose (Q25). Reviewers set `visible` or `removed`.
5. **Profile:** public profile offerings include listings with `profileVisibility = public`, `status = active`, `moderationStatus = visible` only. `PATCH /me/offerings/off_listing_<id>` or `PATCH /listings/:id` both work for the switch.
6. **Blocks:** one list for all features. Filter Community posts/comments and listings by it. Never tell the blocked user.
7. **No payments.** Do not add payment fields or processors.

## Contributions + reputation (Session 15, D32)
1. **Ledger table:** `contribution_events` (fields in DATA_CONTRACT §7b). Append on approval and helpful vote. Delete on unvote and on moderation removal of the source.
2. **Compute server-side** from events: stats, points (per-voter cap 5), level, badges with `earnedAt`, activity (own contributions only, daily cap 8), history. Mirror `config/reputation.ts` exactly or serve it.
3. **Never create events** for logins, views, opens, posts, comments, saves, or helpful marks on event/opportunity/announcement posts.
4. **Privacy:** never return `actorId` or who voted in public responses. Only counts.
5. **Profile endpoints** keep their shape. `stats` gains `communityPostsHelpful` and `verifiedResources`.

## Auth (Session 16, D33)
1. **You own credentials.** The frontend sends email + password once to your sign-in/sign-up endpoint (or provider SDK) and keeps nothing. Please use an httpOnly, Secure, SameSite cookie for the session. No tokens for localStorage.
2. **Session shape:** `AuthSession` (DATA_CONTRACT §9). Keep `emailVerified`, `studentVerification`, and `roleVerified` separate.
3. **Students only** at sign-up. Enrollment verification method is open (Q6). New accounts start `pending`.
4. **Protect every API route** server-side. The frontend route gate is only UX.
5. **Password reset + sign-in errors** must not reveal whether an email has an account. Rate-limit sign-in, reset, and resend.
6. **Onboarding** writes `homeCampusId`, profile `major`, `academic.currentCourseIds`, `interests`. `needs` are private: store on the account, never return them in any profile response.
7. **Contribution credit** only for `role = student` (`CONTRIBUTION_ELIGIBLE_ROLES`).

## Firebase plan (Session 17, D34 / Q6) · not integrated yet
Intended backend: Firebase, unless the backend teammate confirms something else. Nothing is wired until their config exists.
- **Auth:** Firebase Authentication (email + password, email verification, password reset). Replace the api branch of `services/auth.ts` with the Firebase SDK. Session = Firebase ID token handled by the SDK; profile keyed by `uid`.
- **Verification chain:** account → email verified → campus email domain matched → `studentVerification: "verified"`. Faculty/staff: separate role review, never from `.edu` alone. No student ID image uploads.
- **Firestore collections (suggested):** `users/{uid}` (profile, `homeCampusId`, private `needs`), `academicResources`, `academicTips`, `reviewEvents`, `posts` + `posts/{id}/comments`, `contributionEvents`, `housingPosts`, `contactRequests`, `listings`, `reports`, `blocks`, `opportunities`, `resources`.
- **Cloud Storage:** academic files and listing photos. Validate type/size, scan, strip EXIF before anything is public.
- **Security rules must enforce** what the UI assumes: own-profile writes only, `needs`/`email` never readable by others, only `approved` academic content and `published` opportunities readable publicly, only moderators change review/moderation status, contribution events written server-side (Cloud Functions), never by clients.
- **Mapping:** services keep their signatures. Firestore docs map to `types/models.ts` inside each service's api branch (or `services/api/normalize.ts`). No component changes.

## Moderation (Session 17, D34)
- Role: "Student Hub Moderator" (prototype). Needs a `role: moderator` claim server-side.
- Academic: `POST /academic-resources/:id/review { decision, reasonCode }`. Uploads start `submitted` and are never public before approval. Approval writes an `academic-resource-approved` contribution event.
- Tips: auto-publish after automated checks, reportable, removable.
- Marketplace: a report records `reportCount` and may flag `under-review`. Moderator decides keep / restrict / remove. Never auto-remove by count.
- Opportunities: verified faculty/staff/orgs publish; student suggestions start `pending-review`.
- Helpful answer: `POST /posts/:id/helpful-answer { commentId | null }`, asker only, question posts only, one per post; write/move/delete the `community-answer-helpful` event.

## Courses + membership (Session 18, D35)
1. **Collections:** `terms`, `courseSections` (with `source` metadata for imports), `users/{uid}/courses` (UserCourse).
2. **Official schedule import (later):** fill `courseSections` from the public schedule with `sectionCodeOfficial: true`, `source.kind: "official-import"`, `source.url`, `source.retrievedAt`. Until then, demo rows stay `DEMO-` prefixed.
3. **Server rules:** a user writes only their own `courses`; sections/meeting info are readable only by that user; public profile returns course ids (current/past) only.
4. **Endpoints:** listed in DATA_CONTRACT v0.14. `POST /me/courses` with a section for a course the user already has attaches the section (no duplicate).

## Authorization reminders (all areas)
The UI hides edit controls from non-owners, but that is not security. The backend must reject: edits to housing posts, listings, academic resources, and posts by anyone but the owner; review/moderation changes by non-moderators; reads of private fields (email, needs, sections, blocks, reporter identity).

## What the frontend needs from you

1. A base URL (goes into `NEXT_PUBLIC_API_URL`).
2. The endpoints in DATA_CONTRACT §8, or tell us your equivalents. We adapt in the service layer, not the UI.
3. JSON responses shaped like the models. If your field names differ, that's fine. Send a sample response and we write a normalizer.
4. List responses in the `Paged<T>` shape, or tell us your pagination style.
5. Errors as `{ "error": { "code", "message" } }` with proper HTTP status.
6. CORS allowing the frontend origin (localhost:3000 + deploy URL).

## Request formats

- GET filters as query params, names exactly as in ListQuery/feature queries (`campusId`, `q`, `category`, `maxPriceCents`...).
- Booleans as `true`/`false` strings.
- POST bodies JSON, `Content-Type: application/json`.

## Authentication expectations (proposed)

- Public reads: resources, food deals, events, study groups.
- Student-only: housing reads, all writes (claims, listings, contact requests, join, support).
- Header: `Authorization: Bearer <token>`.
- "Verified student" = identity check the backend performs (e.g. campus email). Frontend only displays the flag.

## If you use Firebase

That's fine. Two options, both keep the UI untouched:
- **A.** Cloud Functions / API routes that return the JSON above. Frontend uses `fetch`. Cleanest.
- **B.** Firestore SDK called **only inside `services/api/`**, mapping docs to models. Faster to start, more coupling.

Tell us which.

## Unresolved questions

- Q6: backend stack and auth provider.
- Where do real resource records come from (manual entry, spreadsheet import)?
- Who can create food deals during the demo (seeded only)?
- Do you store `distanceMiles`, or should the frontend compute it from coordinates? (We prefer backend-computed, coarse.)
- Image upload: storage bucket or URL-only for the hackathon?

## Privacy asks

- Never return phone/email/street address for students.
- Housing endpoints require auth.
- Don't log free-text housing descriptions to third-party analytics.
