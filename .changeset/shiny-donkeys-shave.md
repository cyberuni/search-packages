---
'search-packages': patch
---

Move the TypeScript sources from `ts/` to `src/`.

No API change: `cjs/index.js`, `esm/*.js` and `esm/*.d.ts` are all still published at the same
paths, and both entries expose the same exports. What moves is the sources shipped alongside
them — the package now includes `src/` instead of `ts/`, and the `esm/*.js.map` / `esm/*.d.ts.map`
sourcemaps resolve against that directory.
