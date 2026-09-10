# Momenta — Intelligent Event Photography & Gallery Platform

A collaborative photography workflow platform built with the MERN stack.
Admins create events, team members upload photos, admins curate and
publish a PIN-protected gallery, and customers view their photos with
no account required.

## 🔗 Live Demo

- **App:** https://momenta-event-photography-gallery.vercel.app
- **API:** https://momenta-event-photography-gallery-1.onrender.com/api/health
- **Admin login:** `krish@gmail.com` / `123456`
- **Sample published gallery** (no login needed):
  https://momenta-event-photography-gallery.vercel.app/gallery/abi-s-1st-birthday-3550a5
  — PIN: `8520`

> Note: the backend is hosted on Render's free tier, which spins down
> after ~15 minutes of inactivity. The first request after idle time
> can take 30-60 seconds to respond — this is expected, not a bug.

## Features

- **Role-based access:** Admin/Lead, Team Member, and unauthenticated Customer, each with a distinct set of permissions enforced on the backend (not just hidden in the UI)
- **Event management:** create events, add/remove team members
- **Cloud photo upload:** direct browser-to-Cloudinary upload with per-file progress, validation, and partial-failure handling
- **Smart Curation Workspace:** filter by photographer/status, search by filename, multi-select, bulk actions, full-size preview with keyboard navigation
- **Gallery publishing:** unique shareable slug, bcrypt-hashed PIN, publish/unpublish toggle, rate-limited PIN verification
- **Customer gallery:** no account required, PIN-gated, masonry photo grid, fullscreen viewer

## Tech Stack

**Frontend:** React, Vite, React Router, Tailwind CSS, Axios, Lucide React
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, express-rate-limit
**Storage:** Cloudinary (uploaded directly from the browser — image bytes never touch the backend or MongoDB)

## Architecture
React Client (Vercel)
|
| REST API (JWT in Authorization header)
v
Express + Node.js (Render)
|
├── Auth (register/login, bcrypt password hashing, JWT issuance)
├── Authorization (role + ownership checks on every sensitive route)
├── Event & Team services
├── Photo metadata service
└── Gallery service (slug generation, PIN hashing, publish state)
|
├──────────────→ MongoDB Atlas (users, events, photo metadata, galleries)
|
└──────────────→ Cloudinary (actual image files, uploaded
directly from the browser — see below)


**Photo upload flow:** the browser uploads image files directly to
Cloudinary using an unsigned upload preset, then sends only the
resulting metadata (URL, public ID, filename, size) to the backend as a
small JSON request. The backend never handles raw image bytes — this
keeps uploads fast regardless of backend hosting constraints and
matches the "never store binary data in MongoDB" requirement, since
MongoDB only ever stores the Cloudinary URL and public ID.

## Authentication & Authorization Model

- Passwords are hashed with bcrypt before being stored; the plain
  password is never persisted.
- Login issues a JWT (7-day expiry) containing only the user's ID and
  role — no other profile data.
