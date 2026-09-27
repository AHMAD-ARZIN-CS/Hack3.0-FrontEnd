# Data Contract

Version: **0.16 (Session 22)**. Change log at bottom. Shared with the backend developer.
Code mirror: `types/models.ts`. If you change one, change the other and log it in DECISIONS.md.

## Model status legend

| Status | Meaning |
|---|---|
| **LIVE** | In `types/models.ts`, has mock data + service, used by UI |
| **TYPED** | In `types/models.ts`, no mock data or service yet |
| **PLANNED** | Defined only in this document. Not in code yet. Field list may change |
| **DEFERRED** | Out of refined MVP (D13). Kept for later. Backend should not prioritize |

| Model | Pillar | Status |
|---|---|---|
| Campus, Paged, ListQuery, PublicUser | shared | LIVE |
| Resource | basic needs (support) | LIVE |
| CurrentUser | profile | LIVE (mock user) |
| CourseOffering, AcademicResource, AcademicTip, Attachment | academic | **LIVE** (mock read path, Session 10) |
| AcademicAccess | academic | LIVE in mock as a per-viewer set (accessCount) |
| Instructor, ReviewEvent, SubmissionDeclaration | academic | TYPED |
| HelpfulVote | academic / trust | TYPED (Community uses its own toggle endpoint) |
| ContentReportInput | trust | LIVE (mock, Community) |
| **UserProfile, ProfileAcademic, ProfileOffering, ContributionStats, ContributionActivity, Badge, Contribution** | profile | **LIVE** (mock) |
| Course | academic | LIVE (5 Chabot courses, approved counts) |
| Business, FoodDeal, FoodDealClaim | food | **LIVE** (mock, Session 12) |
| HousingPost, HousingQuery, NewHousingPostInput, ContactRequest (housing) | housing | **LIVE** (mock, Session 11) |
| PublicUser.level | profile | LIVE |
| HousingPost.profileVisibility | housing | LIVE (drives profile housing offerings) |
| **MarketplaceListing, ListingQuery, NewListingInput, ListingStatus, ModerationStatus** | marketplace | **LIVE** (mock, Session 14, D31) |
| **Post, Comment, LinkedEntityRef, LinkedEntityPreview, PostMeeting, Opportunity** | community | **LIVE** (mock) |
| PublicUser.role / roleVerified / roleTitle | shared | LIVE |
| StudyGroup, CampusEvent (standalone) | community | DEFERRED (study groups/events are posts for now) |

## 0. Conventions

| Rule | Detail |
|---|---|
| IDs | strings. Backend may use Firestore doc IDs, UUIDs, anything. |
| Dates | ISO 8601 UTC strings: `"2026-09-26T18:00:00Z"`. Date-only fields: `"2026-10-01"`. |
| Money | **integer cents** USD. `$12.50` → `1250`. `0` = free. |
| Distance | `distanceMiles`, approximate, measured from **campus center**, not from the user. |
| Campus | every campus-scoped record has `campusId` (`"chabot"`, `"dvc"`, `"csueb"`). |
| Demo data | `isDemo: true` on every mock record. UI shows a "Demo" tag. |
| Optional | marked **opt** below. Missing optional = omit the field or send `null`. Frontend treats both the same. |
| Lists | wrapped in `Paged<T>` (see §1). |
| Errors | `{ "error": { "code": "NOT_FOUND", "message": "..." } }` with a matching HTTP status. |

**Never in any public response:** personal phone numbers, personal emails, street addresses of students, student ID numbers, precise user location, date of birth.

## 1. Shared

### Campus
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | `"chabot"` |
| name | string | ✓ | `"Chabot College"` |
| shortName | string | ✓ | `"Chabot"` |
| city | string | ✓ | |
| center | `{lat:number, lng:number}` | ✓ | approximate campus center |
| websiteUrl | string | opt | |

### Paged&lt;T&gt;
```json
{ "items": [ ... ], "total": 42, "page": 1, "pageSize": 20 }
```

### ListQuery (all list endpoints accept these as query params)
| Param | Type | Req | Notes |
|---|---|---|---|
| campusId | string | ✓ | |
| q | string | opt | free-text search |
| page | number | opt | 1-based, default 1 |
| pageSize | number | opt | default 20, max 50 |
| verifiedOnly | boolean | opt | |

### PublicUser (embedded wherever a person appears)
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| displayName | string | ✓ | first name + last initial: `"Maya R."` |
| campusId | string | ✓ | |
| verifiedStudent | boolean | ✓ | means campus-email/identity verified. **Not** a safety guarantee. |
| avatarUrl | string | opt | |
| level | number | opt | Contribution level (1+). Shown next to author names |

## 2. Resource · LIVE

| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| campusId | string \| `"regional"` | ✓ | `"regional"` = not owned by one campus (county/state services) |
| servesCampusIds | string[] | opt | regional only: campuses it's relevant to. Omit = all campuses (911, FAFSA) |
| title | string | ✓ | |
| category | ResourceCategory | ✓ | `food` `housing` `financial` `academic` `transportation` `safety` `health` `campus-services` |
| needs | NeedId[] | ✓ | `study` `food` `housing` `money` `community` `safety` |
| description | string | ✓ | 1–3 sentences, plain language |
| provider | string | ✓ | who runs it |
| url | string | ✓ | official page |
| locationName | string | opt | building/room |
| address | string | opt | public office address only |
| phone | string | opt | public office line only |
| hours | string | opt | free text |
| eligibility | string | opt | |
| onCampus | boolean | ✓ | |
| verified | boolean | ✓ | info checked against official source |
| lastVerifiedAt | string | opt | ISO |
| isEmergency | boolean | opt | safety call-out |
| isDemo | boolean | opt | |

Example:
```json
{
  "id": "res_chabot_pantry",
  "campusId": "chabot",
  "title": "Campus food pantry",
  "category": "food",
  "needs": ["food"],
  "description": "Free groceries and snacks for enrolled students. Bring your student ID.",
  "provider": "Chabot College (verify office name)",
  "url": "https://www.chabotcollege.edu/",
  "onCampus": true,
  "verified": false,
  "isDemo": true
}
```
Filters: `category`, `need`, `onCampus`.
Campus rule: return records where `campusId == query.campusId`, plus regional records whose `servesCampusIds` is empty or contains `query.campusId`.
Sort (mock): emergency first → category matches the need → on campus → A–Z.

## 3. Business + FoodDeal · LIVE (mock, `services/food.ts`)

