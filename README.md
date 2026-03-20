# ShowMatch ❤️🎬

**ShowMatch** is a couples' streaming picker web app that helps two or more people find something to watch together based on their overlapping streaming subscriptions. The matching mechanic is **Tinder-style**: each person swipes/votes independently, and matched titles are revealed when all group members have liked the same title.

---

## Features

- 🎭 **Tinder-style swiping** — Like or skip titles with drag gestures or button taps
- 👥 **Multi-person groups** — Create a group with a shareable code; each member joins with their own profile
- 🔄 **Overlapping services** — Only shows content available on streaming services all group members share
- 🌍 **Region-aware** — Filters content by each member's location
- 🎬 **Detailed title cards** — Poster art, synopsis, IMDB rating, genre tags, streaming platform badge, and trailer link
- 🔍 **Pre-swipe filters** — Filter by genre, content type (movie vs. TV show), and minimum IMDB rating
- 💾 **Persistent profiles** — Name, location, and subscriptions saved in `localStorage` across sessions
- 🌙 **Demo mode** — Works instantly with 10 mock titles if no API key is configured
- 📱 **Mobile-responsive** dark-mode design

---

## Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/Carmen-Dominguez/ShowMatch.git
cd ShowMatch
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the Watchmode API key *(optional)*

Copy the example env file and add your key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_WATCHMODE_API_KEY=your_api_key_here
```

> **Without a key**, the app runs in **demo mode** using 10 built-in mock titles — no API calls are made and everything still works end-to-end.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Obtaining a Watchmode API Key

1. Visit [https://api.watchmode.com/](https://api.watchmode.com/) and create a free account.
2. Navigate to your dashboard and copy the API key shown there.
3. Paste it into `.env.local` as `NEXT_PUBLIC_WATCHMODE_API_KEY=<your key>`.

The free tier allows 1,000 API calls/month. Each swiping session uses approximately 21 calls (1 list call + 1 details call per title).

---

## Watchmode Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /v1/list-titles/` | Fetches a paginated list of titles filtered by streaming source IDs, region, content type, and genre |
| `GET /v1/title/{id}/details/` | Fetches full title details including plot overview, IMDB rating, poster, trailer URL, and streaming sources |

### Parameters used on `/v1/list-titles/`

| Parameter | Description |
|---|---|
| `apiKey` | Your Watchmode API key |
| `source_ids` | Comma-separated Watchmode source IDs for the group's overlapping streaming services |
| `regions` | ISO country code (e.g. `US`, `GB`) |
| `types` | `movie` or `tv_series` (omitted for "all") |
| `genres` | Comma-separated Watchmode genre IDs |
| `page` | Page number for pagination |
| `limit` | Results per page (20) |

### Watchmode Source IDs used

| Service | Source ID |
|---|---|
| Netflix | 203 |
| Hulu | 157 |
| Disney+ | 372 |
| Max (HBO) | 387 |
| Amazon Prime Video | 26 |
| Apple TV+ | 371 |
| Peacock | 384 |
| Paramount+ | 444 |

---

## How the Group / Session Matching System Works

### 1. Profile Creation (`/`)
Each user creates a profile with their name, region, and subscribed streaming services. This is saved to `localStorage` and persists across browser sessions.

### 2. Group Creation or Joining (`/group`)
- **Create**: Generates a unique 6-character alphanumeric invite code (e.g., `H4K9RT`). The creator's profile is stored as the first group member.
- **Join**: Enter a partner's invite code. The app finds the group data in `localStorage` (same device) and adds the joining member.

> **Single-device mode**: Both people take turns on the same device — each creates their profile separately and the second person enters the first person's group code.

### 3. Finding Overlapping Content (`/swipe`)
Before swiping, the app:
1. Inspects all group members' subscribed services
2. Finds the **intersection** of service source IDs (services everyone has)
3. Calls the Watchmode API with those source IDs + the group's shared region
4. Applies any genre/type/rating filters the group set

If services don't overlap, it falls back to the union of all members' services.

### 4. Turn-Based Swiping
- Members take turns voting on the same device (or the mechanic naturally supports multi-device since all votes are stored in `localStorage` under the shared group code)
- Each member's votes are tracked independently: `session.votes[memberId][titleId] = 'like' | 'skip'`
- A **match** is detected when **all group members** have voted `'like'` on the same title
- Matches are immediately surfaced with a 🎉 animation

### 5. Match Display (`/matches`)
Matched titles are shown with:
- Poster art
- Title, year, content type
- IMDB rating and genre tags
- Synopsis
- Streaming platform badge with a link to watch
- Trailer link (when available from Watchmode)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict, no `any`) |
| Styling | SCSS Modules (no utility-first CSS) |
| State | React Context + `useReducer` |
| Persistence | `localStorage` |
| Content API | Watchmode API |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, wraps app in AppProvider
│   ├── page.tsx            # Home — Profile Setup
│   ├── group/page.tsx      # Group create/join
│   ├── swipe/page.tsx      # Swiping session
│   └── matches/page.tsx    # Match results
├── components/
│   ├── FilterPanel/        # Genre, type, and rating filters
│   ├── GroupPanel/         # Group create/join UI
│   ├── MatchCard/          # Individual match display card
│   ├── ProfileSetup/       # User profile creation form
│   ├── ServiceSelector/    # Streaming service toggle grid
│   └── SwipeCard/          # Tinder-style swipe card
├── context/
│   └── AppContext.tsx      # Global state: profile, group, session, matches
├── lib/
│   ├── group.ts            # Group creation, joining, overlap logic
│   ├── mockData.ts         # Demo titles for API-key-free mode
│   ├── services.ts         # Streaming service definitions + genres + regions
│   ├── storage.ts          # localStorage read/write helpers
│   └── watchmode.ts        # Watchmode API client
├── styles/
│   ├── _variables.scss     # Design tokens: colors, spacing, typography
│   └── _mixins.scss        # Reusable SCSS mixins
└── types/
    └── index.ts            # All TypeScript interfaces and types
```
