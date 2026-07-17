# Product Requirements Document — Home Front

**Version:** 0.2 · **Owner:** Dave · **Status:** v1 prototype shipped, this PRD covers path to v2 public release
**Platform:** Browser (mobile-first responsive web), static hosting (Vercel/Netlify), no backend

---

## 1. Overview

Home Front is a WW2 industrial idle/clicker game inspired by Hearts of Iron 4. Players build a nation's war economy from a single foundry tap to a full military-industrial complex, then commit forces to historical theatres. The differentiator against generic idle games is a **two-stage production chain** — raw resources are converted by production lines into equipment over time, and scarcity forces real decisions — plus **nation asymmetry** as the replayability engine.

**Elevator pitch:** Cookie Clicker meets Hearts of Iron 4 — the strategic economy of a grand strategy game at the session length of an idle game.

## 2. Goals & non-goals

**Goals**
- G1: A satisfying 30–60 min first "run" ending in a meaningful prestige decision
- G2: Idle-friendly: progress offline, sessions of 2–15 min feel rewarding
- G3: Replayability through asymmetric nations rather than pure number inflation
- G4: Playable one-handed on a phone; no accounts, no backend, no monetisation
- G5: Period-strategy tone: Ministry-of-Information poster aesthetic, dry flavour text

**Non-goals**
- Historical simulation accuracy or wargame combat resolution (theatres are timed missions, not battles)
- Multiplayer, leaderboards, cloud saves (v3+ candidates at most)
- Depicting atrocities or extremist symbolism — generic national insignia and roundels only

## 3. Player profile

Strategy-game players (HOI4, Factorio, Anno) who enjoy idle games as a second-screen or commute activity. Comfortable with resource ratios and production chains; bored by idle games with one currency. Session pattern: several short check-ins daily plus occasional long optimisation sessions.

## 4. Core loop

Tap foundry → build resource generators → build production lines (consume resources → equipment) → recruit forces (equipment + manpower) → launch theatre operations (timed, forces locked) → victories grant stacking economy bonuses + War Score → spend War Score on laws/upgrades → scale until Total Victory → prestige into Doctrine points → restart as a new nation, faster.

**Tension sources:** input scarcity (stalled lines), civilian-vs-military industry split, oil upkeep vs fleet size, push-on-vs-prestige timing.

## 5. Feature requirements

### 5.1 Shipped in v1 (UK prototype)
| ID | Feature | Notes |
|----|---------|-------|
| F1 | 5-resource economy (steel, aluminium, oil, rubber, manpower) | Net-flow display with deficit warnings |
| F2 | 5 generators incl. Civilian Factory global multiplier | Cost growth ×1.15 |
| F3 | 5 production lines with proportional stall behaviour | STALLED % surfaced in UI |
| F4 | 4 force types with recruit costs; oil upkeep on air/fleet | |
| F5 | 3 theatres with scaling stages, real-time timers, stacking rewards | Complete while offline |
| F6 | War Score economy: conscription laws ×2/×4/×8, Radar | |
| F7 | Persistence: window.storage/localStorage adapter, autosave, 50% offline production (8h cap) | |
| F8 | Animated SVG scene reflecting game state | Factories, Spitfires, fleet, balloons |

### 5.2 v1.1 — Nation selection (next)
- **F9:** Nation picker at campaign start: UK, Germany, USA, USSR, Japan
- **F10:** Nations as data objects modifying: starting resources, generator output multipliers, unique building (e.g. Germany: Synthetic Refinery converts steel→oil/rubber; USA: Lend-Lease exports for bonus War Score; USSR: manpower ×3, factory output ×0.7), theatre list and requirements
- **F11:** Nation-appropriate theatre sets (Japan: Pacific/Coral Sea/Burma; Germany: France/Eastern Front/Atlantic raiding)
- Acceptance: each nation reaches first prestige via a visibly different build order; no nation >25% faster than the median to Total Victory

### 5.3 v2 — Prestige & doctrine
- **F12:** Total Victory condition (all theatres at stage 3+) triggers prestige availability
- **F13:** Doctrine points awarded on prestige, scaling with War Score (√ scaling, tunable base constant)
- **F14:** Doctrine tree, three branches (Land/Sea/Air), permanent across runs, spent between runs. Examples: "Grand Battleplan: infantry cost −20%", "Convoy Escorts: fleet upkeep −50%", "Strategic Bombing: enemy stage requirements −1". Cross-run identity, not flat multipliers
- **F15:** Oil deficit penalty: 0 oil slows active air/naval theatre timers by 50% (fuel mechanic)
- **F16:** Component refactor: split App.jsx, `useGameEngine` hook, pure `simulate()` with unit tests

### 5.4 v2.1+ candidates (unprioritised)
Equipment tiers (rifles→semi-auto→assault), construction queue with civilian-factory speed, events system (Blitz, D-Day timers), sound design, PWA install, save export/import string, accessibility pass (reduced motion, colour-blind-safe deficit indicators).

## 6. Non-functional requirements
- **Performance:** 250ms tick must stay <5ms work on mid-range mobile; SVG scene ≤60 animated elements
- **Persistence integrity:** autosave never clobbers an unloaded save; mission timestamps are absolute (UTC ms) and offline-safe; save schema versioned with migration on load
- **Responsiveness:** single-column ≤560px layout, all tap targets ≥44px
- **Zero backend:** fully static build; saves are local-only and this is stated in-game

## 7. Success metrics (self-assessed, no analytics in v1)
- First prestige reachable in 30–60 min; second run ~2× faster to same point
- At least one "stall crisis" decision naturally occurs per run (a line starved forcing a build choice)
- Playtesters can name a favourite nation and articulate why (asymmetry is legible)

## 8. Milestones
| Milestone | Scope | Estimate |
|-----------|-------|----------|
| M1 | Repo setup, deploy pipeline, component split (F16) | 1 session |
| M2 | Nation data model + UK/Germany (F9–F10) | 2 sessions |
| M3 | Remaining nations + theatre sets (F11) | 2 sessions |
| M4 | Prestige + doctrine tree (F12–F14) | 2–3 sessions |
| M5 | Oil/fuel mechanic, balance pass, public URL share | 1–2 sessions |

## 9. Risks & mitigations
- **Balance combinatorics** (5 nations × doctrine tree): keep all tuning in data tables; add a headless simulation script that plays greedy strategies and reports time-to-prestige per nation
- **Scope creep toward wargame:** theatres stay timed missions; combat depth lives in *requirements and rewards*, not resolution mechanics
- **Sensitive theme:** maintain the industrial/home-front framing; no atrocity content, generic insignia, historical tone kept factual/wry (Ministry of Information, not battlefield)

## 10. Open questions
1. Should prestige reset be per-nation (separate doctrine pools) or shared? (Leaning shared — encourages nation-hopping)
2. Manual tap relevance mid-game: add a tap-multiplier upgrade path or let tapping retire gracefully?
3. Do theatre defeats exist (operations that can fail without enough excess force), or is gating by requirements enough?
