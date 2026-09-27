# East Bay Link (Student Hub)

A campus community app for students at **Chabot College, Diablo Valley College, and Cal State East Bay**, built for MESA Hack 3.0.

Students today find course help in group chats, housing on unrelated sites, food help across separate programs, and opportunities in email. East Bay Link puts those in one campus-aware place:

| Area | What it answers |
|---|---|
| **Community** | What's happening on campus? Posts, questions, study groups, events. |
| **Academic** | Help with my courses. Student notes, study guides, tips, My Courses. |
| **Discover** | Food & basic needs, campus resources, student marketplace, opportunities. |
| **Housing** | Rooms and roommates near campus, privacy first. |
| **Profile** | My identity, my courses, and how I've helped. |

> **Prototype status:** this is a hackathon build. It runs on **mock data** with **demo authentication**. Nothing here is production authentication, and it is not an official college service.

## Run it

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

Other commands: `npm run build`, `npm run lint`, `npm run typecheck` (generates Next.js route types first, so it also works on a fresh copy).

On first load you land on the public page. Use **Sign in → Continue as the demo student** to jump in, or create an account to walk through sign-up, email verification (simulated), and onboarding.

## Try it as an iPhone user

- **On a laptop:** open `/iphone.html` (for example http://localhost:3000/iphone.html). The real app runs inside an iPhone-sized frame, with buttons to start as the demo student or from the welcome screen, and a QR code for your phone.
- **On an iPhone:** open the app's address in Safari, tap Share, then **Add to Home Screen**. It gets the East Bay Link icon and opens full screen like an app (web app manifest + Apple web app tags in `app/layout.tsx` and `app/manifest.ts`).
- Your phone needs a public address to reach the app, for example a free Vercel deployment of this folder (see the root README).

## Current modes

| Setting | Value | Meaning |
|---|---|---|
| `NEXT_PUBLIC_DATA_MODE` | `mock` (default) | Services read in-memory sample data. Changes last until reload. |
| | `api` | Services call `NEXT_PUBLIC_API_URL`. The backend is not connected yet. |
| `NEXT_PUBLIC_AUTH_MODE` | `demo` (default in mock) | `services/auth/demoAuth.ts` simulates accounts in the browser. **Passwords are never stored, logged, or put in mock data.** |
| | `backend` | `services/auth/backendAuth.ts` calls the team's auth. Can be switched on while data is still mock. Demo-only buttons disappear automatically. |

## Architecture

```
app/ (pages)  →  components/ (UI)  →  services/ (one per domain)  →  mock data  OR  backend API
                                         ↑ the only layer that knows where data comes from
config/  rules, labels, weights, nav      types/  typed models (mirror docs/DATA_CONTRACT.md)
```

- **Components never import mock data or call the backend.** They render what services return.
- **Every service has the same contract in both modes.** Each function has a mock branch and an `api` branch (`if (DATA_MODE === "api") …`). Replacing mock with Firebase or a REST backend changes services, not pages.
- **Rules live in config**, not components: contribution weights (`config/reputation.ts`), marketplace limits (`config/marketplace.ts`), academic integrity rules (`config/academic.ts`), navigation and Discover destinations (`config/app.ts`).

### Where things live

| Domain | Service | Mock data | Pages |
|---|---|---|---|
| Auth + onboarding | `services/auth/` | browser (demo only) | `/welcome` `/login` `/signup` `/verify-email` `/onboarding` |
| Community | `services/community.ts` | `data/mock/posts.ts` | `/`, `/community` |
| Academic resources | `services/academic.ts` | `data/mock/academic.ts` | `/academic`, `/academic/new`, `/academic/mine` |
| Courses + My Courses | `services/courses.ts` | `data/mock/courses.ts` | `/academic/courses`, `/academic/courses/add` |
| Food | `services/food.ts` | `data/mock/food.ts` | `/food` |
| Campus resources | `services/resources.ts` | `data/mock/resources.ts` | `/resources` |
| Marketplace | `services/marketplace.ts` | `data/mock/marketplace.ts` | `/marketplace` |
| Housing | `services/housing.ts` | `data/mock/housing.ts` | `/housing` |
| Profile + reputation | `services/profiles.ts`, `services/contributions.ts`, `services/reputation.ts` | `data/mock/users.ts` + events | `/profile` |

### Adding data

Add records to the service's data source, never to a component. In mock mode that means appending an object of the documented type to the matching `data/mock/*.ts` file (shapes: `types/*.ts`, documented in `docs/DATA_CONTRACT.md`). Pages render whatever the service returns, and every list has an intentional empty state when it returns nothing.

Real data rules: a real resource keeps its official `url`, `sourceUrl`, and `lastVerifiedAt`. Demo records carry `isDemo: true` and show a Demo tag. Class section codes in the demo use a `DEMO-` prefix so they are never mistaken for official CRNs or class numbers.

## What is real, what is mock

| Real | Mock / demo |
|---|---|
| 4 Chabot resources (FRESH Market, Basic Needs, Financial Aid, Tutoring), checked on chabotcollege.edu | All people, posts, listings, housing posts, food deals |
| Chabot course codes and titles (MTH 1, CSCI 14, ENGL 1, …), checked against the catalog | Class sections, terms, meeting times |
| Regional services (911, 988, CalFresh, food banks, transit) link to real sites | Authentication, email verification, moderation decisions |

## Backend integration (intended: Firebase)

Not connected. The plan is in `docs/BACKEND_HANDOFF.md`:

- **Auth:** wire the team's login into `services/auth/backendAuth.ts` and map its response in `services/auth/authAdapter.ts`. Pages don't change.
- **Firestore** backs each service's api branch. Map documents to `types/models.ts` inside the service.
- **Cloud Storage** for academic files and listing photos (validated and scanned server-side).
- **Security Rules / server checks** enforce everything the UI assumes. The frontend hiding something is not security.

## Changing the logo and fonts

- **Logo:** everything goes through `components/brand/Logo.tsx`. Save the file in `public/brand/` and set `LOGO_SRC` there. Replace `app/favicon.ico` for the browser tab. Search the code for `LOGO:` to see every place the logo appears.
- **Fonts:** set once in `app/layout.tsx` (headings: Fraunces, body: Figtree).
- **Colors:** tokens in `app/globals.css`.

## Security and privacy

- Credentials belong to the auth provider. The frontend never stores passwords or tokens in localStorage.
- Authorization is enforced by the backend: ownership checks (only the owner edits their housing post or listing), role checks (only moderators change review status), and read rules (private fields never leave the server).
- Transport uses HTTPS/TLS; data at rest relies on the platform's encryption. No custom cryptography in the frontend.
- Never public: email, phone, student ID, passwords, verification documents, exact home addresses, class sections and meeting times, onboarding needs.
- Authenticated ≠ verified student ≠ verified faculty/staff. A `.edu` email alone never grants a role.

## Docs

`docs/PROJECT_CONTEXT.md` (start here) · `docs/ARCHITECTURE.md` · `docs/DATA_CONTRACT.md` · `docs/BACKEND_HANDOFF.md` · `docs/DECISIONS.md` · `docs/FEATURES.md` · `docs/ROUTES.md` · `docs/SESSION_LOG.md`
