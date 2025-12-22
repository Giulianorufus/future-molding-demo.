# Dev scripts

Utilities to run profile builders locally for debugging and verification.

Usage examples:

- Run the debug printer (ABS sample):

```powershell
npx tsx scripts/dev/debug_profiles.ts
```

- Run multiple sample profiles:

```powershell
npx tsx scripts/dev/runProfiles.ts
```

Notes:
- These scripts import internal engine modules (from `src/engine`) and are intended for local developer use only.
- Keep them under `scripts/dev/` so they are not packaged or confused with production scripts.
