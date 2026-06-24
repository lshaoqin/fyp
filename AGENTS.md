# AGENTS.md

## Project overview

**Elephant Reader** — a dyslexia-friendly document text extraction and formatting app.

- **Frontend**: Next.js 16 (App Router, React 19, Tailwind CSS v4) at repo root
- **Backend**: Flask (Python) under `backend/`, deployed to Google Cloud Run
- **Auth**: Firebase Phone Auth (client) + Firebase Admin (server) on both Next.js and Flask

## Commands

```bash
# Frontend (run from repo root)
npm run dev        # Next.js dev server on :3000
npm run build      # production build (includes type checking)
npm run lint       # ESLint (Next.js core-web-vitals + typescript rules)

# Backend (run from backend/)
pip install -r requirements.txt
python app.py      # Flask on :8080 (gunicorn in production)
docker-compose up  # Dockerized backend with hot-reload
```

There are **no test scripts**, **no test files**, and **no CI workflows**.

## Architecture

### Request flow

```
Browser → Next.js frontend (client components)
       → Next.js API routes (/api/*) — auth gateway + proxy
       → Flask backend (:8080) — business logic + external APIs
       → Google Cloud Vision / Gemini / TTS / Firebase Firestore+Storage
```

### API route pattern

11 of 12 Next.js API routes under `src/app/api/` are thin proxies. They:
1. Call `requireFirebaseAuth()` from `src/utils/require-firebase-auth.ts`
2. `fetch()` the Flask backend at `PYTHON_BACKEND_URL` (default `http://localhost:8080`)
3. Forward the auth token as `Authorization: Bearer`
4. Return the backend response

The exception is `/api/auth/session` — it manages `firebase_token` httpOnly cookies directly using Firebase Admin SDK, no backend call.

### Direct backend bypass

File uploads **bypass Next.js API routes** to avoid Vercel's 4.5MB body limit. The frontend calls the Flask backend directly using `NEXT_PUBLIC_PYTHON_BACKEND_URL`. This is done via `uploadFileDirect()` in `src/app/page.tsx`.

### Double auth

Both the Next.js API layer and the Flask backend independently verify Firebase ID tokens. Tokens flow via `Authorization: Bearer` header.

## Environment variables

**Root `.env.local`** (Next.js frontend + API routes):
```
PYTHON_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

**`backend/.env`** (Flask):
```
GEMINI_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=credentials/google-credentials.json
FIREBASE_ADMIN_CREDENTIALS=credentials/firebase-admin.json
PORT=8080
```

## Key dependencies

- **Google Cloud Vision** — OCR text extraction from images/PDFs
- **Google Gemini** (`gemini-2.5-flash-lite`) — text formatting, word definitions, word-hunt questions
- **TTS**: ElevenLabs (primary) → Google Cloud TTS (fallback) — chirp3 HD model with SSML word timestamps
- **Firebase**: Phone Auth, Firestore (document storage), Storage (blobs)
- **pdf2image** + poppler-utils — PDF → image conversion for OCR
- **Tailwind CSS v4** with `@tailwindcss/postcss` plugin (not the old `tailwindcss` + `autoprefixer`)

## GCP deployment

Backend deploys to Cloud Run (project `nus-fyp-476103`, region `us-central1`, service `fluency-backend`). See `backend/deploy.ps1` and `backend/Dockerfile`. Uses gunicorn with 4 workers, 120s timeout, port 8080.

## Code conventions

- Path alias `@/*` → `./src/*` (configured in `tsconfig.json`)
- Next.js App Router with client components (`"use client"`) for interactive views
- State machine pattern in `src/app/page.tsx` — `viewMode` determines which view is rendered
- Tailwind CSS v4 uses CSS-first config via `@import "tailwindcss"` in `src/app/globals.css`, not `tailwind.config.ts`
