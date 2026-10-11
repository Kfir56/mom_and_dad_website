# Inbar & Eli

A two-sided portfolio site for Inbar (multimedia art) and Eli (restored 1950s–60s radios).

The home page is a full-screen split. Visitors drag the centre handle left or right, or tap a side. Pulling a side past 80% (or tapping it) opens that side fully, and its gallery and story appear below. Inbar's side is colourful and painterly, and Eli's side is walnut, grille cloth and a glowing tuning dial whose needle follows the slider.

Both parents get a simple admin panel at `/admin` where they can upload photos, write titles and descriptions, and sort their work into categories. Changes show up on the public site straight away.

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
supabase/migrations/0001_init.sql   Database tables, security rules, photo bucket, starter categories
src/
  app/
    page.tsx                        Home page: loads the portfolio (cached) and renders it
    layout.tsx                      Fonts (Fraunces + Caveat for Inbar, Righteous + Space Mono for Eli)
    globals.css                     Theme variables, paint blobs, wood grain, grille cloth
    admin/
      page.tsx                      Admin dashboard (redirects to login when signed out)
      login/page.tsx                Email + password sign-in
      actions.ts                    Server action that refreshes the public site after edits
  components/
    hero/SplitScreenSlider.tsx      ★ The draggable split-screen component (reusable, no dependencies)
    hero/InbarHero.tsx              Inbar's half of the hero
    hero/EliHero.tsx                Eli's half of the hero (tuning dial)
    HomeExperience.tsx              Wires the slider to the per-side sections
    SideSection.tsx                 Bio + gallery for the chosen parent
    gallery/Gallery.tsx             Category filters + masonry grid
    gallery/ItemDialog.tsx          Full-size view with all photos and details
    admin/*                         Dashboard, add/edit form, categories, "About me"
  lib/
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

Everything is in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

```
sides         side (PK: 'inbar' | 'eli'), display_name, tagline, bio, hero_image
admins        user_id (PK → auth.users), side
categories    id, side, name, sort_order
items         id, side, category_id → categories, title, description, year,
              materials (Inbar), manufacturer + model (Eli), process,
              cover_path, published, sort_order, created_at, updated_at
item_photos   id, item_id → items, path, caption, sort_order
storage       bucket "portfolio" (public read), files at <side>/<item-id>/<uuid>.jpg
```

Design notes:

- **One `items` table for both parents.** Most fields are shared (title, photos, description, year, category). The few craft-specific ones are optional columns: `materials` for Inbar, `manufacturer` and `model` for Eli, and `process` meaning "how it was made" for Inbar and "restoration work" for Eli. The admin form shows only the fields that apply to whoever is logged in, with wording that fits their craft.
- **Categories are data, not a fixed list**, so Inbar can add "Ceramics" tomorrow without a code change. Starter categories are seeded for both sides.
- **`item_photos`** holds extra photos per piece (work in progress, details, before/after for radios). The first photo the parent picks is the cover.
- **`published`** lets a parent save a draft and show it later.
- **Security lives in the database.** Row Level Security policies let anyone *read* published items, and let a logged-in admin *write* only rows where `side` matches their own `admins.side`. The same rule applies to the storage bucket by folder name, so Inbar's account physically cannot edit Eli's radios and vice versa.

---

## 5. Step-by-step setup

### Step 1: Run it locally with demo content

```bash
git clone https://github.com/Kfir56/mom-and-dad-websites.git
cd mom-and-dad-websites
npm install
npm run dev
```

Open http://localhost:3000. Until Supabase is connected the site shows sample artworks and radios, so you can try the slider immediately.

### Step 2: Create the Supabase project

1. Sign up at https://supabase.com and create a new project (free plan). Pick the region closest to your parents' visitors.
2. Open **SQL Editor → New query**, paste the whole of `supabase/migrations/0001_init.sql`, and click **Run**. This creates the tables, the security rules, the `portfolio` photo bucket and the starter categories.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
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
3. **Add a new artwork/radio**: they pick or drag in photos (JPG, PNG or WebP, up to 25 MB each), choose a category (or create one on the spot), fill in a title and a few optional fields, and press **Save**.
4. Photos upload **directly from the browser to Supabase Storage**, so large originals never pass through the web server. Next.js resizes them per device when visitors view them.
5. After every save, edit or delete, the admin calls a server action (`refreshPublicSite`) that checks the login and calls `updateTag('portfolio')`. The home page is cached, so it stays fast, and that call tells Next.js to rebuild it with the new content on the next visit.
6. Deleting a piece also deletes its photos from storage.

### Step 5: Deploy

1. Push this repo to GitHub (already done if you're reading this there).
2. At https://vercel.com, **Add New → Project**, import `mom-and-dad-websites`, and add the two `NEXT_PUBLIC_SUPABASE_*` environment variables.
3. Deploy. Then in Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel URL (or your custom domain once you add one).
4. Bookmark `https://<your-site>/admin` on your parents' phones and computers.

### Step 6 (optional): Nice extras

- **Custom domain** in Vercel → Settings → Domains.
- **Password resets**: send a reset link from Supabase → Authentication → Users → ⋯ → Send password recovery.
- **Hero background photos**: each parent can upload one under **About me**, and it shows behind their half of the split screen.
- **Backups**: Supabase free projects pause after a week of no traffic. A visitor or an uptime pinger keeps it awake, and the Pro plan adds daily backups.

---

## Scripts

```bash
npm run dev     # local dev server
npm run build   # production build
npm run lint    # ESLint
```
