## Job Application Tracker (Auth Module) 
Autentification flow built with React and TypeScript and Supabase.
Includes regigistration with email confirmation, login, profile upsert, and protected dashboard access.

## Tech stack
- React + TypeScript (Vite)
- React Router
- Supabase (Auth + Postgres)

## Features (current)
- Register with email + password (email confirmation enabled)
- Login with Supabase Auth
- Create/update user profile on first successful login (UPSERT into "profiles")
- Auth layout + reusable UI components (Button, Input, Spiner, PasswordInput)

## Auth flow (how it works)
1. **Register**
  - Calls `supabase.auth.signUp(email,password)`
  - Supabse sends a confirmation mail
  - No `prifiles` insert happens here (no authenticated session before confirmation)

2. **Confirm email**
  - User confirms signup via email link
  
3. **Login**
  - Calls `supabase.auth.signInWithPassword(email,password)`
  - On successful login the app runs:
    - `upsert` into `profiles` using the authenticated user id (`auth.users.id`)
  - Redirects to `/dashborad`

Why upsert on login? 
- With email confirmation enabled, the user isn't fully authenticated right after signup, so RLS would block insrt into `profiles`.
- Upsert keeps the flow idempotent: safe to run on every login.


## Database setup (Supabase)
## Table: `profiles`
Recommended columns: 
- `id` (uuid, primary key, foregin key -> `auth.users.id`)
- `email` (text)
- `firstName` (text)
- `lastName` (text)
- `username` (text)

## RLS policies
Enable RLS on `profiles` and add policies:
- Select own profile
- Insert own profiles
- Update own profile

Example logic: 
- `auth.uid() = id`

## Enviroment variables
Create a `.env` file in project root



