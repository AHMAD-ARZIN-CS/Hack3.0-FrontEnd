# Student Hub

One campus-local place where East Bay students find each other and the help that already exists: questions, study help, housing, food, campus resources, and a student marketplace.

Built for **MESAU Hacks 3.0**.

## Problem

Student resources and knowledge exist, but they are scattered across college websites, offices, group chats, marketplaces, and individual people. A student who needs a tutor, a room, or a meal has to know where to look first.

## Solution

Student Hub brings them into one campus-aware space:

- **Community**: questions, study groups, events, and opportunities from your campus
- **Academic Exchange**: student-made notes and study guides per course, plus My Courses
- **Housing**: rooms and roommates near campus, by area only (never an address)
- **Discover**: food and basic needs, campus resources, marketplace
- **Marketplace**: textbooks, supplies, and dorm items between students
- **Profiles and contributions**: credit for helping others. Content can be marked helpful; people are never rated

## Initial campuses

- Chabot College
- Diablo Valley College
- Cal State East Bay

## What's in this repository

This repository combines two working parts built by two teammates. Each runs on its own.

| Folder | What it is | Status |
|---|---|---|
| [`frontend/`](frontend/) | **East Bay Link**: the full Student Hub web app for all three campuses. Next.js. | Runs in **demo mode**: sample data, simulated sign-in. Ready to connect to a backend through its service layer. |
| [`backend/`](backend/) | **CSUEB Link**: a Flask app for CSUEB students with real accounts, posts by category, comments, and profiles, stored in SQLite. | **Working** with a real database and real sign-in. Copied unchanged from [Jiafei8/mesauhacks](https://github.com/Jiafei8/mesauhacks). |

The two parts are **not connected to each other yet**. The frontend's `docs/BACKEND_HANDOFF.md` lists exactly which backend operations each screen needs.

## Key features

**Frontend (East Bay Link)**
- Sign up (students only), email verification step, onboarding, sign out, protected routes
- Campus switcher: every list is filtered by campus
- Community feed with post types, helpful votes, saved posts, a helpful answer on questions, report and block
- Academic Exchange: course hubs, student resources with a review step before they go public, My Courses (term → course → section)
- Housing with filters, private contact requests, and area-only locations
- Food and basic needs, campus resources (4 real Chabot services, checked against official pages)
- Marketplace with categories, conditions, and contact by request (no payments)
- Profiles with contribution stats and badges computed from helping, not activity
- Responsive: phone tabs, tablet, and a desktop sidebar
- Installs on an iPhone home screen (app icon, full-screen launch) and includes an iPhone sandbox page at `/iphone.html`
- Deliberate empty, loading, and error states on every data screen

**Backend (CSUEB Link)**
- Register with a CSUEB email, log in, log out (passwords hashed with Werkzeug)
- Login required for community pages
- Posts with categories: Study Help, Roommate Request, Safety, Food Assistance, Financial Assistance
- Filter posts by category, open a post, comment
- User profile page with that user's posts
- CSRF protection on every form (Flask-WTF)

## Architecture

```
Frontend (Next.js pages and components)
  → services/ (one per feature)  ─┬─ demo: in-browser sample data
                                   └─ api:  HTTP backend  → adapters map fields to frontend models
  → Authentication / Database / Storage (backend)

Backend (Flask)
  browser → Flask routes (csueb/link.py) → SQLite (instance/csueb.sqlite)
  server-rendered HTML templates, session cookie login
```

Pages never talk to data directly. Switching the frontend from demo to a real backend changes the service files and two settings, not the pages. Details: [`frontend/docs/ARCHITECTURE.md`](frontend/docs/ARCHITECTURE.md).

## Tech stack

| Part | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react icons, ESLint |
| Backend | Python 3, Flask, Flask-WTF / WTForms, Werkzeug password hashing, SQLite |

## Setup

Requirements: Node.js 20+ and npm, Python 3.10+.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

On the landing page choose **Sign in → Continue as the demo student**, or create an account to walk through sign-up and onboarding.

Other commands: `npm run build`, `npm run lint`, `npm run typecheck`.

### Backend

```bash
cd backend
python -m venv .venv
# macOS/Linux: source .venv/bin/activate    Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask --app csueb init-db       # creates instance/csueb.sqlite (erases it if it exists)
flask --app csueb run           # http://127.0.0.1:5000
```

Register with an `@csueastbay.edu` (or `@horizon.csueastbay.edu`) email, then sign in.

## Try it as an iPhone user

**Sandbox on a laptop.** Run the frontend and open http://localhost:3000/iphone.html. The real app runs inside an iPhone-sized frame. Use **Start as demo student** or **Start from the welcome screen**, then tap around inside the phone.

**On your own iPhone.** The phone needs a public address, so deploy the frontend once (free):

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import this repository.
3. Set **Root Directory** to `frontend`. Leave everything else as default (no environment variables needed for demo mode).
4. Click **Deploy**. Vercel gives you a link like `https://<project>.vercel.app`.

Then on the iPhone: open that link in Safari, tap **Share → Add to Home Screen**. East Bay Link gets its own icon and opens full screen like an app. On a laptop, `https://<project>.vercel.app/iphone.html` shows the phone frame plus a QR code to scan.

## Environment variables

Frontend (`frontend/.env.example`, names only):

| Variable | Values | Meaning |
|---|---|---|
| `NEXT_PUBLIC_DATA_MODE` | `mock` (default), `api` | Where app data comes from |
| `NEXT_PUBLIC_AUTH_MODE` | `demo`, `backend` | Where sign-in comes from |
| `NEXT_PUBLIC_API_URL` | URL | Backend base URL in `api` mode |
| `NEXT_PUBLIC_CAMPUS` | `chabot`, `dvc`, `csueb` | Default campus |

Backend: no environment file. Flask reads optional settings from `backend/instance/config.py` (not committed). Set `SECRET_KEY` there before any real deployment.

## Demo

- **Frontend demo mode** (default): all people, posts, listings, and food deals are sample data marked **Demo**. Sign-in is simulated in the browser and never stores passwords. Class sections use a `DEMO-` prefix so they are never mistaken for official CRNs. Real data: 4 Chabot resources and Chabot course codes and titles, checked on official college pages.
- **Backend**: everything is real. Accounts, posts, and comments are saved in the local SQLite database you create with `init-db`.

## Security notes

- Passwords: frontend demo never stores them. Backend stores only Werkzeug hashes.
- Backend `SECRET_KEY` defaults to `dev` in the code. Fine for a local demo, must be replaced through `instance/config.py` before hosting.
- Housing shows areas only. Emails, class sections, and onboarding needs never appear on public profiles in the frontend.
- The frontend never shows raw backend error text to users.
- No credentials, `.env` files, or databases are committed (see `.gitignore`).

## Tested

- Frontend: clean `npm install`, type check, lint, production build, and browser test suites (navigation at phone, tablet, and desktop widths; sign-in and sign-out; community; academic and My Courses; housing; marketplace; empty and error states).
- Backend: fresh `init-db`, then over real HTTP with CSRF on: register (CSUEB email required, duplicates refused), wrong-password message, sign in, create post, category filter, comment, profile, sign out, protected pages, and password stored as a hash.

## Team

| Name | Role |
|---|---|
| _Name_ | Frontend, product, design |
| _Name_ | Backend |
| _Name_ | _Role_ |

## Hackathon

MESAU Hacks 3.0
