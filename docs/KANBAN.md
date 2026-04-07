# Fish Fight — Kanban Board

> Last updated: 2026-04-07

---

## Backlog

### Phase 1: MVP — Core Combat
- [ ] **[1.1] Project Setup & Infrastructure** `CRITICAL` `2-3d`
  - Phaser 3 + Vite + TypeScript scaffolding
  - Folder structure (scenes/, entities/, systems/, ui/, assets/)
  - Game loop running at 60 FPS, asset loader, dev server
  - _Acceptance: Browser shows empty scene, 60 FPS, no console errors_

- [ ] **[1.2] Character Movement System** `CRITICAL` `2-3d`
  - Left/right movement, jump with gravity
  - Floor collision, no double-jump
  - "Flopping fish on land" animation feel
  - _Acceptance: Fish responds to all movement keys, parabolic jump, can't fall through floor_

- [ ] **[1.3] Combat System (4 Attacks + HP + Knockback)** `CRITICAL` `5-7d`
  - Light attack (<0.3s), Heavy attack (>0.6s), Special, Block
  - HP bar with damage tracking
  - Knockback formula: `baseKB × (1 + (maxHP - currentHP) / maxHP)`
  - KO on arena exit
  - _Acceptance: Knockback visibly increases at <30% HP. KO triggers correctly_

- [ ] **[1.4] AI Opponents (Basic)** `CRITICAL` `4-5d`
  - Behavior tree with configurable parameters
  - 10 difficulty levels (reaction_time, aggression, block_chance, attack_frequency)
  - _Acceptance: Level 1 beatable by newbie in 30s. Level 10 challenges experienced players_

- [ ] **[1.5] Sea Arena (First Map)** `MEDIUM` `2-3d`
  - Ocean/beach pixel art background
  - Platform with clear boundaries
  - KO zones (left/right/top)
  - _Acceptance: Background doesn't obscure fighters. KO zones work. Looks like a beach_

- [ ] **[1.6] Two Playable Characters (Tuna & Carp)** `CRITICAL` `5-7d`
  - Full spritesheets: idle(4f), walk(6f), jump(3f), light(4f), heavy(6f), special(6f), block(2f), hurt(3f), ko(4f)
  - Visually distinct from each other
  - _Acceptance: Smooth animations, no frame glitches, hitboxes match visual size_

- [ ] **[1.7] Two Starting Weapons** `MEDIUM` `3-4d`
  - Toy Fish: melee, 10 dmg, 50px range, 0.3s speed
  - Pufferfish Cannon: ranged, 8 dmg, full-screen, 400px/s projectile, 1s cooldown
  - _Acceptance: Both deal damage correctly. Carrot projectile flies, hits, disappears. No visual glitches_

- [ ] **[1.8] Basic UI & Arcade Ladder** `CRITICAL` `4-5d`
  - Main menu, character select, fight HUD (HP bars, timer), victory/defeat screen
  - 10-fight ladder with scaling difficulty (AI level 1→10)
  - Coin system: fight 1 = 10 coins, +1 each fight (~145 total per run)
  - Basic weapon shop
  - _Acceptance: Full loop: Menu → Select → Fight 1…10 → Victory. Coins persist. Shop works_

### Phase 2: Full Campaign
- [ ] **[2.1] Three New Arenas (Market, Ship, Restaurant)** `HIGH` `5-7d`
  - Fish Market: counters, ice, aquariums
  - Ship: deck, cargo hold
  - Restaurant: chef's kitchen
  - Ladder mapping: fights 1-3 Sea, 4-5 Market, 6-7 Ship, 8-10 Restaurant
  - _Acceptance: Each visually unique. KO zones work. No load delays_

- [ ] **[2.2] Three New Characters (Squid, Pufferfish, Sakabambaspis)** `HIGH` `7-10d`
  - Squid: ink attack special, uncommon rarity, 250 coins to unlock
  - Pufferfish: inflate special, rare rarity, auto-unlock at ladder clear 5
  - Sakabambaspis: legendary, auto-unlock at ladder clear 10
  - Full animation sets for each
  - _Acceptance: All 5 chars playable. Unlock conditions work. Weapon tier access correct_

- [ ] **[2.3] Pet System** `MEDIUM` `4-5d`
  - Clownfish (no effect, vibes only) — found on Sea map
  - Walking Fish (2× movement speed) — Fish Market
  - Flying Fish (temporary flight, max 1 min) — Ship
  - Sniper Fish (auto-shoots enemies) — beat hardest boss
  - _Acceptance: Pets display next to fighter. Effects work. Found at correct maps_