- Every protected route runs through `protect` middleware (verifies
  the JWT and loads the current user) and, where relevant, `authorize`
  middleware (checks the user's role).
- **Ownership, not just role, is checked on every event/photo/gallery
  action** — an Admin can only manage events they personally created,
  not any event in the system.
- Gallery PINs are bcrypt-hashed the same way passwords are. The PIN
  hash is never sent to the frontend, and the PIN-verification endpoint
  is rate-limited (10 attempts per 15 minutes per IP) to resist
  brute-forcing.
- Unpublished galleries return an identical 404 to non-existent ones,
  so guessing a gallery slug reveals nothing.

## Database Schema

- **User** — name, email, password (hashed), role (`admin` | `team_member`)
- **Event** — name, description, date, location, createdBy, teamMembers[]
- **Photo** — eventId, uploadedBy, filename, storageUrl, storagePublicId, thumbnailUrl, fileSize, mimeType, isSelected, uploadStatus
- **Gallery** — eventId, slug, pinHash, selectedPhotos[], isPublished, publishedAt, expiresAt

## Environment Variables

**server/.env**
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173

**client/.env**
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

`VITE_CLOUDINARY_UPLOAD_PRESET` must be an **unsigned** preset,
configured in the Cloudinary dashboard under Settings → Upload →
Upload presets. Unsigned presets are safe to reference from frontend
code since they can't access the account's API secret.

## Local Setup

**Backend**
cd server
npm install
npm run dev

**Frontend**
cd client
npm install
npm run dev

Open `http://localhost:5173`.

## API Endpoints

**Auth**
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — log in, returns JWT + user
- `GET /api/auth/me` — get current logged-in user

**Events**
- `POST /api/events` — create event (Admin only)
- `GET /api/events` — list events (scoped to what the user created/is on)
- `GET /api/events/:id` — get one event (owner or assigned team member only)
- `PUT /api/events/:id` — update event (Admin, owner only)
- `DELETE /api/events/:id` — delete event + its photos/gallery (Admin, owner only)
- `POST /api/events/:id/members` — add a team member by email (Admin, owner only)
- `DELETE /api/events/:id/members/:userId` — remove a team member (Admin, owner only)

**Photos**
- `POST /api/events/:id/photos/metadata` — record metadata for photos already uploaded directly to Cloudinary
- `GET /api/events/:id/photos` — list photos for an event
- `DELETE /api/photos/:id` — delete a photo (uploader or the event's Admin owner only)
- `PATCH /api/photos/:id/select` — select/unselect a single photo (Admin owner only)
- `PATCH /api/events/:id/photos/bulk-select` — select/unselect many photos at once (Admin owner only)

**Gallery**
- `POST /api/events/:id/gallery` — create a gallery with a PIN (Admin owner only)
- `GET /api/events/:id/gallery` — check gallery status (Admin owner only)
- `PATCH /api/gallery/:id` — change the PIN and/or re-sync selected photos (Admin owner only)
- `POST /api/gallery/:id/publish` — go live (requires at least 1 selected photo)
- `POST /api/gallery/:id/unpublish` — take the gallery offline
- `GET /api/gallery/:slug` — public: basic event info for the PIN screen (only if published)
- `POST /api/gallery/:slug/verify` — public, rate-limited: checks PIN, returns photos if correct

## Deployment

- **Frontend:** Vercel — root directory `client`, `VITE_*` env vars set to **Config** type (not Secret, since they're embedded in the public bundle), `client/vercel.json` provides the SPA rewrite rule so direct links like `/gallery/:slug` don't 404
- **Backend:** Render — root directory `server`, build command `npm install`, start command `npm start`
- **Database:** MongoDB Atlas — Network Access set to allow all IPs (0.0.0.0/0), since Render doesn't have a fixed outbound IP
- **Images:** Cloudinary, uploaded directly from the browser

`CLIENT_URL` on Render must exactly match the deployed frontend origin
(including `https://`) for CORS to work — a common gotcha during setup.

## Security Considerations

- No secrets committed to Git; `.env` is gitignored, `.env.example` shows the shape without real values
- CORS restricted to the configured frontend origin only
- Every sensitive action re-checks authorization server-side — frontend role checks are for UX only
- Rate limiting on the PIN-verification endpoint
- Passwords and PINs are hashed, never stored or transmitted in plain text

## Known Limitations

- **Free-tier hosting:** the backend spins down after ~15 minutes of
  inactivity (Render free tier); the first request after idle time can
  take 30-60 seconds.
- No automated test suite yet.
- No pagination on the Curation Workspace or customer gallery — all
  photos for an event load at once, fine at demo scale but would need
  pagination for very large events.
- Registration currently allows self-selecting the Admin role for demo
  simplicity; a production version would gate Admin creation behind an
  invite or manual approval step.

## Roadmap

1. ✅ Project scaffolding
2. ✅ Authentication & authorization (JWT, roles, protected routes)
3. ✅ Event & team management
4. ✅ Cloud photo upload (direct browser-to-Cloudinary)
5. ✅ Smart Curation Workspace
6. ✅ Gallery publishing & PIN protection
7. ✅ Customer-facing gallery UX
8. Responsive polish & loading/error states (partial)
9. Automated tests
10. ✅ Deployment (Render + Vercel + Atlas + Cloudinary)