### Business
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| name | string | ✓ | Demo names must be obviously fictional |
| campusIds | string[] | ✓ | campuses it serves |
| cuisine | string | opt | |
| areaName | string | ✓ | `"Downtown Hayward"` |
| address | string | opt | public business address |
| verifiedBusiness | boolean | ✓ | |
| isDemo | boolean | opt | |

### FoodDeal
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| restaurantId | string | ✓ | → Business.id |
| restaurantName | string | ✓ | denormalized for cards |
| campusId | string | ✓ | |
| title | string | ✓ | |
| description | string | opt | |
| imageUrl | string | opt | |
| originalPriceCents | number | ✓ | |
| studentPriceCents | number | ✓ | must be < original |
| quantityAvailable | number | ✓ | |
| pickupStart | string | ✓ | ISO |
| pickupEnd | string | ✓ | ISO, > pickupStart |
| pickupAreaName | string | ✓ | |
| distanceMiles | number | opt | from campus |
| dietaryTags | string[] | opt | `vegetarian`, `halal`, `vegan`, `gluten-free` |
| verified | boolean | ✓ | business verified |
| status | `available` \| `sold-out` \| `expired` | ✓ | server-computed from quantity and pickupEnd. Lists exclude `expired` |
| cuisine | string | opt | |
| viewerClaim | FoodDealClaim | opt | viewer's active hold |
| isDemo | boolean | opt | |

Filters: `maxDistanceMiles`, `maxPriceCents`, `availableNow`, `dietaryTag`.

### FoodDealClaim ("I want this", no payment)
| Field | Type | Req |
|---|---|---|
| id, dealId, userId | string | ✓ |
| quantity | number | ✓ |
| status | `held` \| `picked-up` \| `cancelled` \| `expired` | ✓ |
| holdExpiresAt, createdAt | string | ✓ |
| pickupCode | string | ✓ | short code shown at pickup, e.g. `EBL-4821` |

Hold rules: max 2 per hold, one active hold per deal per student, hold lasts 45 min or until pickupEnd, cancel restores quantity. **No payment in the app**: student pays the business at pickup.

## 4. Marketplace · LIVE (mock, `services/marketplace.ts`) · D31

Discover subsection. Student-to-student exchange of physical items. Code: `types/marketplace.ts`, rules in `config/marketplace.ts`.
Not here: notes and study material (Academic), rooms (Housing), food (Food). No payments in the app.

### MarketplaceListing
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| sellerId | string | ✓ | set from auth token |
| seller | PublicUser | ✓ | embedded. Never contact info |
| campusId | string | ✓ | |
| title | string | ✓ | 3–80 chars |
| category | `textbook` `supplies` `clothing` `electronics` `other` | ✓ | `furniture` dropped (Q23: pickup at home) |
| description | string | ✓ | 10–1000 chars, plain text. No phone, email, address, advance payment, shipping |
| priceCents | number | ✓ | integer, 0 (free) to 100000 ($1,000) |
| condition | `new` `like-new` `good` `fair` | ✓ | |
| images | Attachment[] | ✓ | 0–4. JPG/PNG/WebP, ≤5 MB each. Same Attachment as §7a. `previewUrl` = hosted image |
| courseCode | string | opt | "MTH 1", ≤12 chars, uppercased |
| isbn | string | opt | 10 or 13 digits, dashes stripped |
| status | `active` `pending` `sold` | ✓ | seller-controlled lifecycle |
| moderationStatus | `visible` `under-review` `removed` | ✓ | moderator-controlled. Separate from status |
| profileVisibility | `public` `hidden` | ✓ | default `hidden`. Drives the profile offering |
| viewerRequested | boolean | opt | per viewer |
| createdAt | string | ✓ | |
| updatedAt | string | opt | |
| isDemo | boolean | opt | |

Removed from v0.3 draft: `verifiedSeller` (use `seller.verifiedStudent`), `imageUrl` (now `images`), `originalPriceCents` (not needed, avoids "deal" framing).

### Visibility rules
- Public lists: `moderationStatus = visible`, `status` in `active|pending` (active first, then newest), same campus, blocked sellers excluded for the viewer.
- Detail: `removed` → 404 for everyone. `under-review` → 404 except for the seller. `sold` is viewable but takes no requests.
- Seller's own list (`sellerId = me`): all statuses, `visible` + `under-review`.

### ListingQuery (extends ListQuery)
`q` (title, description, courseCode, isbn, category label), `category`, `condition`, `maxPriceCents` (0 = free only), `verifiedOnly`, `sellerId`.

### NewListingInput
campusId, title, category, description, priceCents, condition, profileVisibility (req), courseCode, isbn (opt). Photos upload separately (see §8). Server sets id, sellerId, seller, images, status `active`, moderationStatus `visible`, createdAt.

### Validation (frontend mirrors, server must enforce)
- Contact info, street addresses, advance payment / deposits / gift cards / shipping → rejected.
- Exams, answer keys, test banks, solution manuals, textbook PDFs → rejected.
- Notes/study guides → rejected with a pointer to Academic. Rooms/roommates → Housing. Homemade food → Food.
- Weapons, alcohol, vapes, drugs, prescription medicine, fake IDs → rejected.

### ContactRequest (listing)
`targetType: "listing"`, `targetId` = listing id. One per listing per viewer. Only for `active`, visible listings, not own, not blocked. Same message checks as descriptions.

### Profile integration
Offering id `off_listing_<listingId>`, category `marketplace`, direction `offering`, label `Selling: <title>` or `Giving away: <title>`, link `{ type: "marketplace-listing", id }`. Public profile: active + visible + `profileVisibility = public`. Own profile: all active listings with a switch. Sold → hidden.

### Safety
- Report listing: `ContentReportInput { targetType: "marketplace-listing", reason }`. New reason `prohibited-item`.
- Report user: `targetType: "profile"`.
- Block: shared list for Marketplace and Community (`/me/blocks`). Private. Hides the blocked user's listings, posts, comments. Blocks requests to them.
- Moderation: backend moves a listing to `under-review` after reports (threshold is backend-owned) and to `removed` after review.

## 5. Housing ⚠ privacy-sensitive · LIVE (mock, `services/housing.ts`) · D22, D28

Design goal: **student ↔ verified student discovery** with the minimum data needed to decide "should I reach out?"

