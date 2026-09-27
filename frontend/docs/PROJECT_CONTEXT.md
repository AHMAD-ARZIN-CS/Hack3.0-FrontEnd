# Project Context: East Bay Link

> Read this first in every session. It keeps the project from drifting.
> MESA Hack 3.0, 2026-09-26. Product name in the UI: **East Bay Link** (the brief calls it "Student Hub"; both names mean this project, see DECISIONS D9). Name lives in `config/app.ts` → `APP_NAME`.
> **Scope refined 2026-09-26 (DECISIONS D13), navigation and content rules set in Session 4 (D18–D22).**

## Mission

East Bay Link **preserves and connects** useful resources, student knowledge, and local opportunities that currently exist in fragmented places.

The problem is **not** that help doesn't exist. The problem is that it is scattered:
- Campus resources sit on separate office websites.
- Student knowledge (notes, study guides, "how to survive this course") disappears every semester when students move on.
- Local housing and food opportunities are spread across group chats, flyers, and random sites.

Core flow:

```
STUDENT NEED  →  RELEVANT RESOURCE / KNOWLEDGE / OPPORTUNITY  →  STUDENT, CAMPUS, LOCAL COMMUNITY
```

## Target users

- Students at the launch campuses: Chabot College (`chabot`), Diablo Valley College (`dvc`), CSU East Bay (`csueb`).
- Mostly on phones, often between classes and jobs, often without institutional vocabulary.
- Later contributors: schools (resource publishers) and local businesses (food offers). Not built for the hackathon.

## The refined MVP: two systems + one shared profile

Primary systems:
1. **Academic Exchange**: notes, study guides, original practice material, and course tips from previous students, organized by course.
2. **Basic Needs / Local Opportunities**: Housing and Food first.
3. **Profile / Reputation** connects both, built only from observable contributions.

## Information architecture (5 tabs, D18)

```
HOME / COMMUNITY   need tiles (Study help featured) + Community entry
                   Community: campus feed, questions, opportunities, events, study groups (DEFERRED, code kept)
ACADEMIC           courses → notes, study guides, practice (AcademicResource, may have files) + course tips (AcademicTip, text)
DISCOVER           food, resources, marketplace (later), local opportunities (later)
HOUSING            find housing, find roommate, post opportunity
PROFILE            identity/campus, courses, interests, contributions, badges, user-controlled active offerings
```

Supporting layers already built: **Resources** and **Safety** (inside Discover, Safety also in the top bar).

## Core problems

1. **Lost knowledge.** Each semester, students rebuild notes, guides, and course advice that previous students already made.
2. **Fragmented help.** Finding help requires knowing which office owns it.
3. **Cost pressure.** Food and housing costs strain students. Help exists but is hard to find.
4. **Trust gap.** Students hesitate to connect with strangers for housing. A verified-student signal lowers one barrier.
5. **Unused local surplus.** Restaurants have usable surplus food. Nearby students would buy it at a discount. No local bridge exists.

## Product principles

1. **Start with "What do you need today?"**, never with the org chart.
2. **Preserve, then connect.** Every feature should either keep something useful from being lost or route a student to something that already exists.
3. **Not a social network.** No feeds for their own sake, no follower counts, no DMs, no likes on people. Social features exist only to move knowledge and opportunities.
4. **Not a generic marketplace.** Exchange is about knowledge and basic needs, not selling stuff.
5. **Reputation rewards contribution.** "42 helpful votes, 18 resources shared, 73 students helped", never "4.7/5 person". Content can be rated helpful. People are not rated.
6. **Campus-first, one app.** Every piece of content has a `campusId`. Courses are campus-specific.
7. **Honest claims only.** Discover, connect, find. Never guarantee, solve, or eliminate.
8. **Privacy by default.** Minimum data. No addresses, phone numbers, precise location, or personal class schedules. Housing status on a profile is hidden unless the student turns it on.
9. **Academic integrity.** Original student-created material only. No leaked exams, answer keys, unauthorized instructor materials, copyrighted textbook PDFs, or cheating material.
10. **Course context, not instructor judgment.** Content may note term and instructor ("made for MTH 1, Fall 2026, Instructor X") to organize it. No professor ratings, rankings, "easy A" claims, or personal attacks.
11. **Mobile-first, accessible, functional over polished** (Ahmad's priority).

## Current scope (hackathon demo flows)

| Flow | Story | Status |
|---|---|---|
| A. Academic Exchange | Home → "I need study help" → pick course (Chabot MTH 1, CSCI 14, ENGL 1 demo set) → see notes/guides/tips → open a resource with attachments → mark helpful | NEXT |
| B. Food | "I need food" → campus pantry + CalFresh + a nearby surplus-food deal → view price + pickup window → "I want this" (mock) | Resources part WORKING, deals PLANNED |
| C. Housing | "I need housing" → housing resources + roommate posts from verified students → budget/distance filters → request to connect (mock) | Resources part WORKING, posts PLANNED |
| D. Profile | Open a contributor's profile → campus, courses, contributions, badges | PLANNED |
| (supporting) Resources + Safety | Browse all resources, one tap to emergency help | WORKING |

Everything runs on **mock data** first. Backend integration comes last, through the service layer.

## What East Bay Link IS

- A course-organized library of student-made notes, study guides, and tips that stays useful after the author graduates.
- A discovery layer that routes food and housing needs to existing campus/county help.
- A place to find verified students for housing/roommate matches.
- A place where local businesses *could* post surplus-food deals.
- A profile that shows what a student has contributed, so others can judge usefulness.
- A hub of links to official safety channels.

## What East Bay Link IS NOT

- Not a social network or chat app.
- Not a general buy/sell marketplace (Marketplace sits in Discover as "later").
- Not a place to share exams, answer keys, or homework solutions.
- Not a professor-rating site, and not a people-rating site.
- Not an emergency service. Emergencies go to 911 and official campus systems.
- Not a housing guarantor, landlord, or lease platform. Verification does not mean safe.
- Not a payment processor.
- Not an official campus system, not institutionally approved, not FERPA-certified.
- Not the research workbook. Pitch statistics live separately and come from verified sources.

## Mock data rule

All demo content is labeled as demo data in code (`isDemo: true`) and shown with a "Demo" tag. Mock notes are written as samples, not copied from real courses. Course codes/titles are marked `catalogVerified` only when checked against the official catalog. No fake official statistics, professor endorsements, or student outcomes. No fake restaurant is presented as a real partner. No invented statistics.
