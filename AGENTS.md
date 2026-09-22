# Future Molding — Agent Operating Guide

## Mission
Canonical process: CAD part -> mold -> material -> press/screw -> plastification -> filling -> V/P switchover -> holding -> cooling -> opening/ejection -> quality control.

## Branch safety
- Never commit directly to `main`.
- Integration branch: `fix/future-molding-final`.
- Parallel agents use dedicated branches/worktrees.
- Keep commits small and scoped; merge only after relevant checks are green.

## Agent ownership
### Engine agent
Owns `src/engine/**`: process physics, canonical types, V/P, holding, cushion, plastification, residence time, screw peripheral speed, gate freeze and machine limits.
Do not add independent formulas to `src/core/calcEngine.ts`; it is only a compatibility boundary.

### Simulation agent
Owns `src/cad/**`, `src/simulation/**` and Three.js simulation components.
Build selectable 3D gate, geometry-aware fill arrival, then thickness/viscosity/temperature effects.
Never describe the qualitative simulation as a validated Moldflow-class solver.

### UI agent
Owns Wizard, Academy and result presentation. UI is Italian.
Do not calculate molding physics in React components.

### QA agent
Owns regression tests, type checks, build, E2E and CI reliability.
Do not alter production physics merely to satisfy a test; fix the underlying contract.

## Shared domain rules
- CAD describes one molded part unless a value is explicitly a total.
- Mold configuration owns cavities, feed system, runners and gates.
- Total part volume = single-part volume * cavity count.
- Add cold-runner volume to each-cycle shot volume; do not treat hot-runner material retained in the mold as each-cycle shot.
- Scale projected area by cavities and applicable runner area exactly once.
- Press selection verifies feasibility; it must not redefine geometry.
- Keep units explicit. Volumetric injection flow is `cm3/s`; never label it `mm/s`.
- V/P and cushion must use a consistent full-shot/machine reference.
- Missing geometry must yield an explicit provisional result/warning, never a misleading physical zero.
- Projected area should evolve to a silhouette based on mold opening direction.

## CAD numerical guardrails
- OCCT STEP/IGES coordinates are millimetres.
- Convert volume mm3 -> cm3 and area mm2 -> cm2.
- Reject CAD volume greater than bounding-box volume except numerical tolerance.
- Never render raw STEP/IGES blobs as GLTF.

## Regression reference
Reference CAD: `Frutto (1).stp`.
Last verified: volume ~4.326812 cm3; projected-area estimate ~7.04 cm2; bbox ~17.6 x 40 x 27.9 mm.
For PP, regression clamp references: ~2.3 t at 1 cavity and ~9.3 t at 4 cavities. These are regression references, not universal physical truth.

## Simulation roadmap
1. Select gate on rendered surface via raycasting; store model-local coordinates.
2. Show gate marker and support reselection/reset.
3. Build mesh-surface adjacency and compute qualitative arrival from the gate.
4. Replace axis clipping with arrival-field visualization.
5. Add local thickness, material viscosity and temperature effects.
6. Later add pressure drop, last-to-fill, weld-line and air-trap indicators.
A true volumetric solver requires a volumetric mesh plus validated rheological/numerical models.

## Architecture
- One canonical engine feeds Wizard, simulation, Academy and defect diagnosis.
- `src/core/calcEngine.ts` may adapt legacy callers but contains no independent molding formulas.
- Stores orchestrate state, not physics.
- UI displays engine outputs, not recalculated physics.
- If agents need the same shared file, coordinate through integration rather than editing it concurrently.

## Required checks
For production/calculation changes:
- `npm test -- --runInBand`
- `npm run build`
Run typecheck/E2E where relevant.
CAD/simulation changes also require a real STEP visual check before integration when local access is needed.

## Stop conditions
- Never merge to `main` without explicit owner approval.
- Never remove numerical safety guards just to pass a case.
- Never hide warnings for missing physical inputs.
