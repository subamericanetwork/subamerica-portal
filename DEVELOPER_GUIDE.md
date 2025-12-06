# Developer Guide

## 1. Introduction

**Subamerica Portal** is a next-generation platform for the Subamerica Network, bridging the gap between artists and fans. It features a robust streaming engine, a curated marketplace, and social tools, all built on a scalable serverless architecture.

### core Technology Stack
-   **Frontend**: React 18, Vite, TypeScript
-   **UI Library**: Tailwind CSS, Shadcn UI, Lucide Icons
-   **State**: React Context (Global UI), TanStack Query (Server State)
-   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
-   **Media**: Mux/Livepush (Live Streaming), Cloudinary (Asset Optimization)
-   **Payments**: Stripe Connect

## 2. Getting Started

### Prerequisites
-   **Node.js**: v18+ (LTS)
-   **Package Manager**: `npm` or `bun`
-   **Git**

### Quick Start
1.  **Clone**: `git clone https://github.com/subamericanetwork/subamerica-portal.git`
2.  **Install**: `npm install`
3.  **Configure**: Create `.env` with:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
    ```
4.  **Run**: `npm run dev`

## 3. Architecture & Core Concepts

### Project Structure
A more detailed look at the `src` directory:

```
src/
├── components/
│   ├── ui/               # Base Shadcn components (Button, Card, Dialog)
│   ├── admin/            # Admin-only dashboards (VerificationRequests, etc.)
│   ├── layout/           # Layout wrappers (Sidebar, Headers)
│   └── ...               # Feature components (MiniPlayer, StreamControls)
├── contexts/
│   ├── AuthContext.tsx   # Supabase Session & User object
│   └── PlayerContext.tsx # Jukebox state (currentTrack, isPlaying, queue)
├── hooks/
│   ├── useArtistData.ts  # Fetches current artist profile context
│   ├── useGoLive.ts      # Stream setup & ingestion logic
│   └── useJukeboxPlayer.ts # Audio engine hooks
├── i18n/                 # i18next configuration
├── integrations/
│   └── supabase/         # Typed Supabase client
├── lib/
│   ├── utils.ts          # Tailwind merge helpers
│   └── videoValidation.ts # Media upload checks (size/format)
└── pages/                # Route Views (see Routing below)
```

### Routing Strategy
Defined in `App.tsx`, the router uses wrapper components for granular access control:
-   **Public**: Landing page, Auth (`/auth`), Blog.
-   **Member** (`/member/*`): Protected by `ProtectedRoute`. Requires a valid Supabase session.
-   **Artist** (`/dashboard`, `/merch`): Protected by `ArtistRoute`. Checks if `user.id` exists in the `artists` table.
-   **Admin** (`/admin/*`): Protected by `AdminRoute`. Verifies `is_admin` via RBAC.

### State Management Strategy
-   **Global UI**: React Context is used for "always-on" features like the Music Player (`PlayerContext`) and User Session (`AuthContext`).
-   **Server Data**: TanStack Query (`useQuery`, `useMutation`) is used for almost all Supabase data fetching. This provides automatic caching, background refetching, and optimistic updates.
    -   *Example*: `useArtistData` caches the artist profile to prevent redundant DB calls.

## 4. Feature Modules (Deep Dive)

### Multimedia Engine
The heart of the portal is its consumption experience.
-   **Music Player**: Managed by `PlayerContext`. It persists across page navigation (except full refreshes).
    -   *MiniPlayer.tsx*: Floating bar for background listening.
    -   *JukeboxPlayer.tsx*: Full-screen immersive mode.
    -   *Source*: Plays content from `audio_tracks` table.
-   **Live Streaming**:
    -   **Setup**: Artists use `StreamSetupForm` to generate a stream key.
    -   **Ingestion**: `useGoLive` hooks into Mux/Livepush APIs to start the broadcast.
    -   **Playback**: `WatchLive` page uses HLS (m3u8) players. The player automatically polls for stream status via webhook updates to `artist_live_streams`.

### Creator Ecosystem
Tools designed to empower artists.
-   **Dashboard**: A summary view aggregating `ArtistStats` (views, likes) and `Payouts`.
-   **Social Console**: 
    -   **OAuth**: Connects to TikTok/Youtube via `social_auth`.
    -   **SubClip Generator**: `SubClipGenerator.tsx` lets artists take stream highlights and schedule them for social posting.
-   **Merchandise**:
    -   **Printify Sync**: Fetches external products.
    -   **management**: `ProductDialog.tsx` handles CRUD for local products.

### Social & Community
-   **Member Portals**: A standard user workspace to manage "Follows" (`useFollows`) and "Likes" (`useLikes`).
-   **Playlists**: `usePlaylist` manages custom collections.
-   **Artist Portals**: Public profiles (e.g., `/artist-slug`) displaying Bio, Tracks, Videos, and Merch.

### Administration
-   **Verification**: `VerificationRequestForm` collects evidence. Admins review in `VerificationRequests`.
-   **CMS**: `RichTextEditor` is used for Blog posts.
-   **Producer Queue**: A specialized queue for vetting user-generated content before public release.

## 5. External Integrations (Data Flow)

### 1. Supabase (The Backend)
-   **Auth**: Handles all Identity (Email/Password + Social Logins).
-   **Storage**: Buckets for `avatars`, `post-media`, `stream-thumbnails`.
-   **Edge Functions**:
    -   `sync-tiktok-stats`: Updates social metrics.
    -   `create-checkout-session`: Generates Stripe payment links.

### 2. Stripe (Financials)
-   **Connect**: Artists link their Stripe accounts to receive payouts.
-   **Subscription**: `subscription_tier` in `artists` table tracks 'Trident' status.
-   **Webhooks**: Critical for async fulfillment (e.g., unlocking streaming minutes after payment).

### 3. Mux / Livepush (Video)
-   **Mux**: Primary provider for high-quality streaming processing.
-   **Livepush**: Alternative provider (configurable in `StreamingCredentialsManager`).
-   **Flow**: App requests Stream Key -> Artist broadcasts to Provider -> Provider hits Webhook -> App updates `status` to 'live'.

### 4. Cloudinary (Content Delivery)
-   **Optimization**: Used to serve optimized variants of heavy media (Images, Audio, Video snippets).
-   **Schema**: The `audio_tracks` and `artist_live_streams` tables contain `cloudinary_public_id` fields.
-   **Usage**: When an Admin approves a track/stream, it may optionally be synced to Cloudinary for better global delivery performance.

## 6. Development Workflow

### Adding a New Feature
1.  **Schema**: Update `supabase/types.ts` if DB changes are needed.
2.  **Hook**: Create a `useFeature` hook using TanStack Query for data fetching.
3.  **UI**: Build components in `src/components/feature-name` using Shadcn primitives.
4.  **Page**: Compose the page in `src/pages`.
5.  **Route**: Register in `App.tsx` with appropriate Guard.

### Component Guidelines
-   **Shadcn**: Always use primitives from `src/components/ui` (e.g., `<Button>`, `<Card>`) to maintain design consistency.
-   **Icons**: Use `lucide-react` for all iconography.
-   **Responsiveness**: Mobile-first Tailwind classes (`md:flex`, `lg:grid-cols-3`).

### Common Utilities (`src/lib`)
-   `utils.ts`: `cn()` class merger (use this for conditional classes).
-   `videoValidation.ts`: strict validators for file uploads to prevent storage spam.

## 7. Deployment
-   **Platform**: Lovable / Vercel
-   **Env Vars**: Must be set in the deployment dashboard.
-   **Build**: `npm run build` generates `dist/`.
