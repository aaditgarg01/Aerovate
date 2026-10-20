# Aerovate

The Aerovate event website, built with React, TypeScript and Vite. A single scrolling page brings together the launch experience, Thrust Tech, event information, past-year POCs, Glimpses and contact details.

**Live website:** [aerovate-eight.vercel.app](https://aerovate-eight.vercel.app/)

**Primary:** `#34506D` · **Secondary:** `#FFFFFF` · Dark navy surfaces, pale blue accents, Space Grotesk headings and DM Sans body text.

## Design & development

Built together by the **Aerovate Tech Team**.

| Contributor | Contributions |
| --- | --- |
| [Aadit Garg](https://github.com/aaditgarg01) · [LinkedIn](https://www.linkedin.com/in/aadit-garg22/) | Project setup and shared frontend foundation; theme, reusable UI, responsive header and footer; single-page navigation, section URL tracking and accessibility; feature integration, fixes, testing and Vercel deployment. |
| [Darsh L](https://github.com/Dracula27581234) · [LinkedIn](https://www.linkedin.com/in/darsh-lakshmikanth-b83326388/) | Background artwork. |
| [Harsh Choudhary](https://github.com/SpyApple-web) · [LinkedIn](https://www.linkedin.com/in/harsh-choudhary-4b4300424/) | Scroll animation and cursor interactivity. |
| [Rishit Aggarwal](https://github.com/aggarwalrishit9) · [LinkedIn](https://www.linkedin.com/in/rishit-aggarwal-88504b419/) | Thrust Tech section. |
| [Sushant Singh](https://github.com/singhsushant4684-eng) · [LinkedIn](https://www.linkedin.com/in/sushant-singh-663301378/) | Glimpses gallery. |

Website credits and profile links are configured in [`src/config/site.ts`](src/config/site.ts). The links are platform-neutral: Each person can have GitHub and LinkedIn profiles; the footer shows names and links without contribution descriptions. Keep this table in sync when changing contributor details.

## Run locally

Use Node.js 24 LTS (see `.nvmrc`) and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No environment variables, API keys or backend services are required.

```sh
npm test           # navigation, section URLs, motion, cursor and gallery checks
npm run typecheck  # TypeScript checks
npm run build      # typecheck + production bundle in dist/
npm run preview    # serve the production build
```

## Website features

- Floating pill header with VIT Stellar branding, a centred Aerovate logo placeholder and a burger menu at every screen size. It fades after the hero and returns to full opacity on hover, keyboard focus or menu opening. Active section links, keyboard focus handling and a skip link are preserved.
- Single-page navigation with URL hashes that follow scrolling, including Past POCs at `/#pocs`. The legacy `/pocs` route redirects to that section.
- Sunset hero with a scroll-driven launch sequence, countdown, ignition, liftoff and nightfall.
- Rocket cursor with smooth steering, flame and exhaust, magnetic controls, hover labels and card spotlights on supported desktop pointers.
- Thrust Tech introduction, animated logo that replays on return, team imagery and a scroll-driven collaboration trajectory.
- Glimpses gallery with globe presentation, photograph browsing and a lightbox for approved images.
- Native scrolling without wheel interception; offscreen/background animation suspension, capped decorative drawing and cached gallery/marquee measurements.
- Shared design tokens, UI components, loading/empty/error states and reduced-motion support.
- Twilight blossom footer matching the supplied design, with live contact text, social icons, GitHub/LinkedIn contributor links and an large interactive AEROVATE wordmark below the footer content.
- Automated frontend checks in GitHub Actions and deployment through Vercel.

## Content and remaining work

| Area | Current status |
| --- | --- |
| Foundation, navigation and footer | Implemented and integrated. |
| Landing and event description | Sunset hero implemented; final programme, dates and venue are pending. |
| Rocket | The hero rocket uses image assets; the SVG fallback and component contract remain available for future 3D model integration. A 3D model is not yet mounted. |
| Scroll and cursor | Native scrolling, frame-rate-independent cursor smoothing and reduced-motion fallbacks; decorative loops pause offscreen and in background tabs. |
| Thrust Tech | Implemented, including repeatable logo entrance and collaboration animation. |
| Past-year POCs | Interactive 2024–2026 timeline (one POC per year) with keyboard, swipe and previous/next controls; spotlight card with photo fallback, profile link and event experience. Placeholders marked "Details pending" are shown until approved names, photos, links and experiences are added to `src/features/pocs/data.ts`. |
| Glimpses | Gallery interface implemented; approved historical photographs and captions are pending. |

Games and backend work are deferred. Dates, venue, POC names and historical photographs have not been invented. The hero artwork is a design background, not documentary event photography. Event details should be approved before the public announcement.

## Team workflow

Read **[the team handoff](docs/TEAM_HANDOFF.md)** for the original seven-member ownership plan, branch names, shared components, design tokens and rocket interface. The contribution credits above record work delivered so far.

Update your feature branch from `main` before starting work. Keep changes in the relevant feature folder and coordinate global styles, routing and dependencies with Aadit.

```text
src/
  app/                    # composition, routes, focus and error boundary
  components/layout/      # shared header and footer
  components/ui/          # shared building blocks
  config/                 # navigation, contacts and contributor credits
  styles/                 # global styles and design tokens
  features/landing/       # landing and event description
  features/rocket/        # rocket component contract and SVG fallback
  features/space/         # launch sequence, scrolling and cursor effects
  features/thrust-tech/   # Thrust Tech introduction and animation
  features/pocs/          # past-year POC section and data
  features/glimpses/      # gallery, globe and lightbox
  test/                   # automated checks
public/assets/            # rocket, POC and gallery assets
```

The header uses the official Stellar logo from the [VIT Stellar website](https://vitstellar.vercel.app/assets/logos/logo.webp), saved locally in `public/assets/branding/`. The provisional Aerovate mark is inside `.aerovate-logo-placeholder` in `src/components/layout/Header.tsx` and can be replaced with the approved event logo.

## Hosting

The repository is connected to Vercel, which deploys updates merged into `main`. Run `npm test` and `npm run build` before merging. The production bundle is generated in `dist/`.

`vercel.json` provides the SPA fallback for direct and legacy route visits. Other static hosts must serve `index.html` for non-file routes such as `/pocs`. No backend services are needed.

References: [VIT Stellar](https://vitstellar.vercel.app/) for header/navigation and [ROVARIS](https://rovaris2026.vercel.app/) for the event-site direction. Aerovate uses its own implementation and palette.

## Footer artwork

The twilight blossom landscape in `public/assets/footer/twilight-blossom.webp` is a text-free background derived from the supplied footer mockup. All headings, contact details, social icons and contributor links are rendered as accessible HTML/SVG rather than baked into the image. The artwork was prepared using the image-generation skill; the large AEROVATE wordmark below the contact and team content retains its letter hover and scroll-reveal interactions.
