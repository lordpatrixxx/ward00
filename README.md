# WARD 00 — The Monsoon Protocol

A cinematic narrative puzzle game for STORYVERSE / PRAXIS 2026, adapted from the original story **The City That Vanished From The Map**.

Play as Tara Naik. Restore a neighborhood missing from the city's flood-risk map, verify community evidence, prepare an evacuation, and make an accountable flood-response decision.

## Experience

- Six playable chapters, meaningful evidence gates, and alternate response outcomes.
- A skippable opening sequence on each page load, frosted-glass command room, dimensional city maps, atmospheric rain footage, and original procedural music.
- Community map scanning, animated evidence files, evacuation markers, live water-allocation controls, and a manual emergency-radio tuning puzzle.
- Local saved progress, isolated presentation checkpoints, volume control, reduced motion, keyboard controls, and untimed decisions.
- SDG 11, supported by SDGs 6, 10, and 13.

## Run locally

Serve `dist/` with any static HTTP server. For example:

```sh
python -m http.server 8765 --directory dist
```

Open `http://localhost:8765`. No installation or build dependencies are needed. Use **Enter with sound** to enable browser audio. Press **M** to toggle sound. Game data stays in this browser.

## Deploy

Import this repository into Vercel. The included `vercel.json` uses the **Other** framework preset, no installation/build command, and `dist` as its output directory. No environment variables or API keys are required. Only the static game directory is served.

## Presentation route

1. Show the boot sequence and introduce the missing neighborhood.
2. Open **Chapters → Open presentation mode → The missing ward**. Use **Scan community layer** and verify a landmark.
3. Select **The monsoon protocol** from presentation mode. The checkpoint has a balanced plan and verified prerequisites.
4. Authorize the plan, contact Nilofer, tune the radio to **96.0**, lock the signal, and hold the verified plan. Enable **Untimed decisions** when explaining this scene.
5. Choose three rebuilding priorities and show the city's legacy.

**Return to your story** restores the campaign. Presentation choices do not replace saved campaign progress.

## Source and checks

- `dist/app.js`: story and game interaction.
- `dist/model.mjs`: progression and fictional flow rules.
- `dist/city.js`: city map and rain rendering.
- `dist/audio.js`: procedural music and sound.
- `dist/experience.js`: boot, transitions, and interaction effects.
- `dist/styles.css`, `dist/control-room.css`: responsive visual design.

Run `node --test tests/model.test.mjs`. Seven rule tests cover progression, required evidence, malformed storage, presentation checkpoints, and the accepted flow combinations. The revised campaign and radio puzzle were also played through in Chromium, including both response outcomes and a 390px mobile viewport.

## Credits and media rights

Original story supplied by the participant. The implementation and procedural music were created with AI assistance. The fictional city illustration was generated with OpenAI ImageGen; its prompt is in `ASSET-NOTES.md`.

Downloaded atmospheric rain media and exact attribution are listed in `MEDIA-SOURCES.md` and the in-game credits. FASTILY's rain video is **CC BY-SA 4.0**; the bundled H.264 transcode retains that license. John Fowler's rain texture is **CC BY 2.0**. Francesco Gallarotti's rain-on-window image is **CC0**. Barlow Condensed and Manrope fonts use the bundled SIL Open Font License files. These licenses apply to their respective assets; no blanket open-source license is asserted for the original story or game.

Nayantara is fictional. Readings, capacities, and flow allocations are game abstractions, not emergency-management guidance. No account, analytics, remote AI request, or personal-data collection is required to play.
