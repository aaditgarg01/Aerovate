# Aerovate

Frontend foundation for the Aerovate event website. Member 1's shared design, routing, responsive header and footer are implemented; six separate starter modules let the remaining members develop in parallel.

**Primary:** `#34506D` · **Secondary:** `#FFFFFF` · Dark navy surfaces, pale blue accents, Space Grotesk headings and DM Sans body text.

## Run locally

Use Node.js 24 LTS (see `.nvmrc`) and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No environment variables, API keys or backend services are required.

```sh
npm test           # navigation, routes, focus, and rocket contract
npm run typecheck  # TypeScript checks
npm run build      # typecheck + production bundle in dist/
npm run preview    # serve the production build
```

## Ready to use

- React + TypeScript + Vite with locally bundled fonts.
- Responsive integrated header, transparent over the hero and solid after scrolling, active links, mobile menu with Escape/focus handling and outside-click dismissal, and skip link.
- Single-page section navigation, including Past POCs at `/#pocs`, legacy `/pocs` redirect, unknown-page fallback and section focus.
- Footer with email contact, clearly labelled Stellar social channels, configurable developer credits and back-to-top link.
- Design tokens, buttons, cards, sections, loading/empty/error states and reduced-motion styling.
- Dedicated feature folders for all seven members and a documented rocket/scroll interface.
- Build/tests in GitHub Actions and Vercel SPA fallback for old `/pocs` links.

## Feature status

| Feature | Status |
| --- | --- |
| Foundation, header, footer | Implemented by Member 1 |
| Landing and event description | Reference-matched sunset hero; Member 2 finalises event content |
| Rocket | Photographed hero rocket; retained SVG fallback and contract for Member 3’s 3D work |
| Space and scroll | Module retained for Member 4; currently unmounted in the photographic hero |
| About Thrust Tech | Placeholder for Member 5 |
| Past-year POCs | Home-page section at `/#pocs` and empty data model for Member 6 |
| Glimpses | Empty-state section and photo data model for Member 7 |

Games and backend work are deferred. Dates, venue, POC names and historical event photographs have not been invented. The hero is a generated design background derived from the supplied reference, not documentary event photography. This is a foundation preview, not a launch-ready event announcement.

## Team workflow

Read **[the team handoff](docs/TEAM_HANDOFF.md)** for ownership, existing branch names, setup order, shared components, design tokens and the rocket interface. After the foundation merges into `main`, update your assigned branch and work in your own feature folder. Coordinate global styles, routing and dependencies with Member 1.

```
src/
  app/                    # composition, routes, focus and error boundary
  components/layout/      # Member 1: header/footer
  components/ui/          # Member 1: shared building blocks
  config/                 # Member 1: navigation, contacts and credits
  styles/                 # Member 1: global styles and tokens
  features/landing/       # Member 2
  features/rocket/        # Member 3
  features/space/         # Member 4
  features/thrust-tech/   # Member 5
  features/pocs/          # Member 6
  features/glimpses/      # Member 7
  test/                   # shared integration checks
public/assets/            # approved rocket, POC and gallery assets
```

## Hosting

`npm run build` generates `dist/`. Vercel configuration is provided; hosting requires a connected Vercel project. Other static hosts must serve `index.html` for non-file routes such as `/pocs`. No deployment is performed by this foundation change.

References: [VIT Stellar](https://vitstellar.vercel.app/) for header/navigation and [ROVARIS](https://rovaris2026.vercel.app/) for the event-site direction. Aerovate uses its own implementation and palette.
