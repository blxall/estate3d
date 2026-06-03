---
version: alpha
name: Estate3D Warm Editorial Showroom
description: "Premium real-estate visualization system: full-bleed architectural visuals, warm editorial overlays, frosted sales HUD, and disciplined hairline UI."
colors:
  primary: "#4A0A05"
  secondary: "#7F625E"
  tertiary: "#8F2D1F"
  neutral: "#FAF7EF"
  surface: "#FFF8EC"
  surfaceGlass: "#FFF9EF"
  border: "#D9C7AE"
  accentGold: "#B88A47"
  sage: "#7D9079"
  ink: "#27140F"
typography:
  h1:
    fontFamily: Inter
    fontSize: 7rem
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.075em"
  h2:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "-0.045em"
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  label:
    fontFamily: Inter
    fontSize: 0.72rem
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.14em"
rounded:
  sm: 10px
  md: 18px
  lg: 28px
  xl: 42px
spacing:
  xs: 6px
  sm: 10px
  md: 18px
  lg: 28px
  xl: 48px
components:
  editorial-panel:
    backgroundColor: "{colors.surfaceGlass}"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: 48px
  frosted-hud:
    backgroundColor: "{colors.surfaceGlass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  outline-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: 12px
  primary-cta:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: 14px
  active-floor-pill:
    backgroundColor: "{colors.accentGold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 12px
  availability-pill:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 10px
  hairline-card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 18px
  bordered-surface:
    backgroundColor: "{colors.border}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 10px
---

## Overview

Estate3D should feel like a premium architectural showroom, not a SaaS dashboard. The page composition is visual-first: full-bleed architectural imagery or 3D hero, then editorial copy and floating interaction layers. UI should feel like a sales atelier for developers, brokers, and buyers.

Primary inspiration: Incommonwith-style warm editorial atmosphere. Use General Intelligence Company only for floating/frosted HUD mechanics. Use Stykka for restraint, hairline discipline, and object-first minimalism.

## Colors

- **Primary (#4A0A05):** oxblood / espresso-burgundy for brand typography and high-emphasis controls.
- **Neutral (#FAF7EF):** warm cream paper canvas.
- **Surface (#FFF8EC):** linen surface for cards and panels.
- **Accent Gold (#B88A47):** sparingly for floor/unit affordances and active state glints.
- **Sage (#7D9079):** secondary availability/status tone.

Avoid cold SaaS blue as the primary accent. Avoid pure-black slabs in customer-facing viewer screens.

## Typography

Use large editorial headlines with tight tracking for marketing/showroom surfaces. Body copy should remain readable and sales-oriented. All-caps labels can be used sparingly for architectural readouts, but not for raw debug state.

## Layout

The preferred premium viewer structure is full-bleed visual first:

1. Architectural/3D background dominates the page.
2. Editorial panel floats over the image.
3. Viewer/HUD controls float as secondary interaction surfaces.
4. Technical/readout data remains semantic but visually hidden or demoted.

Do not rebuild premium screens as ordinary dashboard grids unless the user explicitly asks for admin tooling.

## Elevation & Depth

Use frosted linen overlays, subtle borders, and depth from image/3D composition rather than heavy shadows. Shadows should be soft and low-contrast.

## Shapes

Use rounded panels and pill controls, balanced by Stykka-like hairline borders. Avoid noisy nested cards.

## Components

- `editorial-panel`: main text overlay over full-bleed visual backgrounds.
- `frosted-hud`: floating sales/selection panel.
- `outline-pill`: secondary selection and filter controls.
- `primary-cta`: sales lead action only; do not overuse.

## Do's and Don'ts

Do:

- Study `styles.refero.design` before major visual milestones.
- Match reference structure, not only color palette.
- Capture desktop and mobile screenshots after each visual slice.
- Hide customer-facing debug/readout strings.
- Keep semantic DOM for tests and accessibility.

Don't:

- Treat a recolor as a redesign.
- Let raw `viewerState`, `Deep link`, `R3F-ready`, mesh labels, or camera diagnostics dominate the visible UI.
- Use cold SaaS-blue or black slabs as the main premium real-estate look.
- Ship visual changes without screenshot audit.
