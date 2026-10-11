# DGMC Penalty Kings

**Play:** https://dgmc-penalty-kings.vercel.app

A playable Three.js football shootout for DGMC AI Consultancy. Mobile Safari touch controls and desktop mouse/keyboard controls, three AI keeper difficulties, five paired penalties and sudden death, animated licensed CC0 footballers, stadium ambience and local high scores.

## Run

```sh
npm ci
npm run dev
```

## Build and verification

```sh
npm run build
npm test
npx playwright install --with-deps chromium webkit
npm run preview -- --port 4173
BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

Browser tests actually shoot and defend penalties, check all three dive directions and successful/wrong-side saves, decode every recorded MP3, observe ball movement and keeper reactions, finish matches, verify scores, restart during a shot, replay, toggle sound and reload persisted scores. Projects cover desktop Chromium and mobile WebKit with iPhone 13 and iPad Pro viewport/touch profiles. This is browser emulation, not testing on physical Apple devices. Unit tests exercise regulation, repeated sudden death, resets, goal/save/miss judging, difficulty and unavailable storage.

## Play

1. Choose Rookie, Pro or Legend and press Start Game.
2. Tap/click a point inside the goal to shoot. Swipe upwards across the pitch; horizontal movement selects the corner and vertical distance selects height.
3. The on-screen Shoot button uses the reticle. Desktop arrow keys aim; Space/Enter shoots when the canvas has focus.
4. After every shot you play as the goalkeeper. Watch the rival’s run-up, then swipe sideways, tap Dive left / Stay central / Dive right, or use ← / ↓ / → on desktop. Dive timing and position decide saves; you can change your choice before contact.
5. Both teams take five penalties. Tied matches enter paired sudden-death shots until there is a winner.
6. Restart resets the entire current match. Play Again starts a clean match at the selected difficulty.

Audio begins only after the Sound button is activated, in accordance with mobile browser gesture requirements. High scores are the top five matches saved on the current browser/device; private storage restrictions are handled gracefully. The game works without a login or backend.

## Deployment

Vercel configuration is included (`vercel.json`); output is `dist`. The existing GitHub repository is `Dgmc-AI/dgmc-penalty-kings`, connected to the existing Vercel project `dgmc-penalty-kings`. Production deploys from `main`. Keep deployment protection disabled for public play. No secret environment variables or paid services are required.

## Art provenance

See [ASSET_CREDITS.md](ASSET_CREDITS.md). Textured footballers are derived from a licensed CC0 Innerscene/MakeHuman model and fitted with custom animation rigs. Stadium art is original. Crowd audio uses free CC0 stereo recordings from a real football stadium, with separate goal, save and miss reactions. The game does not depend on runtime external 3D downloads.
