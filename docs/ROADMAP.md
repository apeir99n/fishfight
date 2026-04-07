# Fish Fight — Technical Roadmap

> CTO/Architect perspective · Last updated: 2026-04-07

---

## 1. Executive Summary

Fish Fight is a **2D browser-based fighting game** (Mortal Kombat / Rivals of Aether style) built with **Phaser.js**. Players control fish flopping on dry land, battling through a 10-fight arcade ladder from the open sea to a chef's kitchen.

**Core bet:** Comedy fighting + viral moments + zero monetization barrier = organic growth.

**Total scope:** 5 phases, ~17–25 weeks, from MVP to online multiplayer.

---

## 2. Technology Stack & Rationale

| Layer | Choice | Why |
|-------|--------|-----|
| **Game Engine** | Phaser 3.x | Mature 2D framework, huge community, built-in physics (Arcade), sprite/animation/particle systems, Web Audio. Zero install for players. |
| **Language** | TypeScript | Type safety over vanilla JS — catches bugs at compile time, better IDE support, scales with codebase growth. |
| **Bundler** | Vite | Fast HMR, native ESM, simple config. Phaser + Vite templates exist. |
| **Art Style** | Pixel Art (128×128 base) | Matches existing sprites, small file sizes (<10MB total), easy to animate, strong visual identity. |
| **State Management** | Custom ECS-lite | Phaser scenes + lightweight entity/component pattern. No heavy ECS lib needed at this scale. |
| **AI** | Behavior Tree (simple) | Configurable per-difficulty-level. Better than FSM for scaling complexity. Parameters: reaction_time, aggression, block_chance, attack_frequency. |
| **Persistence** | localStorage | Coins, unlocks, settings. No backend needed for single-player. |
| **Multiplayer (Phase 5)** | Socket.io + Node.js | Authoritative server model. Room-based. Tick rate 30–60 Hz. |
| **Hosting** | Netlify / Vercel / itch.io | Static deploy for client. Railway/Fly.io for multiplayer server. |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy on push to main. |
| **Testing** | Vitest + Playwright | Unit tests for game logic (damage calc, economy, AI). E2E for critical flows. |

---

## 3. Architecture Overview

```
src/
├── main.ts                  # Phaser game config, boot
├── config/
│   ├── game.config.ts       # Balance constants (HP, damage, knockback formula)
│   ├── characters.config.ts # Per-character stats, animation defs
│   └── economy.config.ts    # Coin rewards, shop prices, unlock requirements
├── scenes/
│   ├── BootScene.ts         # Asset preloading
│   ├── MenuScene.ts         # Main menu
│   ├── CharSelectScene.ts   # Character + personality selection
│   ├── FightScene.ts        # Core gameplay arena
│   ├── ShopScene.ts         # Weapon & skin shop
│   ├── VictoryScene.ts      # Win/lose screen
│   └── LadderScene.ts       # Arcade ladder progression
├── entities/
│   ├── Fighter.ts           # Base fighter class (player & AI)
│   ├── Player.ts            # Input-driven fighter
│   ├── AIFighter.ts         # AI-controlled fighter
│   ├── Projectile.ts        # Carrot bullets, etc.
│   └── Pet.ts               # Companion entity
├── systems/
│   ├── CombatSystem.ts      # Hitbox detection, damage, knockback calc
│   ├── KnockbackSystem.ts   # HP-scaled knockback + KO detection
│   ├── AISystem.ts          # Behavior tree / decision engine
│   ├── RandomEventSystem.ts # Lightning, poison rain, seagull, super weapon
│   ├── EconomySystem.ts     # Coin rewards, purchases, unlock checks
│   └── ProgressionSystem.ts # Ladder state, difficulty scaling, story triggers
├── ui/
│   ├── HUD.ts               # HP bars, timer, coin counter
│   ├── ShopUI.ts            # Shop interface components
│   └── DialogBubble.ts      # Pre/post fight personality quotes
├── weapons/
│   ├── Weapon.ts            # Base weapon class
│   ├── ToyFish.ts           # Melee slap
│   └── PufferfishCannon.ts  # Ranged carrot shooter
├── data/
│   ├── characters.json      # Character definitions
│   ├── weapons.json         # Weapon stats
│   ├── shop.json            # Shop catalog
│   └── quotes.json          # Personality-based dialogue
└── utils/
    ├── math.ts              # Knockback formula, scaling functions
    └── storage.ts           # localStorage wrapper
```

