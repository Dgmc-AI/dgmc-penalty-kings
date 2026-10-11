# DGMC Penalty Kings verification

Date: 2026-10-11. Existing repository: `Dgmc-AI/dgmc-penalty-kings`.
Existing Vercel project: `prj_nQeeOAOeXjY8TbRjZgN0f7DFVA7A`.
Public game: https://dgmc-penalty-kings.vercel.app

## Local checks

- Production build: passed (Vite; the Three.js vendor chunk emits a size advisory).
- Unit/regression tests: **8 passed**, including the shipped character's fingertips and shirt hem, regulation, repeated sudden death, resets, goal/save/miss judging, difficulty and storage failure.
- Browser gameplay/control regression suite: **9 passed**, 3 each on desktop Chromium, iPhone 13 WebKit and iPad Pro 11 WebKit; 10.4 minutes total.
- Each browser completed real-input shootouts, verified moving balls and reacting keepers, scores and paired rounds, results, replay, restart, saved high scores and audio controls.
- Keeper tests saved left, right and central shots; a wrong-side dive conceded; restarting during defence cleared the match. Desktop keyboard and mobile pointer swipes/buttons were exercised.
- Sudden-death tests took five actual wide shots per side, confirmed a draw, then took a winning sixth shot and waited for the opponent's paired sixth shot before finishing.
- Mobile full-match tests additionally rotated to 844×390 landscape and shot/defended again.
- All seven recorded MP3 files decoded in the browser audio engine. AudioContext ran after user activation; ambience sources played, crowd reactions dispatched, and mute stopped the ambience.
- No uncaught browser errors in the full-match tests.

## Graphics checks

Close-up browser inspection covered ready, kicking, full diving and celebration poses. The fingertip-to-thigh and shirt-to-arm skinning artifacts were removed. The final kick refinement was separately inspected at t=0.15, 0.35, 0.55, 0.70 and 1.00. Maximum measured mesh edge was 0.20945 m (an unchanged sock edge) across these poses, dives and celebrations; no long arm-to-hip triangles remained.

The full regression run preceded the final knee/contact refinement. After that refinement, full-match checks passed on the deployed Git preview on desktop, iPhone WebKit and iPad WebKit. Deployed JavaScript and CSS hashes matched the local production build. An initial desktop network assertion incorrectly counted Vercel preview-toolbar requests; the assertion now checks game asset requests, and the desktop rerun passed. All three crowd reaction types played during the desktop rerun. Final public-production verification is recorded in PR #1 and the release report.

## Test environment

Mobile tests use Playwright WebKit with iPhone/iPad viewport, user-agent and touch profiles. These are browser emulation tests, not physical Apple-device tests. Linux WebKit uses locally supplied system libraries. No TLS bypass or authenticated Vercel bypass is used for public game tests.

Asset sources, CC0 licences and audio edit instructions are in `ASSET_CREDITS.md`. No paid services or assets were used.
