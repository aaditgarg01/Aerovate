# Parallel development handoff

Member 1 owns the shared foundation, header and footer. After the foundation PR is merged, all members update their existing branches from `main` and run `npm ci`.

```sh
git fetch origin
git switch YOUR_EXISTING_BRANCH
git merge origin/main
npm ci
npm run dev
```

Work in the repository root (the directory containing `package.json`). Use its `src/` and `public/` folders; do not copy the project into a nested `Aerovate/` directory.

## Ownership

The existing branch names come from the earlier plan. They are preserved to avoid disrupting checkouts; their revised responsibilities are below. Games and backend work are deferred.

| Member | Existing branch | Owns now | Starting files |
| --- | --- | --- | --- |
| 1 | `team/01-foundation-ui` | Setup, styles, shared components, routes, header/footer, integration | `src/app/`, `src/components/`, `src/config/`, `src/styles/`, root configs |
| 2 | `team/02-landing-page` | Landing and event description | `src/features/landing/` |
| 3 | `team/03-photo-gallery` | 3D rocket and static fallback | `src/features/rocket/`, `public/assets/rocket/` |
| 4 | `team/04-thrust-tech-info` | Space background and scroll animation | `src/features/space/` |
| 5 | `team/05-games-hub-game-one` | About Thrust Tech | `src/features/thrust-tech/` |
| 6 | `team/06-game-two-score-system` | Past-year POCs section | `src/features/pocs/`, `public/assets/pocs/` |
| 7 | `team/07-integration-quality-release` | Glimpses gallery | `src/features/glimpses/`, `public/assets/gallery/` |

Member 1 is Aadit Garg. Add the remaining approved names and profile links to `src/config/site.ts`. Ownership is a collaboration convention, not a GitHub access rule. Coordinate dependency, routing and global styling changes with Member 1.

## Routes and sections

- `/` is the home route. Preserve IDs `home`, `thrust-tech`, `event`, `pocs`, `glimpses`.
- Past POCs lives on the home page at `/#pocs`, between the event and Glimpses. Member 6 owns the named `PocsSection` export in `src/features/pocs/PocsSection.tsx`. The old `/pocs` URL redirects to `/#pocs` for existing links.
- `contact` belongs to the shared footer on every page; use `/#contact` in navigation.
- Preserve `main-content` for the skip link and route focus management.
- The header tracks section positions while scrolling, independently of the URL hash. Preserve the IDs in `src/config/site.ts`; the contact arrow/mobile contact link becomes active in the footer. Tracking must not move focus or add browser-history entries.
- Use React Router `Link` for internal destinations, including `/#section`. Use anchors for external sites, email and phone links.
- Do not add another header/footer inside feature pages; `App.tsx` composes the shared layout.

## Rocket and scroll contract

Members 3 and 4 agree on `src/features/rocket/types.ts`:

```ts
interface RocketSceneProps {
  progress: number;      // 0 at start, 1 at the end of the hero scroll area
  reducedMotion: boolean;
  className?: string;
}
```

Member 4's `SpaceExperience` owns scroll measurement, background and motion preferences. Use `clampProgress` to normalise values. The starter supplies `0`, allowing both members to develop independently. The current sunset hero uses a static photographic background. `SpaceExperience` and `RocketScene` remain available but are not mounted. Member 2 reserves `.hero-rocket-stage` for future integration. Members 2–4 must agree on a background without a photographed rocket before mounting the 3D scene, to avoid showing two rockets.

Member 3's `RocketScene` consumes these props. Avoid document-level scroll listeners in the renderer. Use a stable view for reduced motion, dispose of graphics resources on unmount, and lazy-load model work. Preserve the starter SVG for unavailable WebGL, loading errors and constrained devices.

No 3D library is installed yet. Member 3 proposes dependencies once the model format is chosen; Member 1 coordinates package/lockfile changes. The retained fallback is an original static SVG illustration; the rocket visible in the current hero is part of the background image. Neither is a completed 3D model.

## Shared components

Import `Section`, `ActionLink`, `Button`, `Card`, `EmptyState` and `LoadingState` from `src/components/ui/Primitives.tsx`. `Icon` provides common line icons. Keep feature CSS in its own folder with feature-specific class names.

```tsx
<Section id="thrust-tech" number="01" eyebrow="Behind the experience" title="Meet Thrust Tech.">
  <p className="section-copy">Approved content goes here.</p>
</Section>
```

Tokens are in `src/styles/tokens.css`: primary `#34506D`, secondary `#FFFFFF`, background `#0B1521`, surface `#132332`, accent `#BBD7ED`, hero highlight `#63D5EF`, muted text `#B0BDCB`. Section headings use Space Grotesk; the hero and body use DM Sans; fonts are bundled locally. Content width is 1280px, mobile navigation starts below 960px, and small-screen adjustments below 600px. Keep touch targets at least 44px and preserve focus indicators/reduced motion.

## Content

- POC and gallery types are in their respective `data.ts` files; arrays intentionally start empty.
- Use approved historical names, photos and captions. Never publish test identities as actual POCs.
- Dates, venue, schedule and detailed Thrust Tech information remain unconfirmed; starting copy is a preview.
- The footer uses official VIT Stellar email/social channels, labelled as Stellar channels. Replace the central config if dedicated Aerovate contacts are provided. Source: https://vitstellar.vercel.app/ (checked 14 October 2026).
- The text-only Thrust Tech treatment and Aerovate mark are provisional artwork; replace with approved branding when supplied.
- No backend, authentication, database, registration, or contact form submission is included. Contact works through email.

## Integration and release

1. Merge the foundation into `main`, then update member branches.
2. All seven develop in parallel in their owned folders.
3. Members 3 and 4 integrate the rocket interface; Member 2 coordinates hero sizing.
4. Open small PRs into `main`, run `npm test` and `npm run build`, and include mobile/keyboard checks and screenshots. Have a teammate review.
5. Member 1 coordinates integration; each owner fixes their feature's defects.

Before launch, supply approved content and credits, confirm contact destinations, check navigation/page refreshes, optimise model/photo assets, and check reduced motion. Vercel's SPA fallback is included. Other hosts must route non-file requests to `index.html`. This foundation does not create a hosting deployment.

## Sunset hero reference

The hero follows the supplied sunset reference with live HTML text, a transparent header at the top, cyan highlights, and an optimised photographic background. The header becomes solid after scrolling and on secondary pages. Mobile uses a stacked composition to keep the headline and rocket readable. See [hero asset notes](HERO_ASSET.md) for image provenance.
