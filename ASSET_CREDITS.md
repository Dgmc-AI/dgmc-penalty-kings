# Asset provenance

## Footballers

**Soccer player, standing — Micah**, by Innerscene, adapted from MakeHuman CC0 assets.

- Source: https://www.innerscene.com/tools/library/3d-parts/soccer-player-standing-3d-person-team-sports-f55b1b4f
- Original download: https://www.innerscene.com/api/library/soccer-player-standing-3d-person-team-sports-f55b1b4f/download
- License: CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/
- Source confirms permission to use, modify and redistribute commercially.
- Local file: `public/models/footballer.glb`.
- Modifications: embedded textures resized to 768px and compressed to WebP; mesh decimated for mobile rendering; metadata removed; custom skeletal skin weights and procedural animations added at runtime; DGMC kits and jersey branding; goalkeeper gloves; supplied static football removed.
- No third-party player likeness is claimed; this is a fictional adult character.

## Other art and audio

Stadium, pitch texture, goal and net, crowd geometry, football texture, visual effects, interface, kick and whistle effects are original assets created for DGMC Penalty Kings.

## Fonts and libraries

Barlow and Barlow Condensed: Google Fonts, SIL Open Font License. Fonts have local browser fallbacks.
Three.js: MIT License. Vite: MIT License. Playwright: Apache-2.0.

## Recorded stadium audio (CC0)

All crowd recordings are by **Philipp Feit / itmightgetloud**, recorded at FC St. Pauli’s Millerntor Stadium. Each source explicitly dedicates the recording to [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), permitting commercial use, modification and redistribution. Downloaded from Freesound’s public high-quality MP3 previews; no paid assets or account required.

- [General Ambience 01](https://freesound.org/people/itmightgetloud/sounds/829454/): `ambience.mp3`, 60-second stereo excerpt, normalized and faded. Runtime uses a four-second overlap to smooth loop transitions.
- [Goal 01](https://freesound.org/people/itmightgetloud/sounds/829455/): `goal-1.mp3`, `goal-2.mp3`, two different 8–9 second excerpts.
- [Excited 01](https://freesound.org/people/itmightgetloud/sounds/829453/): `save-1.mp3`, `save-2.mp3`, two excited short crowd reactions used for saves.
- [Chance Missed 01](https://freesound.org/people/itmightgetloud/sounds/829452/): `miss-1.mp3`, `miss-2.mp3`, two disappointed crowd reactions.

Edits are reproducible with `python scripts/prepare-audio.py` (Python 3 + ffmpeg). MP3 stereo at 44.1 kHz/128 kbps supports Safari, including iPhone and iPad. Kick and referee whistle remain original synthesized effects; the crowd is recorded audio.
