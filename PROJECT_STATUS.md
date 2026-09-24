# My Web — Project Status

## Project Location

Primary project:

/Volumes/BOSS/My Web

This is the only active version of My Web.

Do not create or continue development from Desktop copies or other duplicate folders.


## Current Stable

- Project has been moved to the BOSS external SSD.
- `打开网站.command` has been converted to a portable launcher.
- The launcher automatically uses its own project directory.
- Node.js and npm are detected automatically.
- Vite starts correctly.
- Current development URL:
  http://127.0.0.1:5173/


## Stable Features — Do Not Break

- Existing Loader / intro animation.
- Yellow brand color: #FFDA00.
- F logo in the upper-left corner.
- F logo returns to the homepage.
- Main Hero copy:

VISUAL
THINKING,
SHAPED WITH
PURPOSE.

- Chinese copy:

以视觉
思考，
用设计
表达。


## Current Visual Direction

Homepage direction:

- Dark / black base.
- Yellow as primary brand accent.
- Deep blue, cyan and orange may be used as secondary colors.
- ShapeWaves-style dynamic geometric background.
- Large white Hero typography.
- Strong but controlled visual hierarchy.
- Avoid generic corporate website styling.
- Avoid excessive UI elements.
- Avoid making the homepage feel uniformly busy.


## Glass / Lens Direction

Desired lens characteristics:

- Thick convex-glass feeling.
- Clear center.
- Stronger refraction toward the edge.
- Subtle cyan / orange chromatic fringe.
- No excessive RGB splitting.
- No flat grey translucent circle.
- Background inside and outside the lens must visually align.
- Chinese content revealed through the lens should remain readable.


## Current Development Focus

1. Improve Hero typography.
2. Improve visual hierarchy.
3. Reduce monotony in the homepage composition.
4. Continue improving the glass / refraction effect.
5. Preserve the working Loader and existing stable behavior.


## Work Rules

Before making major changes:

- Work only inside `/Volumes/BOSS/My Web`.
- Do not create another copy of the project.
- Check the existing implementation before replacing it.
- Preserve working features unless explicitly asked to change them.
- Test the site after meaningful changes.
- Run the production build after major code changes.


## Latest Infrastructure Change

- Project moved from the Mac internal drive to BOSS.
- `打开网站.command` no longer contains a fixed Desktop path.
- The project can now be started directly from the external SSD.


## Next Task

Continue improving the homepage Hero design without breaking the Loader or existing project structure.


## Update Rule

After an important Work session, update this document with:

- What changed
- Which files changed
- What is currently working
- Remaining problems
- Recommended next step

## 2026-09-25 — Confirmed scroll and navigation revision

Only the primary directory `/Volumes/BOSS/My Web` was edited; no project copy created.

Changed files:
- NavigationWheel.jsx: Home / Work / Motion / Visual / Presentation / Digital / About; each destination uses its real section anchor, preserving the click sound implementation.
- OptionWheel.jsx: reduced wheel gain, limits each continuous wheel gesture to one adjacent item, quicker visual following; drag and keyboard behavior retained.
- hero.js: staggered upward text departure with .85s scrub lag, slower background movement for parallax; removed scroll-driven lens enlargement and the full-screen Chinese stage.
- HeroFluidGlass.jsx: follows the moving home container; optical distortion settles as the homepage departs, keeping Chinese glyphs stable; resting mouse lens retained.
- index.html / hero.css: fixed F logo, narrow yellow autonomous marquee using DINish + Source Han Serif, followed by work/category/about placeholders. Banner sticks briefly while the next opaque page covers it from below. Horizontal marquee motion is independent of the scroll wheel.

Verification:
- Production build passed (existing bundle-size advisory remains).
- Preview from this directory: http://127.0.0.1:5180/ (current review server; launcher may choose a different available port).
- Browser checked intro entry, upward departure, narrow mixed-font banner, next-page occlusion and menu order.
- Small wheel gesture moved Home -> Work, not multiple options. Browser reported no errors.

Remaining content:
- Motion: cover, video, project description.
- Visual: cover, series images, project description.
- Presentation: cover, key slides, project description.
- Digital: cover, screens, project description.
- About: biography, focus, contact details.
- Review real mouse/trackpad feel on the user's device; adjust only on explicit feedback.

Keep all unrequested design/features unchanged. Do not resume desktop copies or create archives/copies without a new request.

### Follow-up: banner overlap and bottom content
- Banner height reduced by 20% to clamp(160px, 25.6vh, 304px).
- Banner holds at 28vh so the following page covers it before it reaches the viewport top.
- Removed bottom About placeholder as requested; navigation labels unchanged. About currently has no destination section.

### Banner continuity, idea page and navigation speed
- Replaced isolated sticky banner with a joined hero/banner wrapper. Next page covers it at the existing 28vh position without exposing a gap.
- Opening wheel travel eases over 180ms; horizontal marquee remains autonomous. Reduced-motion and open-menu input bypass this easing.
- Banner: THINK ✱ SHAPE ✱ REFINE ✱ DELIVER ✱, alternating DINish and Source Han Serif. Previous reduced banner height retained.
- New page before Selected Work: Every idea has / A better way / To be seen. / We help find it. Masked staggered line entrance; yellow rotating starburst with stationary F. Hover accelerates the shape smoothly.
- Navigation wheel now accumulates input without a one-item cap; light input has lower gain than fast input.
- Browser visually confirmed contiguous hero/banner and new page. Production build passed. Current formal-project preview: http://127.0.0.1:5180/.

### Latest: continuous parallax and larger statement
- Removed the sticky opening stop. Joined hero/banner now travels continuously at 82% of page travel while the following page catches up; the seam remains joined.
- Latest reference supersedes the earlier mixed-case statement: four uppercase DINish lines at 12vw, including the final line at full size. Banner typography unchanged.
- Each statement line triggers its own 1.35s masked upward entrance when entering the viewport, preventing offscreen completion. Browser checked entering and completed states; build passed.
- Saving the approved accumulated changes to the existing GitHub origin/main.

### Draggable badge
- Badge supports primary-pointer drag with pointer capture and stays at its released position for the current page session.
- Teeth rotation and hover acceleration remain independent of the stationary logo.
- Statement section allows the badge to cross its edges without clipping.