### HousingPost
| Field | Type | Req | Notes |
|---|---|---|---|
| id, authorId | string | ✓ | |
| author | PublicUser | ✓ | embedded (profile preview) |
| campusId | string | ✓ | |
| type | `room-available` \| `looking-for-roommate` | ✓ | "I have housing / need roommate" vs "I need housing" |
| title | string | ✓ | ≤80 |
| description | string | ✓ | 20–1200, plain text. Server rejects phone numbers, emails, street addresses, payment/deposit requests |
| areaId, areaName | string | ✓ | approximate area from a fixed list. **Never a street address** |
| distanceMiles | number | opt | approximate from campus center (area table), rounded to 0.5 |
| monthlyRentCents | number | opt | room-available |
| budgetMaxCents | number | opt | looking-for-roommate |
| availableFrom | string | ✓ | `YYYY-MM-DD` (replaces `moveInDate`) |
| leaseLengthMonths | number | opt | |
| roomType | `private` \| `shared` | opt | |
| amenities | string[] | ✓ | ids: furnished, utilities-included, wifi, laundry, parking, private-bath, near-transit, kitchen (rooms only) |
| preferences | string[] | ✓ | lifestyle ids only: quiet, study-focused, non-smoking, early-riser, night-owl, pets-ok, no-pets, guests-ok. **No protected traits** (fair housing) |
| verifiedStudent | boolean | ✓ | current student confirmed. **Not a background check, not a safety guarantee** |
| status | `active` \| `closed` \| `removed` | ✓ | browse shows active only |
| profileVisibility | `public` \| `hidden` | ✓ | **default hidden.** Single source of truth for the housing status on the author's profile |
| viewerRequested | boolean | opt | per viewer |
| createdAt | string | ✓ | |
| isDemo | boolean | opt | |

**Excluded on purpose:** street address, unit, coordinates, phone, email, photos of people, age, gender, deposit, payment details.

### HousingQuery
campusId (req); type, maxPriceCents (rent for rooms, budget for seekers), maxDistanceMiles, roomType, availableBy (`YYYY-MM-DD`), verifiedOnly, authorId, page, pageSize (opt).

### NewHousingPostInput
campusId, type, title, description, areaId, priceCents, availableFrom, profileVisibility (req); leaseLengthMonths, roomType, amenities, preferences (opt). No address, deposit, or payment fields exist.

### ContactRequest (housing)
`POST /contact-requests { targetType: "housing", targetId, message }`. Message ≤300, same contact-info/payment checks. One request per post per viewer. Recipient = post author. Status `sent` → `accepted` / `declined` (accept/decline + messaging are later).

### Profile integration
Profile housing offerings are **derived** from the user's active housing posts: public profile shows only posts with `profileVisibility: "public"`, as a general label ("Housing available" / "Looking for roommate") + link to the post. Offering id format: `off_housing_<postId>`. Toggling on the profile or the post updates the same field.

## 6. Community · LIVE (`types/community.ts`, mock + `services/community.ts`)

Principles (D25): human, campus-local, useful. Listings from Housing/Food/Marketplace are **never** auto-posted. Posts can link to entities elsewhere. Faculty/staff/org posts are not official college statements.

### Author roles (on PublicUser)
| Field | Type | Req | Notes |
|---|---|---|---|
| role | `student` \| `faculty-staff` \| `organization` | opt | default `student` |
| roleVerified | boolean | opt | set **only** by a review process (e.g. directory match + moderator confirmation). An institutional email alone never sets it |
| roleTitle | string | opt | "Mathematics instructor", "Student club" |

### Post
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| authorId | string | ✓ | |
| author | PublicUser | ✓ | embedded, includes role fields |
| campusId | string | ✓ | feed is campus-scoped |
| postType | `question` \| `discussion` \| `resource-share` \| `study-group` \| `event` \| `opportunity` \| `announcement` | ✓ | `announcement` only for verified faculty-staff/organization |
| title | string | opt | max 120 |
| body | string | ✓ | plain text, 10–2000 chars |
| courseId | string | opt | ACADEMIC tag (course) |
| tags | string[] | ✓ | topic tags, lowercase, max 3. Separate from courseId |
| attachments | `{attachmentId, fileName, fileType, fileSize}[]` | ✓ | metadata only, empty in MVP |
| linkedEntity | `{ type, id }` | opt | type: `academic-resource` \| `resource` \| `opportunity` \| `study-group` \| `housing-post` \| `profile`. Required for `resource-share` |
| linkedPreview | LinkedEntityPreview | opt | display-ready summary (see below). Backend should fill it |
| meeting | `{ startsAt, endsAt?, locationName, recurring? }` | opt | required for `study-group` and `event` |
| image | `{ url, alt, width, height, isDemo? }` (PostImage) | opt | one image. `alt` required. Uploads validated and scanned server-side before `url` is set |
| going | `{ count, preview: PublicUser[] }` (PostGoing) | opt | `event` and `study-group` only. `preview` max 4, public display info only |
| helpfulCount | number | ✓ | |
| commentCount | number | ✓ | active comments only |
| viewerMarkedHelpful, viewerSaved | boolean | opt | per viewer |
| status | `active` \| `hidden` \| `removed` | ✓ | feed shows `active` only. Detail of a removed post returns status with empty body |
| createdAt | string | ✓ | |
| updatedAt | string | opt | |
| isDemo | boolean | opt | |

### LinkedEntityPreview
| Field | Type | Req | Notes |
|---|---|---|---|
| type, id | | ✓ | same as linkedEntity |
| title | string | ✓ | |
| subtitle | string | opt | "Study guide · MTH 1 · by Demo S." |
| description | string | opt | |
| actionLabel | string | ✓ | "View study guide", "View opportunity", "View resource" |
| href | string | opt | internal route or external URL. Omitted when the target page isn't built |
| external | boolean | opt | |
| available | boolean | ✓ | false if deleted/hidden/not found |

### Comment
id, postId, authorId, author (PublicUser), body (plain text, max 1000), status (`active` \| `hidden` \| `removed`), createdAt (req), isDemo (opt). Removed comments come back as placeholders with empty body.

### Opportunity (for linking; Discover › Opportunities page later)
id, campusId, title, organization, description (req); deadline (ISO date), url (official page), isDemo (opt).

### Queries and inputs
- `PostQuery`: campusId (req), postType, courseId, authorId, savedOnly, q, page, pageSize.
- `NewPostInput`: campusId, postType, body (req); title, courseId, tags, linkedEntity, meeting (opt). Server sets author from auth token.
- `NewCommentInput`: postId, body.

### Moderation
- Report: `POST /reports` with targetType `community-post` or `community-comment` and a reason (`harassment`, `spam`, `personal-info`, `integrity`, `inaccurate`, `other`, …).
- Block: viewer-level. Blocked users' posts and comments are excluded from that viewer's responses.
- Status `hidden` (pending review) and `removed` (taken down) never appear in feeds.

