# Inbar & Eli

A two-sided portfolio site for Inbar (multimedia art) and Eli (restored 1950s–60s radios).

The home page is a full-screen split. Visitors drag the centre handle left or right, or tap a side. Pulling a side past 80% (or tapping it) opens that side fully, and its gallery and story appear below. Inbar's side is colourful and painterly, and Eli's side is walnut, grille cloth and a glowing tuning dial whose needle follows the slider.

Both parents get a simple admin panel at `/admin` (Hebrew by default, with an English switch) where they can upload photos and short videos, write titles and descriptions in Hebrew and English, sort their work into categories, post exhibitions and news, and read messages visitors send them. Changes show up on the public site straight away.

What visitors get:

- **Hebrew and English.** `/he` (right-to-left, the default) and `/en`, with a switch in the corner. Visiting `/` picks the language from the visitor's last choice or their browser.
- **Before/after slider** on any piece that has a "before" photo (great for Eli's restorations).
- **Sound clips** (a restored radio playing, or Inbar talking about a piece).
- **Videos**: short clips uploaded straight to the site (up to 50 MB), or a YouTube/Vimeo link for longer ones.
- **A page for every piece** at `/he/piece/<id>` with Share, WhatsApp and Copy-link buttons. Links show the piece's photo and title in WhatsApp and Facebook previews.
- **"Ask about this piece"** and a general contact form. Messages land in the parent's admin inbox. No email service is needed; they reply from their own email app.
- **Exhibitions & news** under each gallery, with "Upcoming" on future dates.
- **Search and sorting** in each gallery (search looks through names, materials, years and categories in both languages).
- **Photo zoom** (tap a photo for a full-screen viewer; pinch or tap to zoom further).
- **Like button** (one like per browser, no login) and **"More like this"** suggestions on each piece.

This is a portfolio only, with no shop or payments.

---

## 1. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | **Next.js 16 (App Router) + React 19 + TypeScript** | Server-rendered, fast first paint, image optimisation built in, and one codebase for the site and the admin. |
| Styling | **Tailwind CSS v4** | Two very different themes (Inbar / Eli) driven by a handful of CSS variables, with no extra CSS framework. |
| Backend | **Supabase** (Postgres + Auth + Storage) | One free-tier service covers the database, login for the parents, and photo storage. Row Level Security enforces who can edit what, so there is no custom API server to maintain. |
| Hosting | **Vercel** (free Hobby plan) | Zero-config for Next.js. Netlify or any Node host also works. |

**Why not Sanity, Contentful or Firebase?** A headless CMS like Sanity gives you a ready-made editor, but its studio is built for content teams and is more than two non-technical users need. The custom admin here is three screens with large buttons and words that fit each parent's craft ("Restoration work", "How it was made"). Supabase also keeps everything (data, logins, photos) in one place with one bill: free at this size.

---

## 2. Project structure

```
supabase/migrations/               Database tables, security rules, photo bucket, starter categories
src/
  proxy.ts                          Sends "/" to /he or /en
  app/
    [lang]/layout.tsx               Public site root layout (lang + dir per language)
    [lang]/page.tsx                 Home page: loads the portfolio (cached) and renders it
    [lang]/piece/[id]/page.tsx      Shareable page per piece, with link-preview metadata
    fonts.ts                        Fraunces + Caveat (Inbar), Righteous + Space Mono (Eli), Rubik, Suez One + Amatic SC (Hebrew)
    globals.css                     Theme variables, paint blobs, wood grain, grille cloth
    admin/
      layout.tsx                    Admin root layout (Hebrew by default)
      page.tsx                      Admin dashboard (redirects to login when signed out)
      login/page.tsx                Email + password sign-in
      actions.ts                    Server action that refreshes the public site after edits
  components/
    hero/SplitScreenSlider.tsx      ★ The draggable split-screen component (reusable, no dependencies)
    hero/InbarHero.tsx              Inbar's half of the hero
    hero/EliHero.tsx                Eli's half of the hero (tuning dial)
    HomeExperience.tsx              Wires the slider to the per-side sections
    SideSection.tsx                 Bio, gallery, news and contact form for the chosen parent
    LanguageSwitch.tsx              עברית / English toggle
    gallery/Gallery.tsx             Category filters + masonry grid
    gallery/ItemDialog.tsx          Pop-up with a piece's details
    piece/PieceDetails.tsx          Photos, videos, before/after, sound, details, share, contact
    piece/BeforeAfterSlider.tsx     Drag-to-compare before/after photos
    admin/*                         Dashboard, add/edit form, categories, news, messages, "About me"
  lib/
    i18n.ts                         Public-site wording in Hebrew and English
    shrink-image.ts                 Shrinks photos in the browser before upload
    portfolio.ts                    Cached read of all public content ('use cache' + cacheTag)
    admin-api.ts                    All admin writes (Supabase client, RLS-protected)
    supabase.ts                     Supabase clients + photo URL helper
    demo-data.ts                    Sample content shown until Supabase is connected
    types.ts                        Shared types
```

---

## 3. The split-screen slider

`src/components/hero/SplitScreenSlider.tsx` is self-contained and can be reused with any two panes:

```tsx
<SplitScreenSlider
  selected={selected}               // "left" | "right" | null
  onSelect={setSelected}
  left={{
    label: "Inbar's art",
    background: <InbarBackground />,          // stays still
    content: (share) => <InbarContent />,     // share = 0..1 of the screen this pane covers
  }}
  right={{ label: "Eli's radios", background: <EliBackground />, content: (share) => <EliContent /> }}
/>
```

How it works:

- **Both panes are full-screen layers**, clipped with `clip-path: inset(...)`. Moving the divider only changes the clip, so nothing re-lays-out and dragging stays at 60fps.
- **Content follows the visible slice.** Each pane's content lives in a box exactly as wide as the visible part, shifted with `transform` to stay centred. That box is a CSS container, so headings sized in `cqw` grow and shrink smoothly as a side opens.
- **Pointer events** (`setPointerCapture`) cover mouse, touch and pen with one code path. `touch-action: none` on the handle stops phones scrolling while you drag.
- **Commit and snap.** Releasing past 80% opens that side fully and calls `onSelect`. Releasing in the middle leaves the divider where it was dropped. A tap on either side opens it, and a tap on the handle while a side is open brings both back.
- **Hover nudge.** On desktop, hovering a side leans the divider 6% towards it as a hint.
- **Accessible.** The handle is a real `role="slider"`: arrow keys move it, Home/End open a side, Escape resets. Each side is a labelled button. `prefers-reduced-motion` turns the animations off.

---

## 4. Database schema

Everything is in [`supabase/migrations/`](supabase/migrations/): `0001_init.sql` creates it, `0002_security_hardening.sql` tightens the security rules, `0003_bilingual_media_news.sql` adds Hebrew text, media, news, messages and reordering, and `0004_likes_and_stats.sql` adds likes and visitor counters.

```
sides         side (PK: 'inbar' | 'eli'), display_name(_he), tagline(_he), bio(_he), hero_image
admins        user_id (PK → auth.users), side
categories    id, side, name, name_he, sort_order
items         id, side, category_id → categories, title(_he), description(_he), year,
              materials(_he) (Inbar), manufacturer + model (Eli), process(_he),
              cover_path, before_path, audio_path, video_url,
              published, sort_order, created_at, updated_at
item_photos   id, item_id → items, path, caption, kind ('image' | 'video'), sort_order
posts         id, side, title(_he), body(_he), location, event_date, image_path, published
messages      id, side, item_id → items, name, email, body, is_read, created_at
storage       bucket "portfolio" (public read, 50 MB per file), files at <side>/<item-id>/<uuid>.jpg
```

Design notes:

- **One `items` table for both parents.** Most fields are shared (title, photos, description, year, category). The few craft-specific ones are optional columns: `materials` for Inbar, `manufacturer` and `model` for Eli, and `process` meaning "how it was made" for Inbar and "restoration work" for Eli. The admin form shows only the fields that apply to whoever is logged in, with wording that fits their craft.
- **Categories are data, not a fixed list**, so Inbar can add "Ceramics" tomorrow without a code change. Starter categories are seeded for both sides.
- **`item_photos`** holds extra photos per piece (work in progress, details, before/after for radios). The first photo the parent picks is the cover.
- **`published`** lets a parent save a draft and show it later.
- **Hebrew and English live side by side**: plain columns are English and `*_he` columns are Hebrew. If one is empty, the site shows the other, so a parent can fill in just one language.
- **Messages are write-only for visitors.** Anyone can insert a message (with a limit of 20 per side per hour), but only the parent it was sent to can read it.
- **Likes and stats** are counters on `items` (`view_count`, `like_count`, `share_count`) and `sides.visits`. Visitors can only change them through five narrow functions (`set_like`, `like_state`, `record_view`, `record_share`, `record_side_visit`); the `item_likes` table itself is closed to the public. The admin panel's **Stats** tab reads the totals.
- **`reorder_items(ids)`** saves a new gallery order in one call, running as the signed-in parent so the security rules still apply.
- **Security lives in the database.** Row Level Security policies let anyone *read* published items, and let a logged-in admin *write* only rows where `side` matches their own `admins.side`. The same rule applies to the storage bucket by folder name, so Inbar's account physically cannot edit Eli's radios and vice versa.

---

## 5. Step-by-step setup

### Step 1: Run it locally with demo content

```bash
git clone https://github.com/Kfir56/mom_and_dad_website.git
cd mom_and_dad_website
npm install
npm run dev
```

Open http://localhost:3000. Until Supabase is connected the site shows sample artworks and radios, so you can try the slider immediately.

### Step 2: Create the Supabase project

1. Sign up at https://supabase.com and create a new project (free plan). Pick the region closest to your parents' visitors.
2. Open **SQL Editor → New query**, paste the whole of `supabase/migrations/0001_init.sql`, and click **Run**. Then do the same with `0002_security_hardening.sql` and `0003_bilingual_media_news.sql`, in that order. Together they create the tables, the security rules, the `portfolio` photo bucket and the starter categories.
3. Open **Project Settings → API Keys** and copy the **Project URL** and the **publishable** key (`sb_publishable_...`). The legacy anon key also works.
4. In the project folder:
   ```bash
   cp .env.example .env.local
   ```
   and paste the two values in.

### Step 3: Create logins for Inbar and Eli

Public sign-up stays off: only the two accounts you create can log in.

1. **Authentication → Sign In / Providers → Email**: keep Email enabled and turn **Allow new users to sign up** off.
2. **Authentication → Users → Add user → Create new user**: add Inbar's email with a password, and tick **Auto Confirm User**. Repeat for Eli.
3. Link each account to their side. In **SQL Editor**, run:
   ```sql
   insert into public.admins (user_id, side)
   select id, 'inbar' from auth.users where email = 'inbar@example.com';

   insert into public.admins (user_id, side)
   select id, 'eli' from auth.users where email = 'eli@example.com';
   ```
4. Restart `npm run dev`, go to http://localhost:3000/admin, and log in as each of them to check.

### Step 4: How the admin upload flow works

1. A parent signs in at `/admin/login`. Supabase Auth keeps them signed in on that browser.
2. The dashboard looks up their row in `admins` to know which side they edit, and loads only their pieces, including hidden drafts.
3. **Add a new artwork/radio**: they pick or drag in photos and short videos, optionally add a "before" photo, a sound clip and a YouTube/Vimeo link, choose a category (or create one on the spot), fill in a title and a few optional fields in Hebrew, English or both, and press **Save**.
4. Photos are **shrunk in the browser** (longest side 2560px, JPEG) so a 10 MB phone photo uploads as well under 1 MB. Then files upload **directly from the browser to Supabase Storage**, so they never pass through the web server. Next.js resizes photos per device when visitors view them. Videos are uploaded as they are, up to 50 MB.
5. Pieces can be **dragged into a new order** (or moved with the arrow buttons) on the dashboard.
6. After every save, edit or delete, the admin calls a server action (`refreshPublicSite`) that checks the login and calls `updateTag('portfolio')`. The home page is cached, so it stays fast, and that call tells Next.js to rebuild it with the new content on the next visit.
7. Deleting a piece also deletes its photos, videos and sound from storage.
8. The **Messages** tab shows what visitors sent, with a count of unread ones. **Reply by email** opens their email app with the visitor's address filled in.

### Step 5: Deploy

1. Push this repo to GitHub (already done if you're reading this there).
2. At https://vercel.com, **Add New → Project**, import `mom_and_dad_website`, and add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` environment variables.
3. Deploy. Then in Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel URL (or your custom domain once you add one).
4. Bookmark `https://<your-site>/admin` on your parents' phones and computers.

### Step 6 (optional): Nice extras

- **Custom domain** in Vercel → Settings → Domains.
- **Password resets**: send a reset link from Supabase → Authentication → Users → ⋯ → Send password recovery.
- **Hero background photos**: each parent can upload one under **About me**, and it shows behind their half of the split screen.
- **Backups**: Supabase free projects pause after a week of no traffic. A visitor or an uptime pinger keeps it awake, and the Pro plan adds daily backups.

---

## Working on it with Claude Code

The repo is set up for Claude Code:

- `.claude/skills/` holds Supabase's official agent skills (`supabase` and `supabase-postgres-best-practices`), installed with `npx skills add supabase/agent-skills`. Run `npx skills update` to refresh them.
- `.mcp.json` registers the Supabase MCP server for this project (ref `vnnnsmxgfggrzyrlqplo`). The first time you open the repo in Claude Code, approve the server and run `/mcp` to sign in to Supabase in the browser.

---

## Scripts

```bash
npm run dev     # local dev server
npm run build   # production build
npm run lint    # ESLint
```
