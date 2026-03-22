# Progress Tracker

## Current Milestone: COMPLETE

## Completed Milestones
- **Milestone 1-7:** All complete (see git log for details)

## Iteration 2 Bugfixes
- Fixed WorldManager using hardcoded magic numbers instead of `pixelToHex()` for camera hex
- Fixed generation queue growing unbounded (now cleared each frame)
- Fixed floor change (Q/E) firing every frame — now edge-triggered via `wasJustPressed()`
- Fixed page flip (arrow keys in book viewer) firing every frame — now edge-triggered
- Fixed Escape key handling — now edge-triggered
- Improved BookPicker to calculate wall from cursor angle and slot/shelf from position
- Removed unused `screenToWorld` import from camera
- Added `endFrame()` to InputSystem for proper per-frame state clearing

## Verification Results
- `npx tsc --noEmit` — PASS (zero errors)
- `npx vitest run` — PASS (40 tests across 7 files)
- `npx vite build` — PASS (338KB game bundle)

## Blockers
_(none)_