### StudyGroup, CampusEvent · DEFERRED as standalone entities
Study groups and events are **posts** with a `meeting` for now. Separate entities (membership, RSVPs) come later and can then be linked via `linkedEntity`.

## 7a. Academic Exchange · LIVE read path (mock, `services/academic.ts`), design v0.7 (D26, D27)

Purpose: keep useful, **original** student knowledge from disappearing each semester.

### Relationships

```
Campus 1───* Course 1───* CourseOffering *───0..1 Instructor
                 │                ▲                (context only: name as in public schedule)
                 │                │ 0..1
                 ├───* AcademicResource ───* Attachment (metadata)
                 │         │ 1
                 │         ├──* AcademicAccess   (open / author / reviewer / purchase[deferred])
                 │         ├──* ReviewEvent      (status history, backend-owned)
                 │         ├──* HelpfulVote      (shared model, targetType academic-resource)
                 │         └──* ContentReport    (shared model)
                 │
                 └───* AcademicTip (text) ──0..1 CourseOffering, ──* HelpfulVote, ──* ContentReport

User (PublicUser) 1───* AcademicResource / AcademicTip   (authorId)
```

Entity evaluation:
| Entity | Decision | Why |
|---|---|---|
| Course | keep | exists, LIVE for lookups |
| CourseOffering | keep | term + optional instructor context |
| Instructor | keep, minimal | name/department only. **No ratings, stats, or instructor pages.** No `/instructors` list endpoint |
| AcademicResource | keep | notes, study guides, practice, study strategies. Files allowed |
| AcademicTip | keep | short text: course tips + short study strategies |
| AcademicFeedback | **drop** | covered by shared `HelpfulVote` (content feedback) + `ContentReport` (problems). No stars |
| AcademicAccess | keep | counts access for free resources now; holds purchases later |
| ReviewEvent | keep (backend) | audit trail for the review workflow |
| `instructorId` on resource | **drop** | reached through `courseOfferingId`. Avoids duplicate/conflicting instructor data |

### Course
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | campus-scoped slug `chabot-mth-1` |
| campusId, code, title | string | ✓ | code exactly as the campus writes it |
| subject | string | opt | |
| catalogUrl | string | opt | |
| catalogVerified | boolean | ✓ | code + title checked against official catalog |
| resourceCount, tipCount | number | opt | approved only |
| isDemo | boolean | opt | |

### Instructor (context only)
id, campusId, displayName (req); department, isDemo (opt). **Forbidden fields:** rating, score, difficulty, grade distribution, "easy", reviews, rank, any aggregate.

### CourseOffering
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| courseId, campusId | string | ✓ | |
| term | string | ✓ | "Fall 2026" |
| instructorId | string | opt | |
| instructorName | string | opt | denormalized for display |
| isDemo | boolean | opt | |

### Attachment
| Field | Type | Req | Notes |
|---|---|---|---|
| attachmentId | string | ✓ | from `POST /uploads` |
| fileName | string | ✓ | |
| fileType | string | ✓ | MIME. Allowed (suggested): pdf, png, jpg, docx, txt, md |
| fileSize | number | ✓ | bytes. Suggested max 10 MB, 5 files per resource |
| previewUrl | string | opt | first-page image / thumbnail |
| downloadUrl | string | opt | short-lived signed URL, only when viewer has access |

### AcademicResource
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| authorId | string | ✓ | |
| author | PublicUser | ✓ | embedded |
| campusId, courseId | string | ✓ | |
| courseOfferingId | string | opt | term/instructor context |
| context | `{ term?, instructorName? }` | opt | denormalized display copy of the offering |
| title | string | ✓ | ≤120 |
| description | string | ✓ | plain text ≤1000 |
| resourceType | `notes` \| `study-guide` \| `practice` \| `study-strategy` | ✓ | |
| access | `{ model: "free" }` \| `{ model: "paid", priceCents }` | ✓ | paid **DEFERRED** (D27) |
| attachments | Attachment[] | ✓ | may be empty |
| body | string | opt | inline plain text |
| tags | string[] | ✓ | topic tags ≤5 |
| reviewStatus | ReviewStatus | ✓ | see workflow |
| reviewReason | `{ code, note? }` | opt | author-only, on rejected/removed |
| helpfulCount | number | ✓ | from HelpfulVote |
| accessCount | number | ✓ | distinct students who opened/downloaded. **Not** used for reputation |
| viewerMarkedHelpful, viewerHasAccess | boolean | opt | per viewer |
| createdAt | string | ✓ | |
| updatedAt, submittedAt, approvedAt | string | opt | |
| isDemo | boolean | opt | |

### AcademicTip
id, authorId, author, campusId, courseId, category (`course-tip` \| `study-strategy`), body (≤500, plain text), reviewStatus, helpfulCount, createdAt (req); courseOfferingId, context, reviewReason, viewerMarkedHelpful, updatedAt, isDemo (opt).
Good: "Weekly quizzes matter." "Start the project early." "Chapter 4 was important." Not allowed: instructor judgments, "easy A", grades.

### Review workflow

```
 draft ──submit──▶ submitted ──pick up──▶ under-review ──approve──▶ approved ──▶ (visible, counts for reputation)
   ▲                                          │
   └────────── author edits ◀── rejected ◀────┘ reject (reasonCode + note)

 approved / submitted / under-review ──▶ removed   (moderator after report, or author withdraws)
```

| Transition | Who | Rule |
|---|---|---|
| create → draft | author | any time |
| draft → submitted | author | requires title, description, ≥1 attachment **or** body, and `SubmissionDeclaration` (original, noExamMaterial, noCopyrightedOrInstructorMaterial) |
| submitted → under-review | reviewer/system | |
| under-review → approved / rejected | reviewer | reject needs a `ReviewReasonCode` |
| rejected → draft | author | edit and resubmit |
| approved → removed | moderator / author | removal reverses reputation points |
| approved + edited | author | MVP: not allowed. Withdraw and resubmit |
| tips | system | may auto-approve after automated checks (profanity, instructor-attack keywords, length), still reportable |

Visibility: other students see **approved** only. Authors see all their own. Reviewers see submitted/under-review.
Reason codes: `not-original`, `exam-material`, `copyrighted`, `instructor-material`, `lecture-notes-for-sale`, `personal-attack`, `wrong-course`, `low-quality`, `other`.

### AcademicAccess
id, resourceId, userId, grantType (`open` \| `author` \| `reviewer` \| `purchase`), createdAt (req); priceCentsPaid, paymentRef (purchase only).
Free: one row per user on first open/download. `accessCount` = distinct users.

