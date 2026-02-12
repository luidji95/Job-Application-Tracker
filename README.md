



Job Application Tracker

A personal job application tracker built with React + TypeScript and Supabase.
Includes authentication (email confirmation), profile upsert, and a Kanban-style dashboard for managing applications across hiring stages.

This project evolved beyond a simple CRUD board — it includes global search, jump-to-card navigation, anchored popovers, and structured async state handling.

Tech Stack

React + TypeScript (Vite)

React Router

Supabase (Auth + Postgres + RLS)

Zod (form validation)

Sonner (toasts)

Lucide Icons

Features
Authentication

Register with email + password (email confirmation enabled)

Login with Supabase Auth

Protected dashboard route

Profile UPSERT on first successful login

Proper RLS policies (users can only access their own data)

Job Tracker (Kanban Dashboard)

Kanban board with stages:

Applied

HR

Technical

Final

Offer

Rejected

Create application (modal form)

Edit application

Move between stages

Reject + restore logic (tracks rejected_from_stage)

Delete single application

Delete all applications

Per-card async state (e.g. “Moving…”, “Deleting…”)

Optional seed script (only seeds if user has 0 jobs)

Global Search & Navigation

Global search input in Topbar

Live filtering across:

Company name

Position

Location

Tags

Dropdown search results (limited preview list)

Click-to-jump navigation

Smooth scroll to selected card

Temporary highlight animation for active card

Search state is lifted to Dashboard and passed down to KanbanBoard, ensuring predictable one-way data flow.

Notes & AI (UI Ready)

Per-card Notes popover (anchored to button via getBoundingClientRect)

AI Insight popover (UI placeholder — backend integration planned)

Reusable anchor-based popover architecture

Extensible structure for future AI feedback storage

The AI module is designed to later:

Accept pasted job description

Extract must-have / nice-to-have technologies

Provide application strategy suggestions

Architecture Overview
State Flow

Dashboard holds:

searchValue

searchResults

activeJobId

KanbanBoard:

Computes filtered jobs via useMemo

Returns search results upward

Handles jump + scroll logic

CompanyCard:

Handles UI state (expand, menu, popovers)

Receives isActive for highlight animation

This keeps the data flow predictable and avoids unnecessary re-renders.

How the Auth Flow Works
Register

Calls supabase.auth.signUp(email, password)

Supabase sends confirmation email

No profile insert yet (no authenticated session)

Confirm Email

User confirms via email link

Login

Calls supabase.auth.signInWithPassword

On success:

UPSERT into profiles

Redirect to /dashboard

Why UPSERT on login?
With email confirmation enabled, RLS would block profile insert during signup.
Running UPSERT after authentication keeps the flow safe and idempotent.

Database Setup (Supabase)
Table: profiles

id (uuid, PK, references auth.users.id)

email (text)

firstName (text)

lastName (text)

userName (text)

Table: jobs

id (uuid, PK)

user_id (uuid, FK -> auth.users.id)

company_name (text)

position (text)

stage (text)

status (text)

location (text, nullable)

salary (text, nullable)

tags (text[], nullable)

notes (text, nullable)

applied_date (timestamptz)

rejected_from_stage (text, nullable)

created_at (timestamptz default now())

RLS Policies

Enable Row Level Security and add:

For profiles:

SELECT: auth.uid() = id

INSERT: auth.uid() = id

UPDATE: auth.uid() = id

DELETE: auth.uid() = id

For jobs:

SELECT: auth.uid() = user_id

INSERT: auth.uid() = user_id

UPDATE: auth.uid() = user_id

DELETE: auth.uid() = user_id

Environment Variables

Create .env:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

Run Locally
npm install
npm run dev

Future Improvements

AI Insight backend integration

Statistics panel (applications per stage, rejection analytics)

Date-based filtering

Drag & drop stage movement

Multi-user collaboration mode (long-term idea)
