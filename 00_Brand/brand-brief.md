# Brand Brief: Your Attention

## The Concept
A ledger entry that runs in real time — showing the monetary value your attention generates for ad-supported platforms, scaled from your individual session to what it means across billions of people simultaneously.

## The Audience
Someone who already senses something is off about the attention economy but has never seen it expressed as a number. Designers, builders, writers, media thinkers, curious students. Not someone looking for utility — someone willing to sit with a fact.

## The Voice
**Plainspoken. Archival. Restrained.**

Always: States facts without editorializing. Lets the number do the work.
Never: Moralizes, exclaims, or explains what the user should feel.

Write like a ledger entry or a museum plaque. Not like a campaign.

> "Estimated value generated from your attention." ✓
> "Did you know companies are profiting off you?!" ✗

## Typography

- **Number / Primary display:** IBM Plex Mono (or similar monospace) — used exclusively for the accumulating value and the scaled figure. Monospace enforces the ledger metaphor. Numbers feel measured, not designed.
- **Microcopy / Labels:** Inter or system-ui — used for time-gated text reveals, lens labels, and the "Leave" link. Clean, neutral, slightly smaller than expected.
- **No display typefaces.** No serifs trying to be editorial. This is a record, not an essay.

## Color

- **Background:** `#0a0a0a` (near-black) — the absence of stimulation. Makes the number feel like the only thing happening.
- **Primary text / number:** `#f0ede8` (warm off-white) — slightly warmer than pure white; less aggressive, more like aged paper.
- **Secondary / microcopy:** `#6b6b6b` (mid-grey) — present but subordinate. Never competes with the number.
- **Accent:** None. There is no accent color. Color is not used for decoration.
- **Rule:** If you're reaching for color to make something visible, it means the layout isn't doing its job. Fix the layout.

## The Metaphor
**A line in a ledger.**

The UI is a financial record that hasn't finished writing itself yet. Every component should feel like it belongs in an audit document, not an app. The number is not a score — it's an entry. The lenses are not settings — they're different books. "Leave" is not a button — it's a signature at the bottom of the page.

This metaphor governs naming decisions:
- The accumulating figure → `ledgerValue`
- The scaled figure → `ledgerScale`
- The time-gated text reveals → `marginNotes`
- The lens selector → `bookSelector`
- The "Leave" action → `closeEntry`