### ReviewEvent (backend-owned)
id, targetType, targetId, fromStatus, toStatus, actor (`author` \| `reviewer` \| `system`), createdAt (req); reasonCode, note (opt).

### Paid resources · DEFERRED (D27)
Allowed only when all are true: payments approved (F11), legal/policy review done, resource `approved`, `resourceType` is **not** `notes`, author declares the material is not a recording of class presentations (CA Ed Code §66450), author is a verified student in good standing. Until then the backend rejects `access.model = "paid"`.

### HelpfulVote, ContentReport
Shared models (see Community/§7b). targetType `academic-resource` / `academic-tip`. One helpful per user per target, no self-votes.

## 7b. Profile / Reputation · LIVE (`types/profile.ts`, mock + `services/profiles.ts`)

Rules (D21, D22, D24): reputation comes only from useful, verified contributions. People are never rated. Tags are split by category. Offerings are hidden unless the user makes them public.

**Never in any profile response:** email, phone, student ID, grades/GPA, residential address, exact location, date of birth, gender, age.

### UserProfile (extends PublicUser)
| Field | Type | Req | Notes |
|---|---|---|---|
| id, displayName, campusId, verifiedStudent | | ✓ | from PublicUser. `campusId` = home campus |
| avatarUrl | string | opt | |
| major | string | opt | free text |
| bio | string | opt | max 200 chars, no contact info |
| academic | ProfileAcademic | ✓ | ACADEMIC tags = courses |
| interests | string[] | ✓ | INTERESTS tag ids (config `INTEREST_TAGS`) |
| marketplaceCategories | string[] | ✓ | MARKETPLACE tag ids (config `MARKETPLACE_TAGS`) |
| offerings | ProfileOffering[] | ✓ | NEEDS/OFFERINGS. Public view: only `visibility: "public"` |
| stats | ContributionStats | ✓ | |
| points | number | ✓ | computed server-side |
| level | number | ✓ | computed |
| levelName | string | ✓ | "Newcomer", "Contributor", "Helper", "Guide", "Mentor" |
| nextLevelAt | number | opt | points needed for next level. Omit at top level |
| badges | Badge[] | ✓ | computed |
| recentContributions | Contribution[] | ✓ | newest first. Public view max 10 |
| joinedAt | string | ✓ | ISO, month precision is enough |
| isDemo | boolean | opt | |

### ProfileAcademic
`currentCourseIds: string[]`, `pastCourseIds: string[]` (both required, may be empty). Values are Course ids. The frontend resolves them with `GET /courses?ids=a,b,c`.

### Tag categories (never one generic array)
| Category | Field | Source of allowed ids |
|---|---|---|
| ACADEMIC | `academic.currentCourseIds`, `academic.pastCourseIds` | Course records |
| INTERESTS | `interests` | `INTEREST_TAGS` (soccer, basketball, hiking, programming, gaming, music, art, cooking, photography, volunteering, entrepreneurship, cybersecurity, data-science, transfer) |
| MARKETPLACE | `marketplaceCategories` | `MARKETPLACE_TAGS` (books, supplies, electronics, clothing, furniture) |
| NEEDS / OFFERINGS | `offerings[].category` | `OFFERING_CATEGORIES` (housing, food, study-group, tutoring, rides) |

Backend should validate ids against the same lists (or serve them from `GET /tags`).

### ProfileOffering (replaces ActiveOffering from v0.4)
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| category | string | ✓ | OFFERING_CATEGORIES id |
| direction | `seeking` \| `offering` | ✓ | |
| label | string | ✓ | general only: "Looking for roommate", "Housing available" |
| link | `{ type: "housing-post" \| "marketplace-listing" \| "academic-resource" \| "study-group", id }` | opt | details live on that page |
| visibility | `public` \| `hidden` | ✓ | **default `hidden`** |

Sensitive needs (e.g. seeking food) should stay hidden. Backend must never include hidden offerings in `GET /users/:id/profile`.

### ContributionEvent (D32) · backend-owned ledger
Every profile number, badge, graph cell, and history item is computed from these. Nothing else earns credit.

| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✓ | |
| userId | string | ✓ | who earns credit |
| type | `academic-resource-approved` `academic-tip-approved` `helpful-vote-received` `community-post-helpful` `verified-resource-contribution` `verified-exchange` | ✓ | last two: defined, **no source yet** |
| sourceType | `academic-resource` `academic-tip` `community-post` `resource` `marketplace-listing` | ✓ | |
| sourceId | string | ✓ | the item that helped |
| actorId | string | opt | voter / reviewer / other side. **Internal only, never in public responses** |
| title, courseId, kind | string | opt | display context copied at event time |
| occurredAt | string | ✓ | ISO |
| isDemo | boolean | opt | |

When events are created (server rules):
- `academic-resource-approved` / `academic-tip-approved`: when a reviewer approves. Once per item. Drafts, submitted, rejected, removed content: nothing.
- `helpful-vote-received`: another student marks the item helpful. One per student per item. No self-votes. Unmark deletes it. Community posts earn this only for credited types (`question`, `discussion`, `resource-share`, `study-group`). Events, opportunities, announcements earn nothing.
- `community-post-helpful`: the first helpful vote from another student on a credited community post. Deleted if all votes are removed.
- Content removed by moderation: delete every event with that source.
- Never an event: logins, page views, time spent, downloads/opens, posting, commenting, saving, reactions.

Frontend mock: `services/contributions.ts` (ledger) + `services/reputation.ts` (pure scoring). Endpoints do not expose events. Profiles return the computed results below.

### ContributionStats (computed from events)
| Field | Counts |
|---|---|
| resourcesApproved | `academic-resource-approved` events |
| tipsApproved | `academic-tip-approved` events |
| helpfulVotesReceived | `helpful-vote-received` events |
| studentsHelped | distinct `actorId` across helpful votes |
| communityPostsHelpful | `community-post-helpful` events · **new v0.11** |
| communityAnswersHelpful | always 0 until answers exist (Q18) |
| verifiedResources | `verified-resource-contribution` events · **new v0.11**, always 0 for now |
| verifiedExchanges | `verified-exchange` events, always 0 for now |

All required numbers. The profile shows a metric only when its events have a live source (config `LIVE_PROFILE_STATS`). Verified metrics are hidden today.

