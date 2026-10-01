# Central Student Government — Lipa City Colleges

A public, no-registration student portal with a private Supabase-powered admin dashboard.

## Included
- Public home page and student dashboard
- Announcements with cover images and downloadable files
- Events with posters, descriptions, schedules, locations and RSVP-style "I'm Interested" counts
- 1–5 star event reviews + comments, no student registration required
- CSG officers directory
- Student resources / downloadable forms
- Student feedback / Sumbong / report / suggestion submission with reference codes
- Help desk / contact information
- Search across announcements, events, officers and resources
- Admin login and CRUD dashboard
- Supabase Storage for images/files
- Row Level Security (RLS)

## 1. Install
```bash
npm install
```

## 2. Configure Supabase
Create a Supabase project, then run `supabase/schema.sql` in the SQL Editor.

Then create an admin user in:
Authentication → Users → Add user

Use email/password. After creating the user, copy the user's UUID and run:
```sql
insert into public.admin_users (user_id, full_name)
values ('PASTE-USER-UUID-HERE', 'CSG Administrator');
```

Create `.env.local` from `.env.example` and paste the Project URL and anon/publishable key.

## 3. Logo
Replace:
`public/csg-logo.png`

with the official CSG / Lipa City Colleges logo. The app already references this path.

If your logo has another filename, either rename it to `csg-logo.png` or update the `LOGO_PATH` constant in `src/components/Brand.jsx`.

## 4. Run
```bash
npm run dev
```

## 5. Deploy to Netlify
Build command:
`npm run build`

Publish directory:
`dist`

Environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Important
Never put a Supabase service-role key in this frontend. Only use the public anon/publishable key in `VITE_SUPABASE_ANON_KEY`.

The public site has no registration. Only administrators authenticate.

## What was improved in this version
- Admin dashboard now has a real overview with content and student-message counts.
- Admin access is verified against the `admin_users` table before the dashboard is shown.
- Admin navigation uses icons and works better on smaller screens.
- Event reviews check the browser token before accepting another review from the same browser.
- Event pages now show the organizer and optional external event/registration link.
- Admin uploads use unique storage paths and enforce sensible image/file size limits.
- Student feedback attachments are limited to 15 MB.
- Better admin loading/error/success states and message status badges.
- Footer navigation uses React Router links instead of full-page reloads.
