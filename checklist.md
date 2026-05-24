# ⚔️ Abaddon's Task Vessel: Feature Implementation Checklist

This checklist tracks the current completion status of all core game mechanics, ADHD coping strategies, and audio/integration components.

---

## 🔮 Core RPG & ADHD Mechanics

- [x] **Военный Штаб (Quest Hub)**
  - [x] Persistent character loading (skips setup if alive)
  - [x] Display status bars (HP, Mana, Fatigue)
  - [x] Quick-launch focus battles directly from the hub
- [x] **Procedural Lore Engine (120 variations of combat)**
  - [x] Custom enemy/boss names generated per task
  - [x] Contextual ADHD insights/weak points displayed for users
  - [x] Random combat modifiers/events (e.g. Double XP, Fog of War)
- [x] **Interactive Combat System**
  - [x] Step completion triggers physical damage to the enemy
  - [x] Floating damage numbers & shake on strike
  - [x] Active class spell casting (orange/white/purple screen flash, custom effects)
  - [x] Enemy retaliation damage after 90 seconds of inactivity
- [x] **AI Battle Resolution Chronicles**
  - [x] Victory chronicle (pride of victory, fallen enemy, overcoming fear of failure)
  - [x] Flee chronicle (tactical retreat, shadows of Abyss, promise of a stronger return)
  - [x] Crisis/Near-death chronicle (triggered at 10 HP, fall in the dirt, awakening at camp)
- [x] **Fatigue & Burnout System**
  - [x] Fatigue tracking based on work duration
  - [x] Lockout state (Burnout) at 300 minutes of active daily work
  - [x] Potion consumption (Stamina Potion) to restore HP and reduce Fatigue
  - [x] Runic recovery using Mana to override/reset Fatigue
- [x] **Expanded Class Roster & Multiclassing**
  - [x] Add Lightning Mage & Multiclasses (Fire/Stone, Lightning/Earth)
  - [x] Split the generic Knight into Wild Knight, Mercenary, Former Knight, and Assassin Knight
  - [x] Add Mental Sovereign (Psi-Telekinetic) class with mind control and Kopfplatzen commands
  - [x] Refine Plasmamancer (Ether Mage) spells to represent Ether/Matter/Space manipulation in melee (close-range blades) and mid-range (space warp) combat

---

## 🏕️ Break & NPC Encounter System (The Focus of This Task)

- [x] **Periodic Priests / Breaks**
  - [x] 30-Minute Mini-Break (Mini Prival)
  - [x] 1.5-Hour Big Prival (Campfire Rest)
  - [x] Automatic session pause and overlay triggering
- [x] **Activity Selectors**
  - [x] Dropdown select for Mini-Breaks (breathing, stretching, window watching, drinking water, etc.)
  - [x] Dropdown select for Big-Breaks (full feast, brewing potions, scouting walk, nap)
- [x] **NPC Encounter Architectures**
  - [x] **Мотиваторы (Motivating)**: Boost spirits and morale
  - [x] **Помощники (Helping)**: Provide helpful, lore-adjusted tips
  - [x] **Провокаторы (Provoking)**: Push the hero to return to action
  - [x] **Зеркала Истины (Mirrors of Truth)**: Highlight procrastinating sins, ask deep-reflection questions ("wouldn't be in the Abyss if you were kinder to yourself"), and offer redemption paths
- [x] **Contextual AI Adaptation (AI Tunnel / DeepSeek)**
  - [x] AI compiles personalized lore describing the chosen activity under the fantasy setting and character traits
  - [x] Fallback mechanisms if the AI server is offline or unreachable
- [x] **In-game Rewards**
  - [x] Mini prival gives +8 HP, +5 Mana, -10m Fatigue
  - [x] Big prival gives +20 HP, +15 Mana, -30m Fatigue

---

## 🎵 Soundscapes & Spotify integration

- [x] **Hybrid Sound Synthesizer**
  - [x] Play MP3 sound assets from the directory
  - [x] Browser-side procedural generation fallback (Web Audio API)
- [x] **Spotify OAuth PKCE & Web Playback SDK**
  - [x] Connection workflow for Premium accounts (using safe loopback IP: `127.0.0.1:5173`)
  - [x] Automated transfer of active playback device to the browser
  - [x] Session-state synced soundscapes (Dark Ambient, Cinematic Battle, Medieval Lutes, Low Drones)
  - [x] **[FIXED] Playback SDK Stability**: Solved the SDK script loading race condition and player instance cleanup, eliminating duplicate player instances and ensuring 100% reliable player initialization on every boot.

---

## ☀️ Legacy System & Hall of Fame

- [x] **Ritual of Redemption**
  - [x] Unlocked after completing 15 tasks (with at least 3 Boss Sieges)
  - [x] Generates AI-compiled eulogy summarizing the hero's actions, class, spelling, HP sacrifice, and meditation stats
  - [x] Immortalizes the hero in `data/pedestals.json` (Hall of Fame) and resets the character to start a new adventure