### Points, levels, badges (single source: `config/reputation.ts`; backend mirrors)
| Event | Points |
|---|---|
| academic-resource-approved | 10 |
| academic-tip-approved | 3 |
| helpful-vote-received | 2 (max 5 votes per voter per recipient count, anti-gaming) |
| community-post-helpful | 4 |
| verified-resource-contribution | 8 (no source yet) |
| verified-exchange | 5 (no source yet) |
| anything else | **0** |

Levels: 1 Newcomer (0), 2 Contributor (20), 3 Helper (60), 4 Guide (150), 5 Mentor (300).
Badges (Student Hub recognition, **not** college certification, credentials, or institutional awards; fixed thresholds, never a ranking):
| id | name | rule |
|---|---|---|
| resource-contributor | Resource Contributor | 1 approved resource |
| course-contributor | Course Contributor | 3+ approved resources or tips in one course |
| community-helper | Community Helper | 3 community posts found helpful |
| helpful-10 | Helpful | 10 helpful votes |
| helped-25 | Helped 25 students | 25 distinct voters |
| top-contributor | Top Contributor | 150 points |
Badge: `{ id, name, description, earnedAt }`. `earnedAt` = time of the event that first met the rule.
Removed in v0.11: first-resource, tip-giver, helpful-50, course-guide.

### ContributionActivity (graph)
| Field | Type | Req | Notes |
|---|---|---|---|
| userId | string | ✓ | |
| startDate, endDate | string | ✓ | `"YYYY-MM-DD"`, 26 weeks by default |
| days | ContributionDay[] | ✓ | only days with count > 0 required |
| total | number | ✓ | sum of counts in range |

ContributionDay: `date` (`YYYY-MM-DD`), `count`, `byType?` (`{ "academic-resource": 2, "community-post": 1 }`).
**Counts only the person's own recognized contributions:** resource approved, tip approved, community post found helpful (later: verified contributions). Helpful votes received add points but are not graph days (they are someone else's action). Daily cap 8. Date = event day, campus time zone (America/Los_Angeles).

### Contribution (history item)
type (`academic-resource` | `academic-tip` | `community-post` | `community-answer` | `verified-resource` | `verified-exchange`), id (source id), title, createdAt (req); courseId, kind, helpfulCount (live count) (opt). Built from history events, newest first. Public view max 10.

### Reviews of people · not in MVP (D21)

## 7. CurrentUser
PublicUser + `homeCampusId`. Email and auth identity stay with the auth provider and are not part of this model.

## 9. Auth + onboarding · LIVE on demo auth (`types/auth.ts`, `services/auth/`) · D33, D39

### AuthSession (what the frontend receives; no password, no token)
| Field | Type | Req | Notes |
|---|---|---|---|
| userId | string | ✓ | |
| displayName | string | ✓ | public form "First L." |
| email | string | ✓ | own session only, never in public responses |
| emailVerified | boolean | ✓ | account authenticated only when true |
| onboardingComplete | boolean | ✓ | |
| homeCampusId | string | opt | set by onboarding |
| studentVerification | `unverified` `pending` `verified` | ✓ | enrollment check by backend. New accounts `pending` |
| role | `student` `faculty-staff` `organization` | ✓ | self sign-up is always `student` |
| roleVerified | boolean | ✓ | role review, never from email alone |

SignUpInput: displayName, email, password, confirmsStudent (must be true), acceptsTerms (must be true).
SignInInput: email, password. OnboardingInput: homeCampusId (req), major?, standing? (`new` `continuing` `transfer-track` `returning`), currentCourseIds, interests (public tags), needs (private, never on profile).
Errors: `invalid-credentials` (generic for unknown email or wrong password), `email-in-use`, `weak-password` (min 8), `invalid-email`, `not-student`, `terms-required`.

