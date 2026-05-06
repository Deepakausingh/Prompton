# Image Prompt App

A small React + Vite app for browsing image prompts stored in Supabase and uploading new prompt/image sets behind an admin password.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase values:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Start the app:

```bash
npm run dev
```

## Expected Supabase tables

The UI expects these tables:

- `prompts`
  - `id`
  - `prompt`
- `images`
  - `id`
  - `prompt_id`
  - `image_url`
- `settings`
  - `id`
  - `admin_password`

The password check currently reads the row where `settings.id = 1`.

## What was fixed

- Added graceful handling when Supabase env vars are missing
- Added loading, success, and error states
- Added form validation before insert operations
- Reworked the initial fetch flow to satisfy the current React lint rules
- Replaced the default template README with project-specific instructions
