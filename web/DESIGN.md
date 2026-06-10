# Design System: ChaWork Skill Hub

## 1. Visual Theme & Atmosphere

A dark, focused operating surface for solo operators building reusable AI work systems. The atmosphere borrows the `codex-demo` cockpit mood but removes decorative excess: low-glare charcoal canvas, amber as the only active signal, compact metadata, and asymmetric content blocks. Density is 6/10, variance is 6/10, motion is 4/10.

## 2. Color Palette & Roles

- **Deep Work Canvas** (#07070B) - Primary application background, never pure black
- **Raised Graphite** (#101018) - Navigation, footer, and elevated surface fill
- **Panel Charcoal** (#15151F) - Cards, filters, inputs, and detail containers
- **Hairline Alloy** (rgba(255,255,255,0.08)) - Structural 1px borders
- **Quiet Steel** (#8D8DA3) - Secondary text, descriptions, timestamps, metadata
- **High Ink** (#F1F1F5) - Primary headings and important labels
- **Signal Amber** (#C9852C) - Single accent for CTAs, active states, focus rings, and numeric emphasis

## 3. Typography Rules

- **Display:** Geist - Track-tight, weight-driven hierarchy, never oversized inside dense panels
- **Body:** Geist - Relaxed leading, max 65 characters per line for prose
- **Mono:** Geist Mono - IDs, counts, protocol links, hashes, metadata, and code blocks
- **Banned:** Inter, generic serif fonts, pure black, neon glow treatments, and purple-blue AI gradients

## 4. Component Stylings

- **Buttons:** Flat amber primary, graphite secondary. Active state translates down 1px. Minimum tap target is 44px.
- **Cards:** Use low-contrast panels with hairline borders. Hover changes border and background only, no outer glow.
- **Inputs:** Label or icon outside the typing area. Focus ring uses Signal Amber. No floating labels.
- **Loaders:** Use layout-matched skeletons if needed. No circular loading spinners.
- **Empty States:** Use concise, composed copy with a visible action when an action exists.
- **Error States:** Inline copy near the failed section, not page-level noise.

## 5. Layout Principles

Grid-first, contained at 1280 to 1400px. Hero sections are left-aligned with supporting instrumentation on the right. Market pages use an asymmetric 12-column composition on desktop and a single column below 768px. Repeated cards may use grid, but avoid generic three-equal-feature rows.

## 6. Motion & Interaction

Use restrained CSS motion only through opacity and transform. Cascade initial elements with small delays. Active components may use subtle border or opacity shifts. Avoid animated layout dimensions.

## 7. Anti-Patterns

Never use emojis in production UI. Never use Inter, pure black, neon shadows, oversaturated accents, large gradient headlines, custom cursors, overlapping content, generic three-column feature rows, fake round-number claims, or AI-copywriting cliches.