- [ ] **[2.4] Human Enemies (Fisherman, Diver, Sushi Master)** `HIGH` `5-7d`
  - Each has 2+ unique attacks (rod, harpoon, knife)
  - Larger sprites, different movement style than fish
  - Integrated into ladder fights 7-9
  - _Acceptance: Unique attacks with correct hitboxes. Feel different from fish opponents_

- [ ] **[2.5] Mini-Boss: Mega-Fish** `HIGH` `3-4d`
  - Shark or Kraken, fight 6 in ladder
  - HP ×3, 3-4 unique attacks, 2 phases (normal + enrage at <30% HP)
  - _Acceptance: Not beatable on first try by average player. Phase transition smooth. No corner exploits_

- [ ] **[2.6] Final Boss: The Chef** `CRITICAL` `5-7d`
  - HP ×5, 5-6 unique attacks (knife slash, pan throw, boiling oil)
  - 3 phases of escalating intensity
  - Victory scene: all fish liberated (no dialogue, visual storytelling)
  - _Acceptance: 2-4 min fight. Each phase feels unique. Liberation scene is emotional. No crashes_

- [ ] **[2.7] Pufferfish Story Arc + Sakabambaspis** `HIGH` `3-4d`
  - Ladder clear counter (persisted)
  - Clear 5: Pufferfish joins, companion AI helps in fights
  - Clear 10: Pufferfish departs, Sakabambaspis appears and unlocks permanently
  - _Acceptance: Triggers fire at exact clear counts. Companion AI attacks enemies. Reliable across sessions_

### Phase 3: Content & Economy
- [ ] **[3.1] Full Shop (Weapons + Skins)** `HIGH` `4-5d`
  - All weapons (10–500 coins, tiered by character rarity)
  - 6 skins: Cap(30), Frying Pan Hat(30), Carp T-shirt(30), Carrot Mouth(200), Fish Sword(200), Parasite(690)
  - Two tabs, skin preview on fish before purchase
  - _Acceptance: All items purchasable. Coins deducted. Skin shows in fight. Rarity-locked items blocked_

- [ ] **[3.2] Legendary Skin: Parasite → Dragon Fish** `MEDIUM` `3-4d`
  - Facehugger parasite on fish face at fight start
  - Mid-fight transformation (at HP <50% or timer): parasite falls off, becomes tiny black dragon fish
  - 5-8 frame detachment animation
  - _Acceptance: Transforms once per fight. Smooth animation. Dragon fish persists until fight end_

- [ ] **[3.3] Four Random Events** `HIGH` `5-7d`
  - Super Weapon Spawn (grab for advantage)
  - Lightning Strike (random spot, damage + launch)
  - Poison Rain (both lose HP, find cover or finish fast)
  - Seagull Grab (picks up one fish, carries and drops)
  - 30% chance/match, max 2 per match, 1-2s warning
  - _Acceptance: No crashes. Warning gives reaction time. Seagull doesn't get stuck. Rain stops in 5-10s_

- [ ] **[3.4] Personality Slider (Kind ↔ Bold)** `LOW` `2-3d`
  - Slider on character select screen
  - ~18 quotes (3 situations × 3 levels × 2 variants)
  - Text bubble before/after fights
  - _Acceptance: Slider persists between fights. Quotes match slider position. Extreme values most distinct_

- [ ] **[3.5] New Game+ Difficulty Scaling** `LOW` `2-3d`
  - After all 4 maps: `HP ×1.15^cycle`, `DMG ×1.1^cycle`, `reaction ×0.9^cycle`
  - Visual cycle number indicator
  - Infinite escalation
  - _Acceptance: Cycle 2 noticeably harder. Cycle 5 is serious challenge. No "unkillable" enemies too early_

### Phase 4: Polish & Launch
- [ ] **[4.1] Sound Effects & Music** `HIGH` `5-7d`
  - 25-30 SFX (slaps, jumps, hits, KO, shop, random events, victory)
  - 5 music tracks (one per arena + boss theme)
  - Volume controls (SFX + music separate)
  - _Acceptance: Every action has sound. Music loops without clicks. Volume settings persist_

- [ ] **[4.2] Visual Effects & Animations** `MEDIUM` `3-4d`
  - Particles: dust on landing, sparks on hit, water splash, lightning flash, green rain
  - Screen shake on heavy hits (3-5px, 0.2s)
  - Slow-mo on KO (0.5-1s)
  - _Acceptance: 60 FPS maintained. Slowmo on KO is 0.5-1s. Effects don't obscure gameplay_

