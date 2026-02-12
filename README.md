# Job Application Tracker

A personal job application tracker built with React + TypeScript and Supabase.  
Includes authentication (email confirmation), profile upsert, and a Kanban-style dashboard for managing applications across stages.

## Tech Stack

- React + TypeScript (Vite)
- React Router
- Supabase (Auth + Postgres)
- Zod (form validation)
- Sonner (toast notifications)

## Features

### Authentication

- Register with email + password (email confirmation enabled)
- Login with Supabase Auth
- Protected dashboard route
- Profile upsert on first successful login (UPSERT into `profiles`)

### Job Tracker (Dashboard)

- Kanban board with stages:
  - Applied
  - HR
  - Technical
  - Final
  - Offer
  - Rejected
- Create application (modal form)
- Edit application
- Move application between stages
- Reject + restore logic (`rejected_from_stage`)
- Delete application
- Delete all applications
- Per-card async action state (e.g. “Moving…”, “Deleting…”, “Saving…”)
- Optional seed script (seed dummy jobs only if user has 0 jobs)

### Search & Navigation

- Global search input in Topbar
- Live filtering across:
  - Company name
  - Position
  - Location
  - Tags
- Dropdown search results (limited preview list)
- Click-to-jump navigation
- Smooth scroll to selected card
- Temporary highlight animation for active card

### Notes & AI Insight (UI ready)

- Anchored Notes popover (uses `getBoundingClientRect`)
- AI Insight popover (currently placeholder)
- Structured state flow ready for future AI integration

## How the Auth Flow Works

### Register

- Calls `supabase.auth.signUp(email, password)`
- Supabase sends a confirmation email
- No insert into `profiles` happens here (no authenticated session before confirmation)

### Confirm Email

- User confirms signup via email link

### Login

- Calls `supabase.auth.signInWithPassword(email, password)`
- On successful login the app runs:
  - UPSERT into `profiles` using authenticated user id (`auth.users.id`)
  - Redirects to `/dashboard`

Why upsert on login?  
With email confirmation enabled, the user isn't fully authenticated right after signup, so RLS would block inserts into `profiles`.  
Upsert keeps the flow idempotent and safe to run on every login.

## Database Setup (Supabase)

### Table: `profiles`

- `id` (uuid, primary key, foreign key -> `auth.users.id`)
- `email` (text)
- `firstName` (text)
- `lastName` (text)
- `userName` (text)

### Table: `jobs`

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> `auth.users.id`)
- `company_name` (text)
- `position` (text)
- `stage` (text)
- `status` (text)
- `location` (text, nullable)
- `salary` (text, nullable)
- `tags` (text[], nullable)
- `notes` (text, nullable)
- `applied_date` (timestamptz)
- `rejected_from_stage` (text, nullable)
- `created_at` (timestamptz default now())

## Environment Variables

Create a `.env` file in the project root:



npm install
npm run dev
