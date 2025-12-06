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

## 8. Database Schema

### 1. Identity & Access

#### `artists`
The central entity for creators.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `user_id` | `uuid` | References `auth.users` |
| `display_name` | `text` | Public artist name |
| `slug` | `text` | Unique URL identifier |
| `bio_short` | `text` | Short bio for cards |
| `bio_long` | `text` | Full profile biography |
| `city` | `text` | Location info |
| `country` | `text` | Location info |
| `subscription_tier` | `enum` | Tier: `free`, `pro`, `label` |
| `stripe_customer_id` | `text` | Stripe Customer ID |
| `stripe_subscription_id` | `text` | Stripe Subscription ID |
| `is_verified` | `boolean` | Verification status |
| `socials` | `json` | Links to external social media |

#### `user_profiles`
Public profile information for regular users.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `user_id` | `uuid` | References `auth.users` |
| `display_name` | `text` | Public username |
| `avatar_url` | `text` | Profile picture URL |
| `email` | `text` | User email |

#### `user_roles`
RBAC system for platform administrators.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `user_id` | `uuid` | References `auth.users` |
| `role` | `enum` | Role: `admin`, `moderator` |

#### `user_follows`
Tracks follower relationships.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `user_id` | `uuid` | Follower |
| `artist_id` | `uuid` | Following |

### 2. Streaming Engine

#### `artist_live_streams`
Live broadcast sessions.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `title` | `text` | Stream title |
| `status` | `text` | e.g. `live`, `ended` |
| `stream_key` | `text` | Secret key for OBS |
| `playback_url` | `text` | HLS Playback URL |
| `provider` | `text` | `mux` or `livepush` |
| `viewer_count` | `integer` | Current viewers |

#### `events`
Scheduled live events.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `title` | `text` | Event name |
| `starts_at` | `timestamptz` | Scheduled start time |
| `ticket_price` | `number` | Cost in `ticket_currency` |
| `stripe_price_id` | `text` | Stripe Price ID for tickets |
| `venue` | `text` | Physical location (optional) |

#### `stream_playlists`
Pre-recorded content broadcast as live.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `name` | `text` | Playlist name |
| `video_ids` | `text[]` | Array of `videos.id` to play |
| `loop_mode` | `text` | Loop behavior |

### 3. Media Content

#### `audio_tracks`
Audio files for the music player.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `title` | `text` | Track title |
| `audio_url` | `text` | Direct file URL |
| `cloudinary_public_id` | `text` | Cloudinary ID for optimization |
| `duration` | `integer` | Length in seconds |
| `is_featured` | `boolean` | Featured on artist profile |

#### `videos`
Video-on-demand content.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `title` | `text` | Video title |
| `video_url` | `text` | Source URL |
| `provider` | `text` | Source provider (e.g., `youtube`) |
| `kind` | `enum` | Type: `music_video`, `interview`, etc. |

### 4. Social Platform

#### `social_posts`
Posts syndicated to external platforms.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `platform` | `text` | `tiktok`, `youtube`, `instagram` |
| `platform_post_id` | `text` | External ID |
| `caption` | `text` | Post caption |
| `posted_at` | `timestamptz` | Publication time |

#### `conversations`
Chat rooms.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `type` | `text` | `direct` or `group` |
| `updated_at` | `timestamptz` | Last activity |

#### `messages`
Individual chat messages.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `conversation_id` | `uuid` | FK to `conversations` |
| `sender_id` | `uuid` | FK to `auth.users` |
| `content` | `text` | Message body |

### 5. Marketplace

#### `products`
Merchandise items.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | FK to `artists` |
| `title` | `text` | Product name |
| `price` | `number` | Price |
| `currency` | `text` | Currency code (USD) |
| `inventory` | `text` | Stock status |

#### `orders`
Customer purchases.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `artist_id` | `uuid` | Seller |
| `product_id` | `uuid` | FK to `products` |
| `total_amount` | `number` | Final price paid |
| `stripe_session_id` | `text` | Payment reference |
| `fulfillment_status` | `text` | `pending`, `shipped` |

### 6. System & Config

#### `audit`
System-wide audit logging.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `action` | `text` | Action name |
| `actor_id` | `uuid` | User who performed action |
| `entity` | `text` | Target table |
| `diff` | `json` | Changes made |

#### `admin_notifications`
Alerts for admins.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `title` | `text` | Notification title |
| `message` | `text` | Body text |
| `read_at` | `timestamptz` | When it was read |


