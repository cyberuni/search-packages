# search-packages

## 2.2.2

### Patch Changes

- 82e4280: Build with tsdown (rolldown) instead of esbuild + `tsc`.
  
  No API change: `cjs/index.js`, `cjs/package.json`, `esm/*.js` and `esm/*.d.ts` are all still
  published at the same paths, and both entries expose the same exports. What changes is the
  emitted code itself — it now comes from rolldown — plus `esm/*.js.map`, which ships alongside
  the `ts/` sources the package already includes. `esm/index.d.ts.map` is no longer emitted for
  the re-export barrel.

## 2.2.1

### Patch Changes

- c665078: Update repository URLs after the repo moved from `unional/search-packages` to
  `cyberuni/search-packages`. GitHub redirects the old paths, but `repository`,
  `homepage`, and `bugs` now point at the real location — `repository` in particular is
  read when generating provenance attestations.

## 2.2.0

### Minor Changes

- f71234e: Replace the `npm search` shell-out with a direct `fetch()` against the npm registry search API.

  `searchByKeywords()` no longer spawns a child process, so it no longer needs `npm` on `PATH` — it
  works for standalone CLI installs and under bun/deno, and it drops the ~100ms process-spawn cost
  that made this package a measurable share of a consuming CLI's startup time.

  The public API is source-compatible: `searchByKeywords(keywords)` and
  `searchByKeywords(keywords, fields)` behave as before. New in this release:

  - An optional third `options` argument: `registry`, `maxResults`, `signal`, and `fetch`.
  - `fetchPackagesByKeywords()` is exported for callers that want the raw registry packages plus a
    `truncated` flag. `hasAllKeywords` and `pickPackagesWithKeywords` are exported too.
  - Results are paged 250 at a time up to a documented default cap of 1000; pass
    `{ maxResults: Number.POSITIVE_INFINITY }` to page through everything.
  - The second overload's return type is corrected from
    `Promise<Record<string, any> & { name: string }[]>` to
    `Promise<(Record<string, any> & { name: string })[]>`, which is what it always returned at runtime.

  `engines.node` is now `>= 18` for the global `fetch`.