Endpoints (PROPOSED shape; the teammate's real auth replaces them inside `services/auth/backendAuth.ts`, with field mapping in `services/auth/authAdapter.ts`, Q6):
| Method | Path | Returns | Notes |
|---|---|---|---|
| POST | `/auth/sign-up` | AuthSession | sends verification email |
| POST | `/auth/sign-in` | AuthSession | sets httpOnly session cookie |
| POST | `/auth/sign-out` | 204 | |
| GET | `/auth/session` | AuthSession or 401 | |
| POST | `/auth/password-reset` `{email}` | 204 always | no enumeration |
| POST | `/auth/verification/resend` | 204 | rate-limited |
| PATCH | `/auth/email` `{email}` | AuthSession | resets emailVerified |
| POST | `/me/onboarding` OnboardingInput | AuthSession | also writes profile major/courses/interests |

## 8. Expected API endpoints

Base: `${NEXT_PUBLIC_API_URL}` (e.g. `https://api.example.com/v1`). JSON in and out.

| Method | Path | Returns | Auth |
|---|---|---|---|
| GET | `/campuses` | `Campus[]` | none |
| GET | `/resources?campusId=&category=&need=&q=` | `Paged<Resource>` | none |
| GET | `/resources/:id` | `Resource` | none |
| GET | `/food-deals?campusId=&maxDistanceMiles=&maxPriceCents=&availableNow=` | `Paged<FoodDeal>` | none |
| GET | `/food-deals/:id` | `FoodDeal` | none |
| POST | `/food-deals/:id/claims` `{quantity}` | `FoodDealClaim` (with pickupCode) | student |
| POST | `/claims/:id/cancel` | `FoodDealClaim` | owner |
| **MARKETPLACE (v0.10, D31)** | | | |
| GET | `/listings?campusId=&q=&category=&condition=&maxPriceCents=&verifiedOnly=&sellerId=&page=` | `Paged<MarketplaceListing>` (visibility rules §4) | student |
| GET | `/listings/:id` | `MarketplaceListing` | student |
| POST | `/listings` `NewListingInput` | `MarketplaceListing` | student |
| POST | `/listings/:id/images` (multipart, ≤4 files) | `Attachment[]` | seller. **Not wired in the frontend yet** (api mode rejects photos with a message) |
| PATCH | `/listings/:id` `{ status? , profileVisibility? }` | `MarketplaceListing` | seller |
| POST | `/contact-requests` `{ targetType: "listing", targetId, message }` | `ContactRequest` | student |
| GET | `/housing?campusId=&type=&maxPriceCents=&maxDistanceMiles=&roomType=&availableBy=&verifiedOnly=` | `Paged<HousingPost>` (active only) | **student** |
| GET | `/housing/:id` | `HousingPost` | **student** |
| POST | `/contact-requests` `{targetType,targetId,message}` | `ContactRequest` | student |
| GET | `/me` | `CurrentUser` | student |
| **PLANNED (refined MVP)** | | | |
| **ACADEMIC (v0.7)** | | | |
| GET | `/courses?campusId=&q=&subject=` | `Paged<Course>` | none |
| GET | `/courses?ids=a,b` | `Course[]` | none |
| GET | `/courses/:id` | `Course` (with approved counts) | none |
| GET | `/courses/:id/offerings` | `CourseOffering[]` (term + instructorName) | none |
| GET | `/academic-resources?campusId=&courseId=&courseOfferingId=&resourceType=&authorId=&freeOnly=&sort=&q=` | `Paged<AcademicResource>` (**approved only**, no downloadUrl) | none (TBD Q17) |
| GET | `/academic-resources/:id` | `AcademicResource` (approved, or own any status) | none / author |
| POST | `/academic-resources/:id/access` | `{ attachments: Attachment[] }` with signed downloadUrls; records AcademicAccess. Paid without purchase → `402` | student |
| GET | `/me/academic-resources?reviewStatus=` | `Paged<AcademicResource>` (drafts, submitted, rejected…) | author |
| POST | `/uploads` (multipart) | `Attachment` (scanned, type/size checked) | student |
| POST | `/academic-resources` `NewAcademicResourceInput` | `AcademicResource` (draft) | student |
| PATCH | `/academic-resources/:id` | `AcademicResource` (draft/rejected only) | author |
| POST | `/academic-resources/:id/submit` `SubmissionDeclaration` | `AcademicResource` (submitted) | author |
| POST | `/academic-resources/:id/withdraw` | `AcademicResource` (removed) | author |
| GET | `/academic-resources/:id/review-history` | `ReviewEvent[]` | author / reviewer |
| GET | `/review-queue?type=&campusId=` | `Paged<AcademicResource \| AcademicTip>` | reviewer |
| POST | `/academic-resources/:id/review` `{ decision: "start" \| "approve" \| "reject" \| "remove", reasonCode?, note? }` | `AcademicResource` | reviewer |
| GET | `/courses/:id/tips?courseOfferingId=&category=&sort=` | `Paged<AcademicTip>` (approved only) | none (TBD) |
| POST | `/academic-tips` `NewAcademicTipInput` | `AcademicTip` (submitted or auto-approved) | student |
| POST | `/academic-tips/:id/review` | `AcademicTip` | reviewer |
| PUT / DELETE | `/helpful/:targetType/:targetId` | `{ helpfulCount, viewerMarkedHelpful }` | student, not author |
| | *Frontend note (Session 10):* `AcademicResourceQuery.paidOnly` added for the Paid filter (only used when paid is enabled). | | |
| POST | `/reports` `ContentReportInput` | `{ id }` | student |
| GET | `/users/:id/profile` | `UserProfile` (public view: public offerings only, history ≤10) | none (TBD: student-only?) |
| GET | `/users/:id/activity?weeks=26` | `ContributionActivity` | same as profile |
| GET | `/users/:id/contributions?type=&page=` | `Paged<Contribution>` | same as profile |
| GET | `/me/profile` | `UserProfile` (own view, all offerings) | student |
| PATCH | `/me/profile` `ProfileUpdateInput` | `UserProfile` | student |
| PATCH | `/me/offerings/:id` `{ visibility }` | `ProfileOffering` | owner |
| POST / DELETE | `/me/offerings`, `/me/offerings/:id` | `ProfileOffering` | owner (later) |
| GET | `/courses?ids=a,b,c` | `Course[]` | none |
| GET | `/tags` | `{ interests, marketplace, offeringCategories }` (optional; frontend has config fallback) | none |
| PATCH | `/housing/:id/visibility` `{ profileVisibility }` | `HousingPost` (profile status updates with it) | owner |
| GET | `/badges` | `Badge[]` | none |
| POST | `/housing` `NewHousingPostInput` | `HousingPost` | student |
| POST | `/housing/:id/close` | `HousingPost` | owner |
| **COMMUNITY (v0.6)** | | | |
| GET | `/posts?campusId=&postType=&courseId=&authorId=&savedOnly=&q=&page=` | `Paged<Post>` (active only, blocked authors excluded) | student (TBD) |
| GET | `/posts/:id` | `Post` | student (TBD) |
| POST | `/posts` `NewPostInput` | `Post` | student / faculty-staff / organization |
| GET | `/posts/:id/comments` | `Comment[]` | student (TBD) |
| POST | `/posts/:id/comments` `{ body }` | `Comment` | student |
| POST | `/posts/:id/helpful` (toggle) | `{ helpfulCount, viewerMarkedHelpful }` | student, not author |
| POST | `/posts/:id/save` (toggle) | `{ viewerSaved }` | student |
| GET | `/me/blocks` | `string[]` (blocked user ids) | student |
| POST | `/me/blocks` `{ userId }` · POST `/me/blocks/:userId/remove` | `204` | student |
| GET | `/me/linkable-resources` | `LinkedEntityPreview[]` (own approved academic resources) | student |
| GET | `/opportunities/:id` | `Opportunity` | none |

Endpoints for standalone study groups/events are **DEFERRED**.

Auth header (proposed): `Authorization: Bearer <token>`. Mechanism is an open question (BACKEND_HANDOFF.md).

## Change log
- 0.16 (2026-09-27, Session 22, D39): `Term` gains optional `academicYear`, `termType` (fall|spring|summer|winter), `startDate`, `endDate`. `CourseSection` gains optional `location` (private, like `meetingInfo`). Course responses accept `courseCode` as an alias for `code`. Course, term, and My Courses list endpoints may return a bare array or `{items}` (other domains still expect the documented shape). A section is shown as official only when `sectionCodeOfficial` is true AND `source.url` is set. Auth sessions from the backend are never treated as demo. New config: `NEXT_PUBLIC_AUTH_MODE` (demo | backend), `NEXT_PUBLIC_CAMPUS`.
- 0.15 (2026-09-27, Session 20): Post gains optional `image` (PostImage) and `going` (PostGoing). Display only, no new endpoints. Backend fills `going` from RSVPs/group membership when those exist.
- 0.14 (2026-09-27, Session 18, D35): Course schedule + membership: `Term` {id, campusId, name, isCurrent}, `CourseSection` {id, campusId, termId, courseId, sectionCode, sectionCodeOfficial, instructorName?, meetingInfo?, modality? (in-person|online|hybrid), source {kind: official-import|demo, url?, retrievedAt?}}, `UserCourse` {id, userId, courseId, course, termId?, sectionId?, section?, status current|past, addedAt?}, `AddUserCourseInput` ({sectionId} or {courseId, termId}). Endpoints: `GET /terms?campusId=`, `GET /course-sections/search?campusId=&termId=&q=` (grouped `{course, sections}[]`, q matches code, title, sectionCode), `GET /me/courses`, `POST /me/courses`, `DELETE /me/courses/:courseId`. Sections and meeting info are private to the owner; public profiles list course ids only.
- 0.13 (2026-09-27, Session 17, D34): Resource adds `sourceUrl` (real resources; with `lastVerifiedAt`). Post adds `helpfulAnswerCommentId`, Comment adds derived `isHelpfulAnswer`; new `POST /posts/:id/helpful-answer {commentId|null}` (asker only, question posts only). ContributionEventType adds `community-answer-helpful` (5 pts), ContributionSourceType adds `community-comment`, ContributionEvent/Contribution add `parentId`; `communityAnswersHelpful` is now live. HousingPost adds `viewerRequestStatus`. ListingCategory adds `dorm`; MarketplaceListing adds `reportCount` (moderator/seller only); one report sets `moderationStatus: "under-review"` (NEEDS_REVIEW), never auto-removal. Opportunity adds `sourceUrl`, `submittedBy`, `source` (`faculty-staff` `organization` `student-suggestion`), `reviewStatus` (`pending-review` `published` `rejected` `removed`); only published is shown. Academic uploads: status `submitted` is shown as "Pending review" and is never public; reviewer role is "Student Hub Moderator".
- 0.12 (2026-09-27, Session 16): §9 Auth + onboarding (AuthSession, SignUpInput, SignInInput, OnboardingInput, auth endpoints). Only students earn contribution credit (config `CONTRIBUTION_ELIGIBLE_ROLES`).
- 0.11 (2026-09-26, Session 15): ContributionEvent ledger (D32). ContributionStats adds `communityPostsHelpful`, `verifiedResources` and is now computed from events. ContributionType adds `community-post`, `verified-resource`. Points table by event type, per-voter helpful cap. New badge set (Resource Contributor, Course Contributor, Community Helper, Helpful, Helped 25, Top Contributor) with `earnedAt`. Graph excludes votes received.
- 0.10 (2026-09-26, Session 14): Marketplace LIVE on mock (§4, D31). MarketplaceListing: categories `textbook supplies clothing electronics other` (furniture dropped), `images: Attachment[]` (replaces `imageUrl`), `moderationStatus`, `profileVisibility`, `viewerRequested`, `updatedAt`. Removed `verifiedSeller`, `originalPriceCents`. ListingQuery: `sellerId`, `maxPriceCents=0` = free. New `PATCH /listings/:id`, `POST /listings/:id/images`, `GET /me/blocks`. ReportTargetType adds `marketplace-listing`, ReportReason adds `prohibited-item`. ProfileOffering.link type adds `marketplace-listing`, OFFERING_CATEGORIES adds `marketplace`.
- 0.9 (2026-09-26, Session 12): Food LIVE on mock. FoodDeal adds `cuisine`, `viewerClaim`. FoodDealClaim adds `pickupCode`. New `POST /claims/:id/cancel`. ReportTargetType adds `food-deal`.
- 0.8 (2026-09-26, Session 11): Housing LIVE on mock. HousingPost: `areaId` + `areaName` (fixed area list), `availableFrom` (replaces `moveInDate`), `amenities`, required `preferences`, status adds `removed`, `viewerRequested`. HousingQuery: `maxPriceCents` (replaces `maxRentCents`), `availableBy`, `authorId`. New NewHousingPostInput, `POST /housing/:id/close`. Profile housing offerings now derived from housing posts (`off_housing_<postId>`). ReportReason adds `scam`, `discrimination`.
- 0.7 (2026-09-26, Session 9): Academic Exchange design. Added Instructor (context only), AcademicAccess, ReviewEvent, SubmissionDeclaration, ReviewStatus (draft/submitted/under-review/approved/rejected/removed), ReviewReasonCode, AccessModel (paid DEFERRED). AcademicResource: `kind`→`resourceType` (+ `study-strategy`), `status`→`reviewStatus`, `courseOfferingId`, `context`, `access`, `accessCount`, `submittedAt/approvedAt`; no `instructorId` (via offering). AcademicTip: `category`, `reviewStatus`. ModerationStatus removed from academic. AcademicFeedback rejected in favor of shared HelpfulVote + ContentReport. Full academic endpoint list.
- 0.6 (2026-09-26, Session 6): Community LIVE on mock. Old `Post {kind, supportCount, officialChannelUrl}` replaced by new Post (postType, linkedEntity/linkedPreview, meeting, tags, attachments, status, helpful/save). Added Comment, LinkedEntityRef/Preview, PostMeeting, Opportunity, PublicUser.role/roleVerified/roleTitle, ReportTargetType `community-post`/`community-comment`, ReportReason `harassment`. Removed old study-group/event/post endpoints from §8.
- 0.5 (2026-09-26, Session 5): Profile foundation LIVE on mock. UserProfile reshaped: `major`, `academic {currentCourseIds, pastCourseIds}` (replaces `courseIds`), `interests`, `marketplaceCategories`, `offerings: ProfileOffering[]` (replaces `activeOfferings`/ActiveOffering), `levelName`, `nextLevelAt`, `recentContributions`. ContributionStats renamed/extended (`resourcesApproved`, `tipsApproved`, `communityAnswersHelpful`, `verifiedExchanges`). New ContributionActivity/ContributionDay. New endpoints: `/users/:id/activity`, `PATCH /me/offerings/:id`, `/courses?ids=`, optional `/tags`.
- 0.4 (2026-09-26, Session 4): Ahmad's answers to Q9–Q14. AcademicPost replaced by **AcademicResource** (may have attachments) + **AcademicTip** (text). Added Course.catalogVerified, CourseOffering, Attachment, ModerationStatus, ContributionStats, ActiveOffering, HousingPost.profileVisibility (default hidden). HelpfulVote/ContentReport targets updated. NeedId `books` → `study`. Academic + profile models now TYPED in `types/academic.ts`, `types/profile.ts`.
- 0.3 (2026-09-26, Session 3): refined MVP (D13). Added status legend. PLANNED: Course, AcademicPost, HelpfulVote, ContentReport, UserProfile, Badge, Contribution, PublicUser.level, academic/profile/report endpoints, POST /housing. DEFERRED: MarketplaceListing, StudyGroup, CampusEvent, Post.
- 0.2 (2026-09-26, Session 2): added optional `Resource.servesCampusIds` so county services only show for nearby campuses.
- 0.1 (2026-09-26, Session 1): initial draft.