- [ ] **[4.3] Balancing & Playtesting** `CRITICAL` `5-7d`
  - All damage/HP/speed values tuned
  - Economy balance: first purchase <5 min, full ladder ~10-15 min
  - AI difficulty curve smooth
  - 0 critical bugs
  - _Acceptance: All chars viable. Economy not grindy. Smooth difficulty curve. No critical bugs_

- [ ] **[4.4] Optimization & Release** `CRITICAL` `3-5d`
  - Lazy loading, spritesheet atlas (TexturePacker)
  - Code minification, asset compression
  - Deploy to hosting (Netlify/Vercel/itch.io)
  - Cross-browser testing (Chrome, Firefox, Safari, Edge)
  - _Acceptance: <3s load on 4G. 60 FPS on mid laptop. No crashes on target browsers. Public URL live_

### Phase 5: Multiplayer
- [ ] **[5.1] Server Architecture (Socket.io)** `CRITICAL` `7-10d`
  - Node.js + Socket.io server
  - Room creation/joining, position sync
  - Authoritative server (server decides hits)
  - Tick rate 30-60 Hz
  - _Acceptance: <100ms latency. No visible teleporting. Server handles disconnect without crash_

- [ ] **[5.2] Online PvP Battle** `CRITICAL` `7-10d`
  - Full combat sync (attacks, damage, knockback, KO, random events)
  - Room-by-link system (send to friend)
  - Arena selection, results screen
  - _Acceptance: Feels responsive as single-player (minus ping). All attacks register. Events synced. No desync_

- [ ] **[5.3] Matchmaking (Quick Play)** `MEDIUM` `5-7d`
  - "Find Match" button in main menu
  - Win-based rating, ±5 wins match range, expand after 15s
  - Queue with animated waiting screen, 60s timeout, cancel option
  - _Acceptance: No crash on 0 players in queue. 60s timeout. Cancel works. Rating displayed in profile_

---

## In Progress

_No tasks currently in progress._

---

## Done

- [x] **[1.1] Project Setup & Infrastructure** `CRITICAL`
- [x] **[1.2] Character Movement System** `CRITICAL`
- [x] **[1.3] Combat System (4 Attacks + HP + Knockback)** `CRITICAL`
- [x] **[1.4] AI Opponents (Basic)** `CRITICAL`
- [x] **[1.5] Sea Arena (First Map)** `MEDIUM`
- [x] **[1.6] Two Playable Characters (Tuna & Carp)** `CRITICAL`
- [x] **[1.7] Two Starting Weapons** `MEDIUM`
- [x] **[1.8] Basic UI & Arcade Ladder** `CRITICAL`
- [x] **[2.1] Three New Arenas (Market, Ship, Restaurant)** `HIGH`
- [x] **[2.2] Three New Characters (Squid, Pufferfish, Sakabambaspis)** `HIGH`
- [x] **[2.4] Human Enemies (Fisherman, Diver, Sushi Master)** `HIGH`
- [x] **[2.5] Mini-Boss: Mega-Fish** `HIGH`
- [x] **[2.6] Final Boss: The Chef** `CRITICAL`
- [x] **[2.3] Pet System** `MEDIUM` — 4 pets with unique effects and unlock conditions
- [x] **[2.7] Pufferfish Story Arc + Sakabambaspis** `HIGH` — companion at clear 5, legendary at clear 10
- [x] **[3.1] Full Shop (Weapons + Skins)** `HIGH` — two-tab shop, 6 skins, buy/equip
- [x] **[3.3] Four Random Events** `HIGH` — lightning, poison rain, seagull, super weapon
- [x] **[3.4] Personality Slider** `LOW` — kind/neutral/bold with 27 quotes
- [x] **[3.5] New Game+ Difficulty Scaling** `LOW` — infinite exponential scaling
- [x] **[4.3] Difficulty Rebalance** `CRITICAL` — player HP 120, softer AI, reduced boss damage

---

## Notes

- **Solo dev** — one task at a time, strictly sequential within each phase
- Tasks move left-to-right: **Backlog → In Progress → Done**
- Each task has acceptance criteria inline
- Priority labels: `CRITICAL` > `HIGH` > `MEDIUM` > `LOW`
- Estimates are in working days (d)
- Phase dependencies: 1 → 2 → 3 → 4 → 5 (sequential)
- **Recommended task order within Phase 1:** 1.1 → 1.2 → 1.3 → 1.6 → 1.7 → 1.4 → 1.5 → 1.8
  - Build engine first, then combat, then characters/weapons (need combat to test), then AI (needs fighters), then arena + UI (wraps everything together)