---

## 4. Key Technical Decisions

### 4.1 Combat Model: HP + Knockback Hybrid
```
knockback = baseKnockback × (1 + (maxHP - currentHP) / maxHP)
```
As HP decreases, knockback multiplier approaches 2×. KO triggers when a fighter exits arena bounds. This creates a Smash Bros-like tension where low HP doesn't mean instant death — positioning matters.

### 4.2 AI Difficulty Scaling
10 difficulty levels via parameter tuning, not code branching:

| Parameter | Level 1 | Level 5 | Level 10 |
|-----------|---------|---------|----------|
| reaction_time | 800ms | 400ms | 100ms |
| aggression | 0.2 | 0.5 | 0.9 |
| block_chance | 0.05 | 0.2 | 0.5 |
| attack_frequency | 0.3 | 0.6 | 0.9 |

### 4.3 New Game+ Scaling Formula
```
enemy_hp      *= 1.15 ^ cycle
enemy_damage  *= 1.10 ^ cycle
ai_reaction   *= 0.90 ^ cycle
```

### 4.4 Random Events
30% chance per match, max 2 per match. 1–2 second visual warning before activation. Events affect both fighters equally (no unfair advantage).

### 4.5 Save System
localStorage JSON blob. Structure:
```json
{
  "coins": 245,
  "unlockedCharacters": ["tuna", "carp"],
  "unlockedWeapons": ["toy_fish", "pufferfish_cannon"],
  "equippedWeapon": "toy_fish",
  "equippedSkin": null,
  "equippedPet": null,
  "ladderClears": 3,
  "personality": 0.5,
  "settings": { "sfxVolume": 0.8, "musicVolume": 0.6 }
}
```

---

## 5. Phase Breakdown & Milestones

### Phase 1: MVP — Core Combat (4–6 weeks)
**Goal:** Playable prototype. 2 fish, 1 arena, full fight loop.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 1.1 | Project setup (Phaser + Vite + TS, folder structure, 60 FPS loop) | CRITICAL | 2–3d |
| 1.2 | Character movement (left/right/jump, gravity, floor collision, flop animation) | CRITICAL | 2–3d |
| 1.3 | Combat system (4 attacks, HP, knockback scaling, KO on arena exit) | CRITICAL | 5–7d |
| 1.4 | AI opponents (behavior tree, 10 difficulty levels, parameter-driven) | CRITICAL | 4–5d |
| 1.5 | Sea arena (background, platform, KO zones) | MEDIUM | 2–3d |
| 1.6 | Two characters — Tuna & Carp (spritesheets, all animations) | CRITICAL | 5–7d |
| 1.7 | Two weapons — Toy Fish (melee) & Pufferfish Cannon (ranged) | MEDIUM | 3–4d |
| 1.8 | UI + Arcade ladder (menu, char select, HUD, 10-fight ladder, coin economy, basic shop) | CRITICAL | 4–5d |

**Milestone:** A player can pick Tuna or Carp, fight through 10 AI opponents on the Sea arena, earn coins, and buy a weapon.

---

### Phase 2: Full Campaign (4–6 weeks)
**Goal:** Complete story from Sea to Restaurant. All 5 characters, 4 arenas, pets, bosses.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 2.1 | Three new arenas (Fish Market, Ship, Restaurant) | HIGH | 5–7d |
| 2.2 | Three new characters (Squid, Pufferfish, Sakabambaspis) with unlock conditions | HIGH | 7–10d |
| 2.3 | Pet system (4 pets with passive/active abilities) | MEDIUM | 4–5d |
| 2.4 | Human enemies (Fisherman, Diver, Sushi Master — unique attacks) | HIGH | 5–7d |
| 2.5 | Mini-boss: Mega-fish (2 phases, 3× HP, unique patterns) | HIGH | 3–4d |
| 2.6 | Final boss: The Chef (3 phases, 5× HP, knife/pan/oil attacks, liberation scene) | CRITICAL | 5–7d |
| 2.7 | Story arc: Pufferfish companion (join at clear 5, leave at 10) + Sakabambaspis unlock | HIGH | 3–4d |

