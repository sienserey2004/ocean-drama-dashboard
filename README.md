# DramaStream Dashboard

React + TypeScript + Vite + MUI + Tailwind + Zustand dashboard for the Short Drama Platform.

## Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Material UI v5 | Component library |
| Tailwind CSS v3 | Utility classes |
| Zustand | Global state (auth, app) |
| React Hook Form + Zod | Forms & validation |
| Axios | API client with interceptors |
| React Router v6 | Routing + guards |
| React Hot Toast | Notifications |

## Setup

```bash
cd drama-dashboard
cp .env.example .env          # set VITE_API_URL
npm install
npm run dev
```

Open http://localhost:3000

## Role-based access

### Admin — full access
- Analytics (platform-wide)
- My Videos (all videos, approve/reject/delete any)
- Episodes (manage any)
- Review Queue (approve/reject submissions)
- Users (change role, suspend, ban, delete)
- Reports (review / dismiss)
- Categories & Tags (CRUD)
- Revenue Report (platform-wide)
- Notifications (broadcast / send to user)
- Earnings (own creator earnings)

### Creator — limited access
- Analytics (own stats + earnings only)
- My Videos (own videos only, cannot approve/reject)
- Episodes (own videos only)
- Earnings (own only)
- Profile

Admin-only pages redirect creators to /dashboard/videos.

## Project structure

```
src/
├── api/
│   ├── client.ts          # Axios instance + interceptors
│   └── services.ts        # All API functions (auth, video, episode, admin…)
├── components/
│   └── layout/
│       └── DashboardLayout.tsx
├── pages/
│   ├── shared/            # Both roles
│   │   ├── LoginPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── MyVideosPage.tsx
│   │   ├── EpisodesPage.tsx
│   │   ├── EarningsPage.tsx
│   │   └── ProfilePage.tsx
│   └── admin/             # Admin only
│       ├── AdminUsersPage.tsx
│       ├── AdminReviewPage.tsx
│       ├── AdminReportsPage.tsx
│       ├── AdminCategoriesPage.tsx
│       ├── AdminRevenuePage.tsx
│       └── AdminNotifPage.tsx
├── router/
│   └── index.tsx          # Routes + AuthGuard + AdminGuard
├── stores/
│   ├── authStore.ts       # Zustand auth (persisted)
│   └── appStore.ts        # Zustand UI state
├── types/
│   └── index.ts           # All TypeScript types
└── utils/
    └── theme.ts           # MUI theme
```

## Auth flow

1. Login → tokens stored in localStorage + Zustand persisted store
2. Axios interceptor attaches Bearer token to every request
3. On 401 → auto-refresh token → retry request
4. On refresh fail → clear auth → redirect to /login
5. Route guards: AuthGuard (all) + AdminGuard (admin-only pages)

## API base URL

Set `VITE_API_URL` in `.env` to point at your backend.



create new page -> index.tsx add lazy page and dashboard children -> # ocean-drama-dashboard
