# MisJuegos — UI Animations (v1 → v2)

**Requirement:** Port these animations to Vue. Do not replace with generic Material/modal patterns. The playful motion is part of the brand.

v1 reference repo: `../misjuegos-master/src/components/`

Phase 0 v2 uses a **simplified nav** — full animation port is **Phase 3** ✅ (items 1–3 below).

---

## 1. Hamburger → X morph

**v1:** `layout/Hamburger.svelte`

- 3 bars, 3px height, 4px gap, `bg-dark` on primary button
- Container rotates 180° when open
- Bar 1: `translate(0, 7px) rotate(45deg)`
- Bar 2: `opacity: 0`
- Bar 3: `translate(0, -7px) rotate(-45deg)`
- Transition: `0.2s ease-in-out`

**v2 target:** `components/layout/HamburgerButton.vue`

---

## 2. Circular clip-path menu reveal

**v1:** `layout/Menu.svelte` + `layout/TopBar.svelte`

- Full-screen overlay `bg-primary`
- Origin: center of hamburger button (`--left`, `--top` from `getBoundingClientRect`)
- `clip-path: circle(var(--clipSize) at var(--left) var(--top))`
- Enter: 1000ms, `quartOut` easing, radius grows to `hypot(innerWidth, innerHeight)`
- Exit: 500ms, `quartIn` easing
- Menu links: 2xl bold dark text, 4px border, current route gets rounded border
- Footer: dashed border-top, user avatar + logout power button

**v2 target:** `components/layout/NavDrawer.vue` — use `@vueuse/core` or a small composable for origin tracking; CSS custom properties for clip-path.

**Vue port notes:**
- Use `<Transition>` with JS hooks or `@vueuse/motion` for easing
- Recompute origin on resize and when opening
- Close menu on route change (v1 `$location` effect)

---

## 3. TopBar backdrop

**v1:** `layout/TopBar.svelte`

- Fixed top, `bg-dark/80 backdrop-blur-sm` full-width behind content
- Logo left (primary), hamburger right in `rounded-full bg-primary` circle

**v2 target:** integrate into `AppShell.vue` (partially done — needs blur layer + hamburger component)

---

## 4. Home “Nueva partida” FAB slide

**v1:** `views/Home/Home.svelte` + `views/Home/NewBoardGame.svelte`

- Fixed bottom center: large circle (128px), dashed `border-dark`, `bg-primary`
- Plus icon + “Nueva partida” label
- **`displace` state:** entire `<main>` gets `-translate-y-full` (1000ms transition)
- FAB rotates 180°; plus icon rotates 45° and `-translate-y-2`
- New session panel sits at `top-full` (below viewport) — slides into view when main displaces up
- This is the signature “create session” interaction — **must feel the same in v2**

**v2 target:** `views/SessionsView.vue` + `components/sessions/NewSessionPanel.vue`

**Vue port:** bind `displace` ref; Tailwind `transition-transform duration-1000`; panel as sibling fixed layer.

---

## 5. List item slide transitions

**v1:** `NewBoardGame.svelte`, `Friends.svelte`

- Svelte `slide|local` on list items when filtering/adding
- Game cards: non-selected fade to `opacity-30 scale-95` when one game selected

**v2 target:** `<TransitionGroup name="slide">` or `@vueuse/motion` per item

---

## 6. Roulette spring spin

**v1:** `views/Roulette/Roulette.svelte`

- `@motion/spring` for arrow angle (stiffness 0.002, damping 0.08)
- Adds `360 * 3 + random * 360` on spin
- `boardZ` spring for subtle 3D board tilt
- Long-press (`longtap` action) or Space to spin
- Segments with alternating primary/dark fills; active segment highlight after spin settles

**v2 target:** `views/RouletteView.vue` — `useSpring` + `vLongTap` ✅ (Phase 14)

---

## 7. Sand timer SVG

**v1:** `views/Timer/Timer.svelte`

- Hourglass SVG with mask-based sand
- `delta` 0→1 drives sand rects via `transform translate`
- Start: 600ms 180° flip (`rot` keyframes, cubic-bezier)
- Active: dashed line `stroke-dashoffset` animation
- 60s default duration; countdown display

**v2 target:** `views/TimerView.vue` ✅ (Phase 14)

---

## 8. 3D dice roller

**v1:** `lib/utils/dice/DiceLauncher.ts` + `views/Dices/*`

- Three.js + Cannon.js physics
- Primary `#facc15` floor, top-down camera
- Multiple dice types (D4–D20)

**v2 target:** `views/DicesView.vue` + `lib/dice/*` — lazy chunk ✅ (Phase 14)

---

## 9. Micro-interactions (preserve where applicable)

- Buttons: `hover:scale-105`, `transition-colors`
- Confirm dialogs: existing pattern in v1 `common/ConfirmDialog.svelte`
- Loading: spinning loader icon in primary color
- Cards: dashed borders, ring accents on FAB

---

## Animation implementation checklist (Phase 3+)

When porting each animation:

- [x] Hamburger morph (Phase 3)
- [x] Circular clip-path menu (Phase 3)
- [x] TopBar backdrop blur (Phase 3)
- [x] Roulette spring spin (Phase 14)
- [x] Sand timer SVG (Phase 14)
- [x] 3D dice roller lazy chunk (Phase 14)
- [ ] Home FAB slide (Phase 5)
- [ ] Works on mobile (touch targets, no tap highlight — already in `main.css`)
- [ ] Respects `prefers-reduced-motion` where reasonable (optional enhancement)
- [ ] No layout shift / jank on open-close
- [ ] Document any intentional deviations in PR/commit
