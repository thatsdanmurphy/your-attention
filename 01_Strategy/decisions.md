# Decision Log: Your Attention

Every non-obvious choice lives here with its reasoning. The diff shows what changed. This document explains why.

---

## 2026-03-27 — The "Leave" behavior

**What:** "Leave" attempts no `window.close()`. It navigates directly to `about:blank`.

**Why:** The original instinct was `window.close()` → fallback to blank. But `window.close()` triggers browser confirmation dialogs on most modern browsers, which breaks the experience entirely — a popup asking "Are you sure you want to leave?" is the exact anti-pattern the piece is critiquing. The blank page *is* the point: you chose to leave, so you left. Nothing follows. The absence is the contrast. Direct navigation to `about:blank` delivers this cleanly with zero browser interference.

**Revisit if:** A future browser API allows silent tab closure, or if user testing shows the blank page lands as confusing rather than intentional.

---

## 2026-03-27 — Individual value + scaled amplification (dual display)

**What:** Two numbers run simultaneously. The individual session value (`$0.003`) and a scaled figure showing that same rate multiplied across the platform's daily active user base (`~3.5B for Meta`). Both increment in real time.

**Why:** The individual number alone risks feeling anticlimactic — after a minute you've "generated" fractions of a cent. Without context, the smallness deflates the piece. The scaled figure is where the "oh shit" moment lives: the same rate, simultaneously, across billions of people, converts a decimal into a number that reads like a business. The dual display lets both truths coexist: you are individually worth almost nothing per second, and that almost-nothing is one of the largest revenue streams in history. Neither number lies. Together they're the argument.

**Revisit if:** The dual display feels cluttered in testing, or if the scaled number overwhelms the personal one to the point where users disengage from their individual figure.

---

## 2026-03-27 — Lens switching does not reset the counter

**What:** Switching between lenses (Meta, Google, YouTube, etc.) changes the rate going forward but does not reset elapsed time or accumulated value.

**Why:** A reset would imply each lens is a separate experience — a fresh calculation. Continuity implies something truer: you've been worth different amounts in different contexts, simultaneously, for the whole time you've been online. The counter running through the lens change also creates a small dramatic beat — the number jumps or slows as the new rate applies, making the rate difference visceral rather than abstract.

**Revisit if:** Users read the continuity as a bug rather than intent. A subtle visual cue (brief flash or rate label update) may be needed to signal that the rate changed without resetting.

---

## 2026-03-27 — Lifetime value stored in localStorage

**What:** Session value is added to a running lifetime total stored in `localStorage` under the key `ya_lifetime_value`. On return visits, the lifetime figure is displayed alongside the current session.

**Why:** Two numbers — "this session" and "this browser (lifetime)" — introduce weight without building a dashboard. The return visitor doesn't need an account; they just need to feel that their previous time here was recorded. localStorage is the right scope: it's persistent enough to matter, private enough to stay consistent with the piece's refusal to track identity, and clearable by the user (which is itself thematically appropriate — you can erase it, but only manually).

**Revisit if:** The lifetime total becomes a gamification hook rather than a sobering one. If users start optimizing for a high number, the framing has flipped.

---

## 2026-03-27 — No social sharing mechanics

**What:** The site has no share buttons, no OG-card-optimized copy, no "tweet this" prompt.

**Why:** The brief is explicit: this travels person-to-person or not at all. Social sharing mechanics would turn a quiet artifact into a content piece. The goal is that someone sends the URL in a text message because they felt something — not because a prompt appeared after 60 seconds. The OG image and title are set correctly so that when someone does share it, the preview is clean. But nothing inside the experience prompts or rewards sharing.

**Revisit if:** Distribution stalls completely and there's evidence that frictionless sharing would bring in the right audience (not just scale). Even then, consider a copy-link mechanic over native share.

---

## 2026-03-27 — Microcopy sequence timing

**What:** Time-gated text reveals at 15s, 30s, 60s, and 3min. The sequence does not loop. After 3min, the only text on screen is the numbers and "Leave."

**Why:** The reveals reward presence without becoming a narrative that demands completion. Each line is a fact, not a chapter. The 3-minute beat exists for the deep dwell user — someone who has been there long enough that silence itself becomes the final statement. Past 3 minutes, the experience becomes purely numerical: how long will you stay with just a number?

**Revisit if:** Testing shows users actively waiting for the next reveal (gamification signal) rather than sitting with each one.
