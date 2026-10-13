# Aerovate

Event website inspired by the visual direction and event experience of [ROVARIS](https://rovaris2026.vercel.app/).

## Scope

First release: landing page, photo gallery, Thrust Tech information, and games. Further features will be agreed later. Use Aerovate branding, copy, and approved assets; event dates, venue, rules, and game concepts still need confirmation.

This repository currently contains the team plan only. Website implementation has not started.

## Seven-member work allocation

Names and GitHub usernames are pending. Member numbers are placeholders, and branches are named by responsibility so they can remain stable after assignment.

| Member | Branch | Ownership and deliverables |
| --- | --- | --- |
| 1 | `team/01-foundation-ui` | Project setup and shared UI: agree the framework with the team, establish the app structure and routes, design tokens, responsive navigation, footer, reusable buttons/cards, and shared loading/error states. Document setup and component usage. |
| 2 | `team/02-landing-page` | Landing page: Aerovate hero artwork/layout, event overview, confirmed date/venue, call to action, sponsor area, and restrained motion. Build responsive sections using Member 1's shared components. |
| 3 | `team/03-photo-gallery` | Photo gallery: responsive grid, image metadata/captions, categories if needed, keyboard-accessible lightbox, lazy loading, optimized images, and empty/error states. Own gallery assets and content. |
| 4 | `team/04-thrust-tech-info` | Thrust Tech information: overview, technical explanations and diagrams, confirmed rules/schedule, FAQs, and contact links. Verify content with the event team and maintain it separately from presentation. |
| 5 | `team/05-games-hub-game-one` | Games hub and first game: game selection, instructions, first playable game, keyboard/touch controls, pause/restart, and score display. Agree the game interface with Member 6 before implementation. |
| 6 | `team/06-game-two-score-system` | Second game and shared game utilities: second playable game, timing/scoring helpers, result screen, and local best-score storage. Coordinate controls and result format with Member 5. Game concepts are to be decided; online leaderboards/accounts are outside the initial scope. |
| 7 | `team/07-integration-quality-release` | Integration and release: build checks/CI, cross-page navigation checks, mobile/browser QA, accessibility and performance review, metadata/SEO, deployment configuration, and release checklist. Maintain the future-feature backlog. Each feature owner fixes defects in their own area. |

## Ownership boundaries

- Member 1 owns shared layout, global styling, routing, and dependency changes; coordinate changes to those files before editing.
- Members 2-4 own their feature pages, feature styles, and content/assets.
- Members 5-6 agree one game contract (start, pause, reset, finish, score/result) and keep each game's implementation separate.
- Member 7 owns CI and release configuration and coordinates integration; feature owners still test and review their own work.
- Decide exact folders and interfaces in Member 1's first setup PR. Avoid unrelated edits to another member's area.

## Delivery order

1. Confirm the visual direction, framework, routes, content requirements, and game concepts. Member 1 opens the setup/shared-UI PR; other members prepare content, layouts, and game prototypes in parallel.
2. Merge the foundation into `main`. Every member updates their branch from `main` before integrating feature code.
3. Merge small feature PRs for the landing page, gallery, information page, and games. Member 7 starts integration checks as soon as the foundation exists.
4. Complete responsive, keyboard, touch, image-loading, navigation, and game-reset/score checks. Resolve defects, review the release checklist, and publish when the team is ready.

## Branch and pull-request workflow

- `main` is the shared integration branch; keep it working. The seven member branches start from the same planning commit.
- Work in your assigned branch and open focused pull requests into `main`.
- Pull the latest `main` into your branch regularly, especially after the foundation or shared UI changes.
- Request at least one teammate review and pass available checks before merging. These are team conventions; repository protection rules are not configured by this plan.
- Do not force-push shared branches. Coordinate shared-file edits and resolve conflicts with the relevant owner.
- A branch name documents ownership but does not grant repository access. The owner must invite members separately once their usernames are available.

## Definition of done

Each feature works at mobile and desktop sizes, supports relevant keyboard/touch input, uses shared UI, handles applicable empty/loading/error states, has no known blocking console errors, and includes a short PR description with verification steps. New games must restart cleanly and report scores consistently.

## Future backlog (not committed scope)

Potential additions such as registration, an event schedule, admin/content tools, online leaderboards, or additional games must be prioritized before implementation. Member 7 tracks decisions; assign each approved feature a clear owner and acceptance criteria.
