---
'search-packages': patch
---

Build with tsdown (rolldown) instead of esbuild + `tsc`.

No API change: `cjs/index.js`, `cjs/package.json`, `esm/*.js` and `esm/*.d.ts` are all still
published at the same paths, and both entries expose the same exports. What changes is the
emitted code itself — it now comes from rolldown — plus `esm/*.js.map`, which ships alongside
the `ts/` sources the package already includes. `esm/index.d.ts.map` is no longer emitted for
the re-export barrel.