**Milestone:** Full narrative playthrough. Emotional arc with Pufferfish. Sakabambaspis unlockable.

---

### Phase 3: Content & Economy (3–4 weeks)
**Goal:** Fill out the content. All skins, weapons, random events, balanced economy.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 3.1 | Full shop (all weapons by tier, 6 skins with preview) | HIGH | 4–5d |
| 3.2 | Legendary skin: Parasite → Dragon Fish (mid-fight transformation) | MEDIUM | 3–4d |
| 3.3 | Four random events (Super Weapon, Lightning, Poison Rain, Seagull) | HIGH | 5–7d |
| 3.4 | Personality slider (Kind ↔ Bold, affects pre/post fight quotes) | LOW | 2–3d |
| 3.5 | New Game+ difficulty scaling (infinite loop, visual cycle indicator) | LOW | 2–3d |

**Milestone:** Full content. Economy feels rewarding, not grindy. Random events create viral moments.

---

### Phase 4: Polish & Launch (2–3 weeks)
**Goal:** Release-quality. Sound, VFX, balance, optimization, deploy.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 4.1 | SFX + Music (25–30 effects, 5 music tracks, volume controls) | HIGH | 5–7d |
| 4.2 | VFX (particles, screen shake, slow-mo on KO) | MEDIUM | 3–4d |
| 4.3 | Balancing & playtesting (damage, HP, economy, AI curve, bug fixes) | CRITICAL | 5–7d |
| 4.4 | Optimization & deploy (lazy load, atlas packing, minify, <3s load, cross-browser) | CRITICAL | 3–5d |

**Milestone:** Public launch. Playable link shared. <3s load, 60 FPS, <10MB.

---

### Phase 5: Multiplayer (4–6 weeks)
**Goal:** Online PvP. Share link to fight friends. Matchmaking.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 5.1 | Server architecture (Node.js + Socket.io, rooms, position sync, authoritative server) | CRITICAL | 7–10d |
| 5.2 | Online PvP (full combat sync, room-by-link, arena selection, results screen) | CRITICAL | 7–10d |
| 5.3 | Matchmaking (Quick Play, win-based rating, queue with timeout) | MEDIUM | 5–7d |

**Milestone:** Two players fight in real-time. Room-by-link + Quick Play.

---

## 6. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sprite production bottleneck (each char needs ~9 animation sets) | HIGH | Start with placeholder rectangles. Art can be swapped in without code changes. Decouple art pipeline. |
| Phaser performance on low-end devices | MEDIUM | Budget: <200 sprites on screen, texture atlases, object pooling for projectiles/particles. Profile early. |
| AI feeling "dumb" or "unfair" | HIGH | Playtest early. Behavior tree is tunable without code changes. Add AI replay recording for debugging. |
| Multiplayer netcode complexity | HIGH | Phase 5 is intentionally last. Use rollback-free authoritative model (simpler). Accept ~100ms latency as OK. |
| Scope creep (combos, new chars, modes) | MEDIUM | Strict phase gates. MVP ships with 2 chars only. Feature requests go to backlog, not current sprint. |

---

## 7. Art Pipeline

**Current assets:**
- `design/sprites/`: Fish (tuna), Squid, Sakabambaspis — 128×128 static
- `design/sprites-2/`: Pufferfish, elemental fish, dark fish — static + animated GIFs + Piskel sources

**Needed for MVP:**
- Tuna & Carp spritesheets (idle 4f, walk 6f, jump 3f, light_attack 4f, heavy_attack 6f, special 6f, block 2f, hurt 3f, ko 4f)
- Sea arena background (parallax optional)
- Toy Fish + Pufferfish Cannon weapon sprites
- UI elements (HP bar, coin icon, menu buttons)

**Tool:** Piskel (free, web-based, already in use) or Aseprite for spritesheets.

**Format:** PNG spritesheets → Phaser texture atlas (JSON hash format).

---

## 8. Definition of Done (per Phase)

- [ ] All acceptance criteria from implementation plan met
- [ ] Zero critical bugs
- [ ] 60 FPS on mid-range laptop (Chrome)
- [ ] All tests passing
- [ ] Code reviewed and merged to main
- [ ] Deployed to staging environment
