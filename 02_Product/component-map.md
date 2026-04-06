# Component Map: Your Attention

Start minimal. This document grows as components are built. The goal: orient yourself in 60 seconds after any absence.

---

## Pages

- **AttentionPage** — the only page. Manages elapsed time (via `setInterval`), selected lens, session value, and lifetime value. Passes computed values down to display components. Writes to localStorage on unmount and at session-value checkpoints.

---

## Components

- **LedgerValue** — renders the primary accumulating dollar figure for the current user session.
  - Renders inside: AttentionPage
  - Key props: `sessionValue: number` (dollars, 6 decimal places displayed)
  - Format: monospace, large, centered. Updates every 100ms for smooth visual increment.

- **LedgerScale** — renders the amplified figure: `sessionValue × platform.dailyActiveUsers`, labeled with platform name.
  - Renders inside: AttentionPage
  - Key props: `sessionValue: number`, `lens: Lens`
  - Format: smaller than LedgerValue but same monospace treatment. Label reads: "across [X]B people right now"
  - This is the "oh shit" number. It should feel consequential, not decorative.

- **MarginNotes** — renders the time-gated microcopy sequence. Fades in each line at its threshold; lines persist once revealed.
  - Renders inside: AttentionPage
  - Key props: `elapsedSeconds: number`
  - Thresholds: 15s → "Still here.", 30s → "This is how it works.", 60s → "Scaled across billions, this becomes a business.", 180s → "You've been here a while."
  - After 180s: component renders nothing new. Existing lines remain.

- **BookSelector** — renders the lens switcher (Meta / Google / YouTube / Low estimate / High estimate).
  - Renders inside: AttentionPage
  - Key props: `selectedLens: LensKey`, `onSelect: (lens: LensKey) => void`
  - Does NOT reset elapsed time on selection. Rate changes forward only.
  - Style: minimal, feels like a footnote selector, not a tab bar.

- **LifetimeEntry** — renders the localStorage lifetime total on return visits only. Hidden on first visit.
  - Renders inside: AttentionPage
  - Key props: `lifetimeValue: number | null`
  - Format: smaller, subdued. Label: "This browser, total."

- **CloseEntry** — renders the "Leave" link.
  - Renders inside: AttentionPage
  - Key props: none
  - Behavior: navigates to `about:blank`. No confirmation. No animation.
  - Hover state (after ~1s): reveals single line of text — "It will keep going if you don't."
  - Style: plain text link, bottom of screen, unobtrusive until you notice it.

---

## Data Flow

A static `rates.ts` config file defines each lens: `{ arpu_per_day, minutes_per_day, daily_active_users }`. `rate_per_second` is derived: `arpu_per_day / (minutes_per_day × 60)`.

AttentionPage holds a `setInterval` (100ms) that increments `elapsedSeconds`. On each tick: `sessionValue = elapsedSeconds × selectedLens.rate_per_second`. The scaled figure is computed inline: `scaledValue = sessionValue × selectedLens.daily_active_users`.

Both values flow down as props. No global state manager needed — this is a single page with a single timer.

---

## State

| Key | Where | Type | Notes |
|---|---|---|---|
| `elapsedSeconds` | AttentionPage local state | `number` | Incremented by interval. Never resets on lens change. |
| `selectedLens` | AttentionPage local state | `LensKey` | Default: `'meta'` |
| `sessionValue` | Derived (not stored) | `number` | `elapsedSeconds × rate_per_second` |
| `lifetimeValue` | `localStorage['ya_lifetime_value']` | `number \| null` | Added to on session end / tab close |

---

## Lens Rate Reference

| Lens | ARPU/day | Min/day | DAU | Rate/sec |
|---|---|---|---|---|
| Meta (default) | $0.154 | 45 | 3.5B | ~$0.0000572 |
| Google Search | $0.411 | 15 | 3.0B | ~$0.000457 |
| YouTube | $0.096 | 40 | 2.7B | ~$0.0000400 |
| Low estimate | $0.027 | 60 | — | ~$0.0000075 |
| High estimate | $0.548 | 30 | — | ~$0.000305 |

*Sources to lock before launch: Meta annual report, Alphabet annual report, analyst ARPU estimates. Document final citations in decisions.md.*

---

## Analytics (minimal, intentional)

Track only:
- Time on page (distribution curve)
- Max value reached per session
- Return rate
- Lens selected

Do not track identity or granular behavior. The irony of over-tracking this specific site is not subtle.
