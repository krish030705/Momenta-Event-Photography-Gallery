# Momenta — Intelligent Event Photography & Gallery Platform

A collaborative photography workflow platform built with the MERN stack.
Admins create events, team members upload photos, admins curate and
publish a PIN-protected gallery, and customers view their photos with
no account required.

> **Status: Phase 1 — Project Scaffolding.** Auth, event management,
> uploads, curation, and gallery publishing will be added in later phases.

## Tech Stack

**Frontend:** React, Vite, React Router, Tailwind CSS, Axios, Lucide React
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer
**Storage:** Cloudinary (image files — never stored in MongoDB)

## Project Structure

```
Vistara/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Route-level pages
│       ├── components/     # Reusable UI components
│       ├── layouts/        # Shared page layouts (navbar/sidebar wrappers)
│       ├── context/        # React context (auth state, etc.)
│       ├── hooks/          # Custom hooks
│       ├── services/       # API client (Axios instance)
│       └── utils/          # Helper functions
└── server/                 # Express backend
    ├── config/             # DB + Cloudinary configuration
    ├── models/             # Mongoose schemas: User, Event, Photo, Gallery
    ├── controllers/        # Route handler logic
    ├── routes/             # Express route definitions
    ├── middleware/         # Auth guards, error handling
    └── utils/              # Helper functions
```

## Database Schema (Phase 1)

- **User** — name, email, password (hashed), role (`admin` | `team_member`)
- **Event** — name, description, date, location, createdBy, teamMembers[]
- **Photo** — eventId, uploadedBy, filename, storageUrl, storagePublicId, thumbnailUrl, fileSize, mimeType, isSelected, uploadStatus
- **Gallery** — eventId, slug, pinHash, selectedPhotos[], isPublished, publishedAt, expiresAt

## Environment Variables

Copy the `.env.example` file in each folder to `.env` and fill in real values.

**server/.env**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## Local Setup

**Backend**
```
cd server
npm install
npm run dev
```

**Frontend**
```
cd client
npm install
npm run dev
```

Then open `http://localhost:5173` — you should see a "Connection Check"
page confirming the frontend can reach the backend and MongoDB.

## Roadmap

1. ✅ Project scaffolding
2. Authentication & authorization (JWT, roles)
3. Event & team management
4. Cloud photo upload (Cloudinary)
5. Smart Curation Workspace
6. Gallery publishing & PIN protection
7. Customer-facing gallery UX
8. Responsive polish & loading/error states
9. Tests
10. Deployment